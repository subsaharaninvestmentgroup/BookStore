
"use client";

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrencySymbol } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type PurchaseFormat = 'digital' | 'physical';

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const bookId = params.get('bookId');
  const [book, setBook] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [currency, setCurrency] = React.useState('ZAR');
  const [purchaseFormat, setPurchaseFormat] = React.useState<PurchaseFormat>('physical');
  const [serverError, setServerError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!bookId) return;
    const fetchBook = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'books', bookId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const bookData = { ...(snap.data() as any), id: snap.id };
          setBook(bookData);
          if (!bookData.digitalFile) {
            setPurchaseFormat('physical');
          } else {
            // Default to physical if digital is available, user can switch
            setPurchaseFormat('physical');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  const isFormValid = () => {
    if (!email) return false;
    if (purchaseFormat === 'physical' && (!address || !phone)) return false;
    return true;
  };

  const startPaystack = async () => {
    if (!book || !isFormValid()) {
      if (!email) setServerError('Email is required.');
      if (purchaseFormat === 'physical' && !address) setServerError('Shipping address is required for hard copy.');
      if (purchaseFormat === 'physical' && !phone) setServerError('Contact number is required for hard copy.');
      return;
    }
    
    const payload = {
      amount: Math.round(book.price * 100), // kobo
      email,
      name,
      bookId: book.id,
      currency,
      metadata: {
        name,
        bookId: book.id,
        address: purchaseFormat === 'physical' ? address : '',
        phone: purchaseFormat === 'physical' ? phone : '',
        purchaseFormat,
      }
    };

    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Paystack init response:', data);
      
      if (res.ok && data && data.data && data.data.authorization_url) {
        // Save checkout data for verification
        localStorage.setItem('checkout_email', email);
        localStorage.setItem('checkout_name', name);
        localStorage.setItem('checkout_bookId', book.id);
        localStorage.setItem('checkout_address', payload.metadata.address);
        localStorage.setItem('checkout_phone', payload.metadata.phone);
        localStorage.setItem('checkout_purchaseFormat', payload.metadata.purchaseFormat);
        
        setServerError(null);
        window.location.href = data.data.authorization_url;
      } else {
        const message = data?.error || data?.message || 'Failed to initiate payment';
        setServerError(String(message));
        console.error('initiate error', data);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setServerError('Network error while initiating payment');
    }
  };

  if (loading) return <div className="container mx-auto p-8">Loading...</div>;
  if (!book) return <div className="container mx-auto p-8">Book not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
              <p className="mt-2 text-muted-foreground">Complete your purchase securely</p>
            </div>

            {/* Book Preview */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <img src={book.imageUrl || 'https://picsum.photos/200/300'} alt={book.title} 
                className="w-16 h-24 object-cover rounded shadow-sm" />
              <div>
                <h2 className="font-medium">{book.title}</h2>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
                <p className="text-sm mt-1">{book.details}</p>
              </div>
            </div>
            
            {/* Format Selection */}
            {book.digitalFile && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Choose Format</h2>
                <RadioGroup value={purchaseFormat} onValueChange={(value) => setPurchaseFormat(value as PurchaseFormat)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="physical" />
                    <Label htmlFor="physical">Hard Copy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="digital" id="digital" />
                    <Label htmlFor="digital">Digital File (PDF/EPUB)</Label>
                  </div>
                </RadioGroup>
              </div>
            )}


            {/* Form Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Contact Information</h2>
                <div className="grid gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <Input 
                      placeholder="you@example.com" 
                      value={email} 
                      onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                      className="mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Full name</span>
                    <Input 
                      placeholder="Enter your full name" 
                      value={name} 
                      onChange={(e) => setName((e.target as HTMLInputElement).value)}
                      className="mt-1"
                    />
                  </label>
                </div>
              </div>
              
              {purchaseFormat === 'physical' && (
                <div className="pt-6 space-y-4">
                    <h2 className="text-lg font-semibold">Shipping Information</h2>
                    <Input 
                        placeholder="Enter your shipping address" 
                        value={address} 
                        onChange={(e) => setAddress((e.target as HTMLInputElement).value)}
                        required
                    />
                    <Input 
                        placeholder="Enter your contact number" 
                        value={phone} 
                        onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                        required
                    />
                </div>
              )}


              <div className="pt-6">
                <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Currency</label>
                    <select 
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background" 
                      value={currency} 
                      onChange={(e) => setCurrency((e.target as HTMLSelectElement).value)}
                    >
                      <option value="ZAR">ZAR (R)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-2xl font-bold">{getCurrencySymbol(currency)}{book.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {serverError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{serverError}</p>
                </div>
              )}

              <Button 
                onClick={startPaystack} 
                disabled={!isFormValid()} 
                className="w-full h-12 text-base font-medium"
              >
                {isFormValid() ? `Pay ${getCurrencySymbol(currency)}${book.price.toFixed(2)}` : 'Complete required fields'}
              </Button>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                <h2 className="font-semibold">Order Summary</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{getCurrencySymbol(currency)}{book.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{purchaseFormat === 'physical' ? 'Free' : 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-medium">
                    <span>Total</span>
                    <span>{getCurrencySymbol(currency)}{book.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm space-y-2">
                <div className="flex gap-2 items-center text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure checkout</span>
                </div>
                <div className="flex gap-2 items-center text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Processed by Paystack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
