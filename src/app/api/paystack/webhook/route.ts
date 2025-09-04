import { NextResponse } from 'next/server';
import { buffer } from 'node:stream/consumers';
import crypto from 'crypto';
import { recordOrder, fulfillOrder } from '@/lib/fulfillment';

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
    if (event.event === 'charge.success' || event.event === 'transfer.success') {
      const data = event.data;
      const metadata = data.metadata || {};
      const order = {
        customerName: metadata.name || data.customer?.first_name || 'Customer',
        customerEmail: data.customer?.email || metadata.email,
        items: [{ bookId: metadata.bookId, quantity: 1 }],
        amount: data.amount / 100,
        paymentStatus: data.status === 'success' ? 'Paid' : 'Pending',
        shippingStatus: 'Processing',
        paymentReference: data.reference,
        digital: true,
        address: metadata.address || '',
      };

      const saved = await recordOrder(order);
      await fulfillOrder({ ...order, id: saved.id });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('webhook error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
