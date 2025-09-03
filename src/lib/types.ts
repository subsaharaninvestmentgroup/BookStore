export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  publicationDate: string;
  details: string;
  imageUrl: string;
  fileType?: string;
  supplementaryFiles?: { name: string; url: string; type: string }[];
};

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { bookTitle: string; quantity: number }[];
  amount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  shippingStatus: 'Shipped' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
};
