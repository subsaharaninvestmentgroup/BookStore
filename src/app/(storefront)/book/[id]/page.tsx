
'use client';

import * as React from 'react';
import type { Book } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Truck } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export default function BookPage({ params }: { params: { id: string } }) {
    const [book, setBook] = React.useState<Book | null>(null);
    const [loading, setLoading] = React.useState(true);
    const bookId = params.id;

    React.useEffect(() => {
        if (!bookId) return;

        const fetchBook = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'books', bookId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setBook({ ...docSnap.data(), id: docSnap.id } as Book);
                } else {
                   setBook(null);
                }
            } catch (error) {
                console.error("Failed to fetch book:", error);
                setBook(null);
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [bookId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    <div className="aspect-[2/3] w-full max-w-md mx-auto bg-muted rounded-lg animate-pulse"></div>
                    <div className="space-y-6">
                        <div className="h-10 bg-muted rounded w-3/4 animate-pulse"></div>
                        <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
                        <div className="h-10 bg-muted rounded w-1/3 animate-pulse"></div>
                        <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-12 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!book) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="grid gap-4">
                    <Image
                        src={book.imageUrl || "https://picsum.photos/400/600"}
                        alt={`Cover of ${book.title}`}
                        width={600}
                        height={900}
                        className="aspect-[2/3] object-cover border w-full rounded-lg overflow-hidden max-w-md mx-auto"
                        data-ai-hint="book cover"
                    />
                    {/* Placeholder for multiple images */}
                </div>
                <div className="grid gap-6">
                    <div>
                        <Badge variant="outline">{book.category}</Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold mt-2">{book.title}</h1>
                        <p className="text-lg text-muted-foreground mt-1">by {book.author}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-primary" />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">(123 reviews)</span>
                    </div>
                     <div className="text-4xl font-bold">${book.price.toFixed(2)}</div>
                    
                    <p className="text-muted-foreground">{book.description}</p>
                   
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button size="lg" className="flex-1">Add to Cart</Button>
                        <Button size="lg" variant="outline" className="flex-1">Buy Now</Button>
                    </div>

                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span>Free shipping on orders over $50</span>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="details">
                            <AccordionTrigger>Book Details</AccordionTrigger>
                            <AccordionContent>
                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    <li>Published Date: {book.publicationDate}</li>
                                    <li>Format: {book.details}</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="sample">
                            <AccordionTrigger>Sample Text</AccordionTrigger>
                            <AccordionContent className="whitespace-pre-wrap font-serif">
                            {book.sampleText || "No sample text available."}
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="reviews">
                            <AccordionTrigger>Reviews</AccordionTrigger>
                            <AccordionContent>
                            Coming soon.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
