
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, runTransaction, updateDoc, getDoc } from 'firebase/firestore';
import { generateSecureDownloadUrl, getDownloadExpiration } from './secure-downloads';
import { sendDigitalDeliveryEmail, sendOrderConfirmationEmail } from './email';
import type { Order } from './types';

export async function recordOrder(order: any) {
  const colRef = collection(db, 'orders');
  const docRef = await addDoc(colRef, {
    ...order,
    confirmationEmailSent: order.confirmationEmailSent ?? false,
    digitalDeliveryEmailSent: order.digitalDeliveryEmailSent ?? false,
    date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id };
}


export async function fulfillOrder(order: Order) {
  try {
    console.log('Starting order fulfillment for order:', order.id);
    const orderRef = doc(db, 'orders', order.id);

    // Re-fetch to ensure we have latest flags (idempotency support)
    let latest = order;
    try {
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        latest = { ...order, ...(snap.data() as any) };
      }
    } catch (e) {
      console.warn('Could not refresh order snapshot, proceeding with passed order');
    }

    // Helper to update flags safely
    const markFlags = async (flags: Partial<Order> & { emailError?: string | null }) => {
      const payload: Record<string, any> = { updatedAt: serverTimestamp(), lastEmailAttemptAt: new Date().toISOString() };
      if (flags.confirmationEmailSent !== undefined) payload.confirmationEmailSent = flags.confirmationEmailSent;
      if (flags.digitalDeliveryEmailSent !== undefined) payload.digitalDeliveryEmailSent = flags.digitalDeliveryEmailSent;
      if (flags.emailError !== undefined) payload.emailError = flags.emailError;
      await updateDoc(orderRef, payload);
    };

    // Retry wrapper
    const withRetry = async <T>(fn: () => Promise<T>, label: string, retries = 2): Promise<T | null> => {
      let attempt = 0;
      while (attempt <= retries) {
        try {
          const result = await fn();
          if (attempt > 0) console.log(`${label} succeeded on retry #${attempt}`);
          return result;
        } catch (err) {
          attempt++;
          console.error(`${label} failed (attempt ${attempt}):`, err);
          if (attempt > retries) {
            await markFlags({ emailError: `${label} failed: ${String(err)}` });
            return null;
          }
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
      return null;
    };

    // 1. Order Confirmation Email (if not already sent)
    if (!latest.confirmationEmailSent) {
      const confirmationRes = await withRetry(async () => {
        await sendOrderConfirmationEmail({
          to: latest.customerEmail,
          orderDetails: {
            orderReference: latest.paymentReference,
            items: latest.items.map((item: any) => ({
              title: item.bookTitle,
              format: latest.digital ? 'digital' : 'physical',
              price: latest.amount / item.quantity
            })),
            total: latest.amount,
            shippingAddress: latest.address,
            estimatedDelivery: latest.digital ? undefined : getEstimatedDeliveryDate()
          }
        });
        return true;
      }, 'Order confirmation email');
      if (confirmationRes) {
        await markFlags({ confirmationEmailSent: true, emailError: undefined });
        latest.confirmationEmailSent = true;
        console.log('Order confirmation email sent for order:', latest.id);
      }
    } else {
      console.log('Skipping confirmation email, already sent for order:', latest.id);
    }

    // 2. Digital delivery (if applicable and not already sent)
    if (latest.digital && latest.items?.length) {
      const digitalItem = latest.items.find((item: any) => item.bookId && item.digitalFileUrl);
      if (digitalItem && !latest.digitalDeliveryEmailSent) {
        const deliveryRes = await withRetry(async () => {
          const downloadUrl = await generateSecureDownloadUrl({
            fileId: digitalItem.digitalFileUrl!,
            fileName: digitalItem.bookTitle || 'digital-book',
            bookId: digitalItem.bookId,
            orderReference: latest.paymentReference
          });
          await sendDigitalDeliveryEmail({
            to: latest.customerEmail,
            bookTitle: digitalItem.bookTitle || 'Your Book',
            downloadUrl,
            expiresAt: getDownloadExpiration(),
            orderReference: latest.paymentReference
          });
          return downloadUrl;
        }, 'Digital delivery email');
        if (deliveryRes) {
          await markFlags({ digitalDeliveryEmailSent: true, emailError: undefined });
          latest.digitalDeliveryEmailSent = true;
          console.log('Digital delivery completed for order:', latest.id);
          return { emailSent: true, downloadUrl: deliveryRes, digital: true };
        }
      } else if (latest.digitalDeliveryEmailSent) {
        console.log('Skipping digital delivery email, already sent for order:', latest.id);
      }
    }

    // 3. Physical shipping orchestration
    if (!latest.digital) {
      try {
        const shippingDetails = await createShippingOrder({
          name: latest.customerName,
          address: latest.address,
          phone: latest.customerPhone || '',
          orderRef: latest.paymentReference,
          items: latest.items
        });
        console.log('Physical delivery initiated for order:', latest.id);
        return { shipped: true, shippingDetails, physical: true };
      } catch (shippingError) {
        console.error('Failed to create shipping order:', shippingError);
        throw new Error('Shipping order creation failed');
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error fulfilling order:', error);
    try {
      await updateOrderFulfillmentStatus(order.id, 'Failed');
    } catch (updateError) {
      console.error('Failed to update order status after fulfillment error:', updateError);
    }
    throw new Error('Failed to fulfill order');
  }
}

function getEstimatedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7); // Estimate 7 business days
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

async function createShippingOrder(details: {
  name: string;
  address: string;
  phone: string;
  orderRef: string;
  items: any[];
}) {
  // This is where you would integrate with your shipping provider
  // For now, we'll just return mock data
  return {
    trackingNumber: `TRACK-${Math.random().toString(36).substring(7)}`,
    estimatedDelivery: getEstimatedDeliveryDate(),
    carrier: 'Standard Shipping',
    status: 'Processing'
  };
}

export async function createOrUpdateCustomerFromOrder(details: { name: string, email: string, amount: number, address: string, phone?: string }) {
    if (!details.email) return;

    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('email', '==', details.email));
    
    await runTransaction(db, async (transaction) => {
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // Customer does not exist, create a new one
            const newCustomerRef = doc(customersRef);
            const newCustomerData = {
                id: newCustomerRef.id,
                name: details.name || 'Customer',
                email: details.email,
                phone: details.phone || '',
                joinDate: new Date().toISOString().split('T')[0],
                totalOrders: 1,
                totalSpent: details.amount,
                address: details.address || '',
                isAdmin: false,
            } as const;

            // Create a new object with only defined values
            const cleanCustomerData = Object.entries(newCustomerData)
                .reduce((acc, [key, value]) => {
                    if (value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as Record<string, any>);

            transaction.set(newCustomerRef, cleanCustomerData);
        } else {
            // Customer exists, update their record
            const customerDoc = querySnapshot.docs[0];
            const customerRef = customerDoc.ref;
            const currentData = customerDoc.data();
            
            const newTotalOrders = (currentData.totalOrders || 0) + 1;
            const newTotalSpent = (currentData.totalSpent || 0) + details.amount;

            // Prepare update data with new fields and existing data
            const updateData: Record<string, any> = {
                totalOrders: newTotalOrders,
                totalSpent: newTotalSpent,
                name: details.name || currentData.name || 'Customer', // Fallback to existing name or default
                lastOrderDate: new Date().toISOString().split('T')[0],
            };

            // Only update address and phone if they are provided and not empty strings
            if (details.address?.trim()) {
                updateData.address = details.address;
            } else if (currentData.address) {
                updateData.address = currentData.address;
            }

            if (details.phone?.trim()) {
                updateData.phone = details.phone;
            } else if (currentData.phone) {
                updateData.phone = currentData.phone;
            }

            // Remove any undefined or null values
            const cleanUpdateData = Object.entries(updateData)
                .reduce((acc, [key, value]) => {
                    if (value !== undefined && value !== null) {
                        acc[key] = value;
                    }
                    return acc;
                }, {} as Record<string, any>);

            transaction.update(customerRef, cleanUpdateData);
        }
    });
}

export async function updateOrderFulfillmentStatus(orderId: string, status: string) {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      shippingStatus: status,
      updatedAt: serverTimestamp(),
    });
    console.log(`Order ${orderId} fulfillment status updated to: ${status}`);
  } catch (error) {
    console.error(`Failed to update order ${orderId} status:`, error);
    throw error;
  }
}
