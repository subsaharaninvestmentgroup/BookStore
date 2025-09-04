
"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutComplete() {
  const params = useSearchParams();
  const reference = params.get('reference');
  const [status, setStatus] = React.useState<'pending' | 'success' | 'failed' | 'verifying'>('verifying');
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setError('No payment reference found');
      return;
    }

    const verify = async () => {
      try {
        console.log('Verifying transaction:', reference);
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference,
            metadata: {
              email: localStorage.getItem('checkout_email'),
              name: localStorage.getItem('checkout_name'),
              bookId: localStorage.getItem('checkout_bookId'),
              address: localStorage.getItem('checkout_address'),
              phone: localStorage.getItem('checkout_phone'),
              purchaseFormat: localStorage.getItem('checkout_purchaseFormat'),
            }
          }),
        });
        const data = await res.json();
        console.log('Verify response:', data);
        
        if (data && data.success) {
          setStatus('success');
          setError(null);
        } else {
          console.warn('Verify failed:', data);
          setStatus('failed');
          setError(data);
        }
      } catch (err) {
        console.error('Verify error:', err);
        setStatus('failed');
        setError(String(err));
      }
    };
    verify();
  }, [reference]);

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto text-center">
        {status === 'verifying' && (
          <div className="p-8 bg-muted rounded-lg">
            <h2 className="text-2xl font-semibold">Verifying payment...</h2>
            <p className="mt-2 text-sm text-muted-foreground">Please wait while we confirm your transaction.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="p-8 bg-muted rounded-lg">
            <h2 className="text-3xl font-extrabold text-center text-green-600">Payment successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">Thank you — a confirmation has been sent to your email.</p>
            <div className="mt-6 flex justify-center">
              <a href="/store" className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-md">Return to Store</a>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="p-6 bg-muted rounded-lg">
            <h2 className="text-2xl font-semibold text-red-600">Payment could not be verified</h2>
            <p className="mt-2 text-sm text-muted-foreground">If you were charged, contact support and provide the reference below.</p>
            <div className="mt-4 p-4 bg-background rounded">
              <div className="text-sm">Reference</div>
              <div className="font-mono mt-1">{reference}</div>
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <a href="/store" className="inline-flex items-center px-5 py-2 border rounded-md">Return to Store</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
