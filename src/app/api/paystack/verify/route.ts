import { NextResponse } from 'next/server';
import { recordOrder, fulfillOrder, createOrUpdateCustomerFromOrder } from '@/lib/fulfillment';

export async function POST(req: Request) {
  try {
  const body = await req.json();
  const reference = body?.reference;
  const metadata = body?.metadata || {};
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
      // Build order
      const psMeta = data.data.metadata || {};
      const customerName = psMeta?.name || metadata?.name || data.data.customer?.first_name || 'Customer';
      const customerEmail = data.data.customer?.email || psMeta?.email || metadata?.email;
      const amount = data.data.amount / 100;

      const order = {
        customerName,
        customerEmail,
        items: [{ bookId: psMeta?.bookId || metadata?.bookId, quantity: 1 }],
        amount,
        paymentStatus: 'Paid',
        shippingStatus: 'Processing',
        paymentReference: reference,
        digital: true,
        address: psMeta?.address || metadata?.address || '',
      };
      const saved = await recordOrder(order);
      await fulfillOrder({ ...order, id: saved.id });
      await createOrUpdateCustomerFromOrder({
        name: customerName,
        email: customerEmail,
        amount,
        address: order.address
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
