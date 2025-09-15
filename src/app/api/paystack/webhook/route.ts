import { NextResponse } from 'next/server';
import { buffer } from 'node:stream/consumers';
import crypto from 'crypto';
import { recordOrder, fulfillOrder } from '@/lib/fulfillment';
import type { Order } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, runTransaction, doc, serverTimestamp, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
    const signature = req.headers.get('x-paystack-signature') || '';

    const raw = await req.text();
    const expected = crypto.createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      console.warn('Invalid webhook signature');
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const event = JSON.parse(raw);

    // Only process charge.success events
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      if (!reference) {
        console.warn('Webhook missing reference');
        return NextResponse.json({ ok: false, error: 'Missing reference' }, { status: 400 });
      }

      // Deterministic order doc ID for idempotency
      const orderRefDeterministic = doc(db, 'orders', reference);
      const existingOrderSnap = await getDoc(orderRefDeterministic);
      if (existingOrderSnap.exists()) {
        console.log('Webhook: order already exists (deterministic id) reference:', reference);
        return NextResponse.json({ ok: true, message: 'Order already processed' });
      }

      const metadata = data.metadata || {};

      // Validate required fields
      if (!metadata.bookId) {
        console.warn('Webhook missing bookId in metadata');
        return NextResponse.json({ ok: false, error: 'Missing book information' }, { status: 400 });
      }

      const customerName = metadata.name || data.customer?.first_name;
      const customerEmail = data.customer?.email || metadata.email;

      if (!customerEmail) {
        console.warn('Webhook missing customer email');
        return NextResponse.json({ ok: false, error: 'Missing customer email' }, { status: 400 });
      }

      if (!customerName) {
        console.warn('Webhook missing customer name');
        return NextResponse.json({ ok: false, error: 'Missing customer name' }, { status: 400 });
      }

  const purchaseFormat = metadata.purchaseFormat || 'physical';
  let quantity = parseInt(String(metadata.quantity || '1'), 10);
  if (!Number.isFinite(quantity) || quantity < 1) quantity = 1;
  if (purchaseFormat === 'digital') quantity = 1;
  const amount = data.amount / 100;

      // Build order data with explicit typing to satisfy Order
      const order: Omit<Order, 'id' | 'date'> = {
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: (metadata.phone || '') as string,
        items: [{
          bookId: metadata.bookId as string,
          quantity: quantity,
          bookTitle: (metadata.bookTitle || 'Book') as string,
        }],
        amount: amount,
        quantity: quantity,
        paymentStatus: 'Paid',
        shippingStatus: (purchaseFormat === 'digital' ? 'Delivered' : 'Processing'),
        paymentReference: reference as string,
        digital: purchaseFormat === 'digital',
        address: (metadata.address || '') as string,
        purchaseFormat: purchaseFormat,
      };

      // Use transaction for atomic order creation
      let savedOrderId: string | undefined;
      try {
        await runTransaction(db, async (transaction) => {
          // Transaction-level duplicate guard
          const existing = await transaction.get(orderRefDeterministic);
          if (existing.exists()) throw new Error('DUPLICATE_ORDER');

          // Stock check & decrement for physical
          if (purchaseFormat !== 'digital') {
            const bookRef = doc(db, 'books', metadata.bookId as string);
            const freshBookSnap = await transaction.get(bookRef);
            if (!freshBookSnap.exists()) throw new Error('BOOK_NOT_FOUND');
            const currentStock = (freshBookSnap.data() as any).stock ?? 0;
            if (currentStock < quantity) {
              throw new Error('INSUFFICIENT_STOCK');
            }
            transaction.update(bookRef, { stock: currentStock - quantity });
          }

          // Create order
          transaction.set(orderRefDeterministic, {
            ...order,
            id: orderRefDeterministic.id,
            date: new Date().toISOString(),
            createdAt: serverTimestamp(),
          });
          savedOrderId = orderRefDeterministic.id;
        });

        if (!savedOrderId) {
          throw new Error('Failed to create order');
        }

        // Fulfill order outside transaction
  const fullOrder: Order = { ...order, id: savedOrderId, date: new Date().toISOString() };
  await fulfillOrder(fullOrder);

        console.log('Webhook processed successfully for reference:', reference);
        return NextResponse.json({ ok: true });
      } catch (error) {
        const err = error as Error;
        if (err.message === 'DUPLICATE_ORDER') {
          console.log('Webhook duplicate race acknowledged for reference:', reference);
          return NextResponse.json({ ok: true, message: 'Order already processed' });
        } else if (err.message === 'INSUFFICIENT_STOCK') {
          console.warn('Webhook insufficient stock for reference', reference);
          return NextResponse.json({ ok: false, error: 'Insufficient stock' }, { status: 409 });
        } else if (err.message === 'BOOK_NOT_FOUND') {
          return NextResponse.json({ ok: false, error: 'Book not found' }, { status: 404 });
        }
        console.error('Webhook processing error:', err);
        return NextResponse.json({ ok: false, error: 'Failed to process order' }, { status: 500 });
      }
    }

    // For other events, just acknowledge receipt
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
