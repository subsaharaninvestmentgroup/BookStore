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

export async function fulfillOrder(order: any) {
  // For digital delivery: pretend to send email
  if (order.items && order.items.length && order.digital) {
    // integrate with real email service here
    console.log(`Sending digital delivery to ${order.customerEmail} for order ${order.id}`);
    return { emailSent: true };
  }

  // For physical goods: log shipping request
  console.log(`Create shipping order for ${order.customerName}, address: ${order.address}`);
  return { shipped: true };
}

export async function createOrUpdateCustomerFromOrder(details: { name: string, email: string, amount: number, address: string }) {
    if (!details.email) return;

    const customersRef = collection(db, 'customers');
    const q = query(customersRef, where('email', '==', details.email));
    
    await runTransaction(db, async (transaction) => {
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // Customer does not exist, create a new one
            const newCustomerRef = doc(customersRef);
            transaction.set(newCustomerRef, {
                id: newCustomerRef.id,
                name: details.name,
                email: details.email,
                joinDate: new Date().toISOString().split('T')[0],
                totalOrders: 1,
                totalSpent: details.amount,
                address: details.address,
                isAdmin: false,
            });
        } else {
            // Customer exists, update their record
            const customerDoc = querySnapshot.docs[0];
            const customerRef = customerDoc.ref;
            const currentData = customerDoc.data();
            
            const newTotalOrders = (currentData.totalOrders || 0) + 1;
            const newTotalSpent = (currentData.totalSpent || 0) + details.amount;

            transaction.update(customerRef, {
                totalOrders: newTotalOrders,
                totalSpent: newTotalSpent,
                address: details.address || currentData.address // Update address if provided
            });
        }
    });
}
