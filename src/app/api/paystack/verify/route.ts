
import { NextResponse } from 'next/server';
import { recordOrder, fulfillOrder, createOrUpdateCustomerFromOrder } from '@/lib/fulfillment';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Book, Order } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = body?.reference;
    const clientMetadata = body?.metadata || {};
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return NextResponse.json({ error: 'missing key' }, { status: 500 });

    if (!reference) return NextResponse.json({ error: 'missing reference' }, { status: 400 });

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
      let bookData: Book | null = null;
      if (bookId) {
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);
        if(bookSnap.exists()) {
          bookData = bookSnap.data() as Book;
        }
      }

      const purchaseFormat = finalMetadata.purchaseFormat || 'physical';
      const isDigital = purchaseFormat === 'digital' && !!bookData?.digitalFile;

      // Build order
      const customerName = finalMetadata?.name || transactionData.customer?.first_name || 'Customer';
      const customerEmail = transactionData.customer?.email || finalMetadata?.email;
      const amount = transactionData.amount / 100;
      const address = finalMetadata?.address || '';
      const phone = finalMetadata?.phone || '';

      // Clean up the order item data
      const orderItem = {
        bookId: bookId || null,
        quantity: 1,
        bookTitle: bookData?.title || 'Unknown Book',
        // Only include digitalFileUrl for digital purchases
        ...(isDigital && bookData?.digitalFile?.url ? { digitalFileUrl: bookData.digitalFile.url } : {})
      };

      // Build the order with clean data
      const order: Omit<Order, 'id' | 'date'> = {
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        customerPhone: phone || '',
        items: [orderItem],
        amount: amount || 0,
        paymentStatus: 'Paid',
        shippingStatus: isDigital ? 'Delivered' : 'Processing',
        paymentReference: reference,
        digital: isDigital,
        address: address || '',
        purchaseFormat: purchaseFormat || 'physical'
      };

      // Remove any remaining undefined values
      const cleanOrder = Object.entries(order).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        } else if (key === 'items') {
          // Ensure items is always an array
          acc[key] = [];
        } else {
          // Provide appropriate default values based on field type
          acc[key] = typeof value === 'string' ? '' : 0;
        }
        return acc;
      }, {} as Record<string, any>);
      
      const saved = await recordOrder(cleanOrder);
      await fulfillOrder({ ...cleanOrder, id: saved.id, date: new Date().toISOString() } as Order);
      await createOrUpdateCustomerFromOrder({
        name: customerName || 'Customer',
        email: customerEmail || '',
        amount: amount || 0,
        address: address || '',
        phone: phone || '',
      });
      return NextResponse.json({ success: true, orderId: saved.id });
    }

    console.warn('Paystack verify returned non-success', { reference, data });
    return NextResponse.json({ success: false, detail: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
