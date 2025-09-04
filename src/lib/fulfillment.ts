import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
