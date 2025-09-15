
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) return NextResponse.json({ error: 'Paystack secret not configured' }, { status: 500 });

    // Comprehensive validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!body.bookId || typeof body.bookId !== 'string') {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    if (!body.metadata || typeof body.metadata !== 'object') {
      return NextResponse.json({ error: 'Metadata is required' }, { status: 400 });
    }

    // Validate metadata fields
    const { metadata } = body;
    if (!metadata.name || typeof metadata.name !== 'string') {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    if (!metadata.bookId || typeof metadata.bookId !== 'string') {
      return NextResponse.json({ error: 'Book ID in metadata is required' }, { status: 400 });
    }

    // Quantity validation (default 1)
    const rawQty = Number(metadata.quantity || 1);
    if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 99) {
      return NextResponse.json({ error: 'Quantity must be an integer between 1 and 99' }, { status: 400 });
    }

    // For physical purchases, require shipping info
    if (metadata.purchaseFormat !== 'digital') {
      if (!metadata.address || typeof metadata.address !== 'string' || metadata.address.trim().length === 0) {
        return NextResponse.json({ error: 'Shipping address is required for physical purchases' }, { status: 400 });
      }
      if (!metadata.phone || typeof metadata.phone !== 'string' || metadata.phone.trim().length === 0) {
        return NextResponse.json({ error: 'Phone number is required for physical purchases' }, { status: 400 });
      }
    }

    const quantity = metadata.purchaseFormat === 'digital' ? 1 : rawQty;

    const payload = {
      email: body.email.trim(),
      amount: Math.round(body.amount), // Expect client already multiplied by quantity
      metadata: {
        ...body.metadata,
        quantity,
        unitPrice: body.amount / quantity / 100, // approximate unit price back out if needed
        initiatedAt: new Date().toISOString(),
      },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/store/checkout/complete`,
      reference: `BST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // Generate unique reference
    };

    console.log('Initiating Paystack payment for:', { email: body.email, amount: body.amount, bookId: body.bookId });

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

    console.log('Paystack payment initiated successfully:', data.data?.reference);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Payment initiation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
