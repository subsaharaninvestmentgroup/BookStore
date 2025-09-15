
import { NextResponse } from 'next/server';
import { recordOrder, fulfillOrder, createOrUpdateCustomerFromOrder } from '@/lib/fulfillment';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, runTransaction, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { Book, Order } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = body?.reference;
    const clientMetadata = body?.metadata || {};
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return NextResponse.json({ error: 'missing key' }, { status: 500 });

    if (!reference) return NextResponse.json({ error: 'missing reference' }, { status: 400 });

    // Deterministic order doc ID (payment reference) for strong idempotency
    const orderRefDeterministic = doc(db, 'orders', reference);
    const existingOrderSnap = await getDoc(orderRefDeterministic);
    if (existingOrderSnap.exists()) {
      console.log('Order already exists (deterministic id) for reference:', reference);
      return NextResponse.json({ success: true, orderId: existingOrderSnap.id, message: 'Order already processed' });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    });
    const data = await res.json();

    // Return full data when not successful so client can inspect
    if (data.status && data.data && data.data.status === 'success') {
      const transactionData = data.data;
      const paystackMetadata = transactionData.metadata || {};

      // Combine metadata from Paystack and client for robustness
      const finalMetadata = { ...paystackMetadata, ...clientMetadata };

      const bookId = finalMetadata?.bookId;
      if (!bookId) {
        console.error('Missing bookId in metadata');
        return NextResponse.json({ success: false, error: 'Missing book information' });
      }

      let bookData: Book | null = null;
      const bookRef = doc(db, 'books', bookId);
      const bookSnap = await getDoc(bookRef);
      if (!bookSnap.exists()) {
        console.error('Book not found:', bookId);
        return NextResponse.json({ success: false, error: 'Book not found' });
      }
      bookData = bookSnap.data() as Book;

  const purchaseFormat = finalMetadata.purchaseFormat || 'physical';
  let quantity = parseInt(String(finalMetadata.quantity || '1'), 10);
  if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
  if (purchaseFormat === 'digital') quantity = 1; // Force digital single copy
  const isDigital = purchaseFormat === 'digital' && !!bookData?.digitalFile;

      // Validate required fields
      const customerName = finalMetadata?.name || transactionData.customer?.first_name;
      const customerEmail = transactionData.customer?.email || finalMetadata?.email;
      const amount = transactionData.amount / 100;

      if (!customerEmail) {
        console.error('Missing customer email');
        return NextResponse.json({ success: false, error: 'Missing customer email' });
      }

      if (!customerName) {
        console.error('Missing customer name');
        return NextResponse.json({ success: false, error: 'Missing customer name' });
      }

      const address = finalMetadata?.address || '';
      const phone = finalMetadata?.phone || '';

      // Validate amount matches book price (within reasonable tolerance for currency conversion)
      const expectedAmount = bookData.price * quantity;
      const tolerance = 0.01; // 1 cent tolerance
      if (Math.abs(amount - expectedAmount) > tolerance) {
        console.error(`Amount mismatch: expected ${expectedAmount}, got ${amount}`);
        return NextResponse.json({ success: false, error: 'Payment amount does not match book price' });
      }

      // Clean up the order item data
      const orderItem = {
        bookId: bookId,
        quantity: quantity,
        bookTitle: bookData.title,
        // Only include digitalFileUrl for digital purchases
        ...(isDigital && bookData?.digitalFile?.url ? { digitalFileUrl: bookData.digitalFile.url } : {})
      };

      // Build the order with clean data
      const order: Omit<Order, 'id' | 'date'> = {
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: phone,
  items: [orderItem],
  amount: amount,
  quantity: quantity,
        paymentStatus: 'Paid',
        shippingStatus: isDigital ? 'Delivered' : 'Processing',
        paymentReference: reference,
        digital: isDigital,
        address: address,
        purchaseFormat: purchaseFormat
      };

      // Use transaction to ensure atomic order creation and customer update
      let savedOrderId: string | undefined;
      try {
        await runTransaction(db, async (transaction) => {
          // Inside transaction re-read deterministic order doc
          const existing = await transaction.get(orderRefDeterministic);
          if (existing.exists()) {
            throw new Error('DUPLICATE_ORDER');
          }

          // Stock check & decrement for physical copies
          if (!isDigital) {
            const freshBookSnap = await transaction.get(bookRef);
            if (!freshBookSnap.exists()) throw new Error('BOOK_NOT_FOUND');
            const freshBookData = freshBookSnap.data() as Book;
            const currentStock = freshBookData.stock ?? 0;
            if (currentStock < quantity) {
              throw new Error('INSUFFICIENT_STOCK');
            }
            transaction.update(bookRef, { stock: currentStock - quantity });
          }

            // Create order with deterministic id
            transaction.set(orderRefDeterministic, {
              ...order,
              id: orderRefDeterministic.id,
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
            });
            savedOrderId = orderRefDeterministic.id;

            // Update customer
            await updateCustomerInTransaction(transaction, {
              name: customerName,
              email: customerEmail,
              amount: amount,
              address: address,
              phone: phone,
            });
        });

        if (!savedOrderId) {
          throw new Error('Failed to create order');
        }

        // Fulfill order outside transaction since it involves external services
        const fullOrder: Order = { ...order, id: savedOrderId, date: new Date().toISOString() };
        await fulfillOrder(fullOrder);

        return NextResponse.json({ success: true, orderId: savedOrderId });
      } catch (error) {
        const err = error as Error;
        if (err.message === 'DUPLICATE_ORDER') {
          console.log('Duplicate (race) detected, returning existing');
          return NextResponse.json({ success: true, orderId: orderRefDeterministic.id, message: 'Order already processed' });
        } else if (err.message === 'INSUFFICIENT_STOCK') {
          return NextResponse.json({ success: false, error: 'Insufficient stock' });
        } else if (err.message === 'BOOK_NOT_FOUND') {
          return NextResponse.json({ success: false, error: 'Book not found' });
        }
        throw error;
      }
    }

    console.warn('Paystack verify returned non-success', { reference, data });
    return NextResponse.json({ success: false, detail: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

// Helper function to update customer within a transaction
async function updateCustomerInTransaction(
  transaction: any,
  details: { name: string; email: string; amount: number; address: string; phone?: string }
) {
  if (!details.email) return;

  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('email', '==', details.email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Customer does not exist, create a new one
    const newCustomerRef = doc(customersRef);
    const newCustomerData = {
      id: newCustomerRef.id,
      name: details.name || 'Customer',
      email: details.email,
      phone: details.phone || '',
      joinDate: new Date().toISOString().split('T')[0],
      totalOrders: 1,
      totalSpent: details.amount,
      address: details.address || '',
      isAdmin: false,
    };

    transaction.set(newCustomerRef, newCustomerData);
  } else {
    // Customer exists, update their record
    const customerDoc = querySnapshot.docs[0];
    const customerRef = customerDoc.ref;
    const currentData = customerDoc.data();

    const newTotalOrders = (currentData.totalOrders || 0) + 1;
    const newTotalSpent = (currentData.totalSpent || 0) + details.amount;

    const updateData: Record<string, any> = {
      totalOrders: newTotalOrders,
      totalSpent: newTotalSpent,
      name: details.name || currentData.name || 'Customer',
      lastOrderDate: new Date().toISOString().split('T')[0],
    };

    if (details.address?.trim()) {
      updateData.address = details.address;
    }
    if (details.phone?.trim()) {
      updateData.phone = details.phone;
    }

    transaction.update(customerRef, updateData);
  }
}
