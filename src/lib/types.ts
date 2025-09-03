
import { z } from 'zod';

export type SupplementaryFile = { 
  name: string; 
  url: string; 
  type: string 
};

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
  supplementaryFiles: SupplementaryFile[];
  sampleText: string;
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
  address: string;
  isAdmin?: boolean;
};

export type Banner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  callToAction: string;
  bookId: string;
  isActive: boolean;
};

export const GenerateBannerInputSchema = z.object({
  bookTitle: z.string().describe('The title of the book.'),
  bookAuthor: z.string().describe('The author of the book.'),
  bookDescription: z.string().describe('The description of the book.'),
});
export type GenerateBannerInput = z.infer<typeof GenerateBannerInputSchema>;

export const GenerateBannerOutputSchema = z.object({
  title: z
    .string()
    .describe('A catchy and concise title for the promotional banner.'),
  description: z
    .string()
    .describe(
      'A compelling description for the banner, encouraging users to click.'
    ),
});
export type GenerateBannerOutput = z.infer<typeof GenerateBannerOutputSchema>;
