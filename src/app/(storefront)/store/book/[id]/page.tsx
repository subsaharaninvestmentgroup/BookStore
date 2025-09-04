
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
import { getCurrencySymbol, getCachedData, setCachedData } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';


export default function BookPage({ params }: { params: { id: string } }) {
    const [book, setBook] = React.useState<Book | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currencySymbol, setCurrencySymbol] = React.useState('$');

     React.useEffect(() => {
        const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
        setCurrencySymbol(getCurrencySymbol(savedCurrency));
    }, []);

    React.useEffect(() => {
        if (!params.id) return;

        const fetchBook = async () => {
            setLoading(true);
            const cacheKey = `book_${params.id}`;
            const cachedBook = getCachedData(cacheKey);

            if(cachedBook) {
                setBook(cachedBook);
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'books', params.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const bookData = { ...docSnap.data(), id: docSnap.id } as Book;
                    setBook(bookData);
                    setCachedData(cacheKey, bookData);
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
    }, [params]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="aspect-[2/3] w-full max-w-md mx-auto bg-muted rounded-lg animate-pulse"></div>
                    <div className="space-y-6 lg:col-span-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Image Column */}
                <div className="lg:col-span-1 flex justify-center">
                    <Image
                        src={book.imageUrl || "https://picsum.photos/600/900"}
                        alt={`Cover of ${book.title}`}
                        width={600}
                        height={900}
                        className="aspect-[2/3] object-cover border w-full rounded-lg overflow-hidden max-w-md"
                        data-ai-hint="book cover"
                    />
                </div>

                {/* Details Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <Badge variant="outline">{book.category}</Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold mt-2">{book.title}</h1>
                        <p className="text-lg text-muted-foreground mt-1">by {book.author}</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground">(123 reviews)</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{book.description}</p>
                    
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

                {/* Actions Column */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 shadow-lg">
                        <CardContent className="p-6 grid gap-4">
                            <div className="text-4xl font-bold">{currencySymbol}{book.price.toFixed(2)}</div>
                            <Separator />
                            <div className="flex flex-col gap-2">
                                <Button size="lg" className="w-full">Add to Cart</Button>
                                <Button size="lg" variant="outline" className="w-full">Buy Now</Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                                <Truck className="h-4 w-4" />
                                <span>Free shipping on orders over {currencySymbol}50</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
