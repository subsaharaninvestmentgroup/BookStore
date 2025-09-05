
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';

export async function recordOrder(order: any) {
  const col = collection(db, 'orders');
  const docRef = await addDoc(col, {
    ...order,
    date: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id };
}

import { generateSecureDownloadUrl, getDownloadExpiration } from './secure-downloads';
import { sendDigitalDeliveryEmail, sendOrderConfirmationEmail } from './email';

export async function fulfillOrder(order: any) {
  try {
    // Send order confirmation email first
    await sendOrderConfirmationEmail({
      to: order.customerEmail,
      orderDetails: {
        orderReference: order.paymentReference,
        items: order.items.map((item: any) => ({
          title: item.bookTitle,
          format: order.digital ? 'digital' : 'physical',
          price: order.amount
        })),
        total: order.amount,
        shippingAddress: order.address,
        estimatedDelivery: order.digital ? undefined : getEstimatedDeliveryDate()
      }
    });

    // Handle digital delivery
    if (order.digital && order.items && order.items.length) {
      const digitalItem = order.items.find((item: any) => item.bookId);
      if (digitalItem) {
        const downloadUrl = await generateSecureDownloadUrl({
          fileId: digitalItem.digitalFileUrl,
          fileName: digitalItem.bookTitle,
          bookId: digitalItem.bookId,
          orderReference: order.paymentReference
        });

        // Send digital delivery email with secure download link
        await sendDigitalDeliveryEmail({
          to: order.customerEmail,
          bookTitle: digitalItem.bookTitle,
          downloadUrl,
          expiresAt: getDownloadExpiration(),
          orderReference: order.paymentReference
        });

        return { 
          emailSent: true, 
          downloadUrl,
          digital: true
        };
      }
    }

    // Handle physical delivery
    if (!order.digital) {
      // Here you would integrate with your shipping provider
      // For example, creating a shipping label with a service like ShipEngine
      const shippingDetails = await createShippingOrder({
        name: order.customerName,
        address: order.address,
        phone: order.customerPhone,
        orderRef: order.paymentReference,
        items: order.items
      });

      return { 
        shipped: true,
        shippingDetails,
        physical: true
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error fulfilling order:', error);
    throw new Error('Failed to fulfill order');
  }
}

function getEstimatedDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 5); // Estimate 5 business days
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
