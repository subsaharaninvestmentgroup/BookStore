
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { recordOrder, fulfillOrder, createOrUpdateCustomerFromOrder } from '@/lib/fulfillment';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Book, Order } from '@/lib/types';

function CheckoutCompleteContent() {
  const params = useSearchParams();
  const reference = params.get('reference');
  const [status, setStatus] = React.useState<'pending' | 'success' | 'failed' | 'verifying'>('verifying');
  const [error, setError] = React.useState<any>(null);

  const verify = React.useCallback(async () => {
    if (!reference) {
      setStatus('failed');
      setError({ message: 'No payment reference found', code: 'MISSING_REFERENCE' });
      return;
    }

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
            purchaseFormat: localStorage.getItem('checkout_purchaseFormat'),
            quantity: localStorage.getItem('checkout_quantity'),
          }
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Verification failed with status:', res.status, errorData);
        setStatus('failed');
        setError({
          message: errorData.error || 'Payment verification failed',
          code: 'VERIFICATION_FAILED',
          details: errorData
        });
        return;
      }

      const data = await res.json();
      console.log('Verify response:', data);

      if (data && data.success) {
        setStatus('success');
        setError(null);

        // Clear checkout data from localStorage
        localStorage.removeItem('checkout_email');
        localStorage.removeItem('checkout_name');
        localStorage.removeItem('checkout_bookId');
        localStorage.removeItem('checkout_address');
        localStorage.removeItem('checkout_phone');
        localStorage.removeItem('checkout_purchaseFormat');
  localStorage.removeItem('checkout_quantity');
      } else {
        console.warn('Verify failed:', data);
        setStatus('failed');
        setError({
          message: data.error || 'Payment could not be verified',
          code: 'PAYMENT_NOT_VERIFIED',
          details: data
        });
      }
    } catch (err) {
      console.error('Verify error:', err);
      setStatus('failed');
      setError({
        message: 'Network error during verification',
        code: 'NETWORK_ERROR',
        details: err
      });
    }
  }, [reference]);

  React.useEffect(() => {
    verify();
  }, [verify]);

  if (status === 'verifying') {
    return (
      <div className="p-8 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold">Verifying payment...</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="p-8 bg-muted rounded-lg">
        <h2 className="text-3xl font-extrabold text-center text-green-600">Payment successful</h2>
        <p className="mt-2 text-sm text-muted-foreground">Thank you — a confirmation has been sent to your email.</p>
        <div className="mt-6 flex justify-center">
          <a href="/store" className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-md">Return to Store</a>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold text-red-600">Payment could not be verified</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {typeof error === 'object' && error?.code === 'MISSING_REFERENCE'
            ? 'No payment reference was found. Please try the payment process again.'
            : 'If you were charged, contact support with the reference below and we\'ll resolve this immediately.'}
        </p>
        <div className="mt-4 p-4 bg-background rounded border">
          <div className="text-sm font-medium">Reference</div>
          <div className="font-mono mt-1 text-sm">{reference}</div>
          {typeof error === 'object' && error?.code && (
            <div className="text-xs text-muted-foreground mt-2">
              Error Code: {error.code}
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setStatus('verifying');
              setError(null);
              verify();
            }}
            className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry Verification
          </button>
          <a
            href="/store"
            className="inline-flex items-center justify-center px-5 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Return to Store
          </a>
          <a
            href="mailto:support@bookstore.com?subject=Payment Verification Issue&body=Reference: ${reference}"
            className="inline-flex items-center justify-center px-5 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return null;
}


export default function CheckoutComplete() {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-3xl mx-auto text-center">
        <Suspense fallback={
            <div className="p-8 bg-muted rounded-lg">
                <h2 className="text-2xl font-semibold">Loading...</h2>
            </div>
        }>
            <CheckoutCompleteContent />
        </Suspense>
      </div>
    </div>
  );
}
