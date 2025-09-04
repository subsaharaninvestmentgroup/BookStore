
import type { Book, Order, Customer } from './types';

// This file now contains only mock data for reference. The app uses live data from Firebase.

// export const books: Book[] = [
//   { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', price: 12.99, stock: 42, description: "A novel about the American dream.", publicationDate: "1925-04-10", details: "Hardcover, 180 pages", imageUrl: "https://picsum.photos/400/600?book", supplementaryFiles: [], sampleText: "" },
//   { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', price: 14.99, stock: 25, description: "A classic of modern American literature.", publicationDate: "1960-07-11", details: "Paperback, 281 pages", imageUrl: "https://picsum.photos/400/600?bird", supplementaryFiles: [], sampleText: "" },
//   { id: '3', title: '1984', author: 'George Orwell', category: 'Dystopian', price: 10.99, stock: 60, description: "A dystopian novel about totalitarianism.", publicationDate: "1949-06-08", details: "Paperback, 328 pages", imageUrl: "https://picsum.photos/400/600?eye", supplementaryFiles: [], sampleText: "" },
//   { id: '4', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', price: 11.99, stock: 3, description: "A story about teenage angst and alienation.", publicationDate: "1951-07-16", details: "Paperback, 224 pages", imageUrl: "https://picsum.photos/400/600?rye", supplementaryFiles: [], sampleText: "" },
//   { id: '5', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Non-Fiction', price: 18.99, stock: 50, description: "A book about the history of humankind.", publicationDate: "2011-01-01", details: "Hardcover, 443 pages", imageUrl: "https://picsum.photos/400/600?human", supplementaryFiles: [], sampleText: "" },
//   { id: '6', title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', price: 15.99, stock: 110, description: "A fantasy novel and prelude to The Lord of the Rings.", publicationDate: "1937-09-21", details: "Paperback, 310 pages", imageUrl: "https://picsum.photos/400/600?hobbit", supplementaryFiles: [], sampleText: "" },
//   { id: '7', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', price: 9.99, stock: 0, description: "A classic romance novel.", publicationDate: "1813-01-28", details: "Paperback, 279 pages", imageUrl: "https://picsum.photos/400/600?pride", supplementaryFiles: [], sampleText: "" },
//   { id: '8', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', price: 16.99, stock: 20, description: "A popular-science book on cosmology.", publicationDate: "1988-01-01", details: "Paperback, 256 pages", imageUrl: "https://picsum.photos/400/600?time", supplementaryFiles: [], sampleText: "" },
// ];

export const orders: Order[] = [
  { id: 'ORD001', customerName: 'Alice Johnson', customerEmail: 'alice@example.com', items: [{ bookTitle: 'The Great Gatsby', quantity: 1 }], amount: 12.99, paymentStatus: 'Paid', shippingStatus: 'Shipped', date: '2024-05-20' },
  { id: 'ORD002', customerName: 'Bob Smith', customerEmail: 'bob@example.com', items: [{ bookTitle: '1984', quantity: 2 }], amount: 21.98, paymentStatus: 'Paid', shippingStatus: 'Delivered', date: '2024-05-18' },
  { id: 'ORD003', customerName: 'Charlie Brown', customerEmail: 'charlie@example.com', items: [{ bookTitle: 'Sapiens', quantity: 1 }, { bookTitle: 'The Hobbit', quantity: 1 }], amount: 34.98, paymentStatus: 'Pending', shippingStatus: 'Processing', date: '2024-05-21' },
  { id: 'ORD004', customerName: 'Diana Prince', customerEmail: 'diana@example.com', items: [{ bookTitle: 'To Kill a Mockingbird', quantity: 1 }], amount: 14.99, paymentStatus: 'Paid', shippingStatus: 'Delivered', date: '2024-05-15' },
  { id: 'ORD005', customerName: 'Alice Johnson', customerEmail: 'alice@example.com', items: [{ bookTitle: 'A Brief History of Time', quantity: 1 }], amount: 16.99, paymentStatus: 'Paid', shippingStatus: 'Processing', date: '2024-05-22' },
  { id: 'ORD006', customerName: 'Eve Adams', customerEmail: 'eve@example.com', items: [{ bookTitle: 'The Catcher in the Rye', quantity: 1 }], amount: 11.99, paymentStatus: 'Failed', shippingStatus: 'Cancelled', date: '2024-05-19' },
];

export const customers: Customer[] = [
  { id: 'CUST01', name: 'Alice Johnson', email: 'alice@example.com', totalOrders: 2, totalSpent: 29.98, joinDate: '2024-01-15', address: '' },
  { id: 'CUST02', name: 'Bob Smith', email: 'bob@example.com', totalOrders: 1, totalSpent: 21.98, joinDate: '2024-02-20', address: '' },
  { id: 'CUST03', name: 'Charlie Brown', email: 'charlie@example.com', totalOrders: 1, totalSpent: 34.98, joinDate: '2024-03-10', address: '' },
  { id: 'CUST04', name: 'Diana Prince', email: 'diana@example.com', totalOrders: 1, totalSpent: 14.99, joinDate: '2024-04-05', address: '' },
  { id: 'CUST05', name: 'Eve Adams', email: 'eve@example.com', totalOrders: 1, totalSpent: 0, joinDate: '2024-05-01', address: '' },
];

export const historicalSalesData = `2023-01-01: 120
2023-01-08: 150
2023-01-15: 130
2023-01-22: 180
2023-01-29: 200
2023-02-05: 160
2023-02-12: 190
2023-02-19: 210
2023-02-26: 230
2023-03-05: 220
2023-03-12: 250
2023-03-19: 240
2023-03-26: 280
2023-04-02: 300
2023-04-09: 280
2023-04-16: 310
2023-04-23: 330
2023-04-30: 320`;
