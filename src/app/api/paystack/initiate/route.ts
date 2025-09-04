import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return NextResponse.json({ error: 'Paystack secret not configured' }, { status: 500 });

    // Basic validation
    if (!body || !body.email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 });
    }
    if (!body.amount || Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const payload = {
      email: body.email,
      amount: body.amount,
      metadata: { name: body.name, bookId: body.bookId },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/store/checkout/complete`,
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    // If Paystack returns an error, forward a helpful message
    if (!data || data.status === false) {
      const message = data?.message || 'Paystack initialization failed';
      console.error('Paystack init failed:', message, data);
      return NextResponse.json({ error: message, detail: data }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
