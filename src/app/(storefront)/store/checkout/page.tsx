
"use client";

import React, { Suspense } from 'react';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrencySymbol, getStoreCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type PurchaseFormat = 'digital' | 'physical';

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const bookId = params.get('bookId');
  const [book, setBook] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [currency, setCurrency] = React.useState('');
  const [currencySymbol, setCurrencySymbol] = React.useState('');
  const [purchaseFormat, setPurchaseFormat] = React.useState<PurchaseFormat>('physical');
  const [quantity, setQuantity] = React.useState<number>(1);
  const maxStock = React.useMemo(() => (book?.stock ?? 0), [book]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const baseFieldSchemas = React.useMemo(() => ({
    email: z.string()
      .min(1, 'Please enter your email address')
      .email('That doesn\'t look like a valid email — please double‑check it'),
    name: z.string()
      .min(2, 'Please enter your full name (at least 2 characters)')
      .max(80, 'Name seems unusually long — please shorten it'),
    phone: z.string()
      .min(7, 'Phone number looks too short')
      .max(20, 'Phone number looks too long')
      .regex(/^[+]?\d{7,20}$/i, 'Use numbers only (you can start with a +)'),
    address: z.string().optional(),
    purchaseFormat: z.enum(['digital', 'physical']),
  }), []);

  const checkoutSchema = React.useMemo(() => z.object(baseFieldSchemas).superRefine((data, ctx) => {
    if (data.purchaseFormat === 'physical') {
      if (!data.address || data.address.trim().length < 5) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Please provide a shipping address (minimum 5 characters)' });
      }
    }
  }), [baseFieldSchemas]);

  const validateField = (field: string, value: any) => {
    const schema = (baseFieldSchemas as any)[field];
    if (!schema) return;
    try {
      schema.parse(value);
      // Special case: address requirement only for physical
      if (field === 'address' && purchaseFormat === 'physical') {
        if (!value || value.trim().length < 5) {
          throw new Error('Please provide a shipping address (minimum 5 characters)');
        }
      }
      setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    } catch (e: any) {
      // Prefer first issue's user-friendly message instead of raw JSON array
      let msg: string = 'Invalid value';
      if (e?.issues?.length && e.issues[0]?.message) {
        msg = e.issues[0].message;
      } else if (typeof e?.message === 'string') {
        // ZodError.message can be a serialized list of issues; fall back only if no issues array
        // Try to detect JSON array shape and ignore it
        if (/^\s*\[\s*{/.test(e.message)) {
          // keep default msg
        } else {
          msg = e.message;
        }
      }
      setFieldErrors(prev => ({ ...prev, [field]: msg }));
    }
  };

  const runFullValidation = () => {
  const result = checkoutSchema.safeParse({ email, name, phone, address, purchaseFormat });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return false;
    }
    setFieldErrors({});
    return true;
  };
  
  React.useEffect(() => {
    const fetchStoreCurrency = async () => {
      const storeCurrency = await getStoreCurrency();
      setCurrency(storeCurrency);
      setCurrencySymbol(getCurrencySymbol(storeCurrency));
    };
    fetchStoreCurrency();
  }, []);

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
    return Object.keys(fieldErrors).length === 0 && email && name && phone && quantity > 0 && quantity <= 99 && (
      purchaseFormat === 'digital' || (address && address.length >= 5)
    );
  };

  const startPaystack = async () => {
    if (isProcessing) return; // Prevent multiple submissions

    setServerError(null);
    setIsProcessing(true);

    const passes = runFullValidation();
    if (!passes) {
      setServerError('Some details need your attention — please fix the highlighted fields below.');
      setIsProcessing(false);
      return;
    }
    
    // Digital format always quantity 1
  const effectiveQty = purchaseFormat === 'digital' ? 1 : Math.min(quantity, maxStock || 1);
    const totalAmount = book.price * effectiveQty;
    const payload = {
      amount: Math.round(totalAmount * 100), // kobo
      email,
      name,
      bookId: book.id,
      currency,
      metadata: {
        name,
        bookId: book.id,
        address: purchaseFormat === 'physical' ? address : '',
        phone: phone,
        purchaseFormat,
        quantity: effectiveQty,
        unitPrice: book.price,
        lineTotal: totalAmount,
      }
    };

    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData?.error || errorData?.message || 'Failed to initiate payment';
        setServerError(message);
        console.error('Initiate error:', errorData);
        return;
      }

      const data = await res.json();
      console.log('Paystack init response:', data);
      
      if (data && data.data && data.data.authorization_url) {
        // Save checkout data for verification
        localStorage.setItem('checkout_email', email);
        localStorage.setItem('checkout_name', name);
        localStorage.setItem('checkout_bookId', book.id);
        localStorage.setItem('checkout_address', payload.metadata.address);
        localStorage.setItem('checkout_phone', payload.metadata.phone);
  localStorage.setItem('checkout_purchaseFormat', payload.metadata.purchaseFormat);
  localStorage.setItem('checkout_quantity', String(effectiveQty));
        
        setServerError(null);
        window.location.href = data.data.authorization_url;
      } else {
        const message = data?.error || data?.message || 'Failed to initiate payment';
        setServerError(message);
        console.error('Initiate error:', data);
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setServerError('Network error. Please check your connection and try again.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !currency) return <div className="container mx-auto p-8">Loading...</div>;
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
              {Object.keys(fieldErrors).length > 1 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                  <p className="font-medium mb-2">Please review the following:</p>
                  <ul className="list-disc ml-5 space-y-1">
                    {Object.entries(fieldErrors).map(([k, v]) => (
                      <li key={k}><span className="capitalize">{k.replace(/([A-Z])/g,' $1')}</span>: {v}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Contact Information</h2>
                <div className="grid gap-4">
                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <Input
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { const v = (e.target as HTMLInputElement).value; setEmail(v); validateField('email', v); }}
                      onBlur={() => validateField('email', email)}
                      inputMode="email"
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                      className={`mt-1 ${fieldErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>}
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Full name</span>
                    <Input
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => { const v = (e.target as HTMLInputElement).value; setName(v); validateField('name', v); }}
                      onBlur={() => validateField('name', name)}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                      className={`mt-1 ${fieldErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {fieldErrors.name && <p id="name-error" className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">
                        Contact Number {purchaseFormat === 'physical' && <span className="text-destructive">*</span>}
                    </span>
                    <Input
                        placeholder="Enter your contact number"
                        value={phone}
                        onChange={(e) => { const v = (e.target as HTMLInputElement).value; setPhone(v); validateField('phone', v); }}
                        onBlur={() => validateField('phone', phone)}
                        className={`mt-1 ${fieldErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        required={purchaseFormat === 'physical'}
                        inputMode="tel"
                        aria-invalid={!!fieldErrors.phone}
                        aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                        pattern="^[+]?\\d{7,20}$"
                    />
                    {fieldErrors.phone && <p id="phone-error" className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>}
                  </label>
                </div>
              </div>
              
              {purchaseFormat === 'physical' && (
                <div className="pt-6 space-y-4">
                    <h2 className="text-lg font-semibold">Shipping Information</h2>
                    <Input
                        placeholder="Enter your shipping address"
                        value={address}
                        onChange={(e) => { const v = (e.target as HTMLInputElement).value; setAddress(v); validateField('address', v); }}
                        onBlur={() => validateField('address', address)}
                        required
                        aria-invalid={!!fieldErrors.address}
                        aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                        className={`${fieldErrors.address ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {fieldErrors.address && <p id="address-error" className="mt-1 text-xs text-destructive">{fieldErrors.address}</p>}
                </div>
              )}


              <div className="pt-6">
                <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 border rounded disabled:opacity-50" disabled={purchaseFormat==='digital' || quantity<=1}>-</button>
                      <Input
                        type="number"
                        value={purchaseFormat==='digital' ? 1 : quantity}
                        onChange={(e)=> setQuantity(() => {
                          const v = parseInt(e.target.value,10); 
                          if (isNaN(v)) return 1; 
                          const cap = maxStock ? Math.min(maxStock, 99) : 99;
                          return Math.min(cap, Math.max(1, v));
                        })}
                        disabled={purchaseFormat==='digital'}
                        className="w-20 text-center"
                        min={1}
                        max={Math.min(99, maxStock || 99)}
                      />
                      <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(q => {
                        const cap = maxStock ? Math.min(maxStock, 99) : 99;
                        return Math.min(cap, q + 1);
                      })} className="h-8 w-8 border rounded disabled:opacity-50" disabled={purchaseFormat==='digital' || (maxStock ? quantity>=maxStock : quantity>=99)}>+</button>
                    </div>
                    {purchaseFormat==='physical' && maxStock > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{maxStock - quantity >=0 ? `${maxStock - quantity} left in stock` : ''}</p>
                    )}
                    {purchaseFormat==='physical' && maxStock === 0 && (
                      <p className="text-xs text-destructive mt-1">Out of stock</p>
                    )}
                    {purchaseFormat==='digital' && <p className="text-xs text-muted-foreground mt-1">Digital copy limited to 1 per order</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Amount</label>
                    <span className="text-2xl font-bold block">{currencySymbol}{(book.price * (purchaseFormat==='digital'?1:quantity)).toFixed(2)}</span>
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
                disabled={!isFormValid() || isProcessing || (purchaseFormat==='physical' && maxStock===0)} 
                className="w-full h-12 text-base font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  (purchaseFormat==='physical' && maxStock===0 ? 'Out of Stock' : `Pay ${currencySymbol}${book.price.toFixed(2)}`)
                )}
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
                    <span className="text-muted-foreground">Unit Price</span>
                    <span>{currencySymbol}{book.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span>{purchaseFormat==='digital'?1:quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencySymbol}{(book.price * (purchaseFormat==='digital'?1:quantity)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{purchaseFormat === 'physical' ? 'Free' : 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between font-medium">
                    <span>Total</span>
                    <span>{currencySymbol}{(book.price * (purchaseFormat==='digital'?1:quantity)).toFixed(2)}</span>
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

// Add a loading component for the Suspense boundary
function CheckoutLoading() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="h-[600px] animate-pulse bg-muted rounded-lg"></div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutForm />
    </Suspense>
  );
}
