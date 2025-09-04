
import { z } from 'zod';

export type SupplementaryFile = { 
  name: string; 
  url: string; 
  type: string 
};

export type Review = {
  id: string;
  bookId: string;
  email: string;
  name?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
};

export type BookRating = {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
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
  digitalFile?: SupplementaryFile;
  rating?: BookRating;
  reviewCount: number;
};

export type OrderItem = {
    bookId: string;
    bookTitle?: string;
    quantity: number;
    digitalFileUrl?: string;
}

export type PurchaseFormat = 'digital' | 'physical';

export type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  amount: number;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  shippingStatus: 'Shipped' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
  address: string;
  paymentReference: string;
  digital?: boolean;
  purchaseFormat?: PurchaseFormat;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
