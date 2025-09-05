
'use client';

import * as React from 'react';
import type { Book } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Truck, Upload } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { getCurrencySymbol, getCachedData, setCachedData } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BookReviews } from '@/components/store/book-reviews';
import { useToast } from '@/hooks/use-toast';


export default function BookPage({ params }: { params: { id: string } }) {
    const [book, setBook] = React.useState<Book | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currencySymbol, setCurrencySymbol] = React.useState('$');
    const router = useRouter();
    const { toast } = useToast();

     React.useEffect(() => {
        const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
        setCurrencySymbol(getCurrencySymbol(savedCurrency));
    }, []);

    React.useEffect(() => {
        const bookId = params.id;
        if (!bookId) return;

        const fetchBook = async () => {
            setLoading(true);
            const cacheKey = `book_${bookId}`;
            const cachedBook = getCachedData(cacheKey);

            if(cachedBook) {
                setBook(cachedBook);
                setLoading(false);
                return;
            }

            try {
                const docRef = doc(db, 'books', bookId);
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

    const handleShare = async () => {
        if (!book) return;

        const shareData = {
            title: book.title,
            text: `Check out this book: ${book.title} by ${book.author}`,
            url: window.location.href
        };

        try {
            if(navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast({ title: "Copied!", description: "Link copied to clipboard." });
            }
        } catch (error) {
            console.error('Error sharing:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not share the page.',
            })
        }
    };


    if (loading) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    <div className="lg:col-span-1 aspect-[2/3] w-full max-w-sm mx-auto bg-muted rounded-lg animate-pulse"></div>
                    <div className="space-y-6 lg:col-span-3">
                        <div className="h-10 bg-muted rounded w-3/4 animate-pulse"></div>
                        <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
                        <div className="h-24 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-12 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                     <div className="space-y-6 lg:col-span-1">
                        <div className="h-48 bg-muted rounded w-full animate-pulse"></div>
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                {/* Image Column */}
                <div className="lg:col-span-1 flex flex-col items-center">
                    <Image
                        src={book.imageUrl || "https://picsum.photos/600/900"}
                        alt={`Cover of ${book.title}`}
                        width={600}
                        height={900}
                        className="aspect-[2/3] object-cover border w-full rounded-lg overflow-hidden max-w-xs shadow-lg"
                        data-ai-hint="book cover"
                    />
                </div>

                {/* Details Column */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold">{book.title}</h1>
                                <p className="text-lg text-muted-foreground mt-1">by <a href="#" className="text-primary hover:underline">{book.author}</a> | Format: {book.details}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Upload className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className={`w-5 h-5 ${
                                            i < Math.round(book.rating?.average || 0)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-200 text-gray-200"
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {book.rating?.average.toFixed(1)} ({book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                            <a href="#reviews" onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                            }} className="text-sm text-primary hover:underline">
                                {book.reviewCount > 0 ? 'See all reviews' : 'Be the first to review'}
                            </a>
                        </div>
                    </div>
                    
                    <Separator />

                    <article className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                        <p className="lead">{book.description}</p>
                        <h3>Praise for {book.title}</h3>
                        <blockquote>
                            "A wonderful tribute to a true American hero."
                        </blockquote>
                    </article>

                    <Separator />
                    
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Book Details</h3>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                <li>Published Date: {book.publicationDate}</li>
                                <li>Format: {book.details}</li>
                            </ul>
                        </div>
                        
                        <Separator />

                        <div>
                            <h3 className="text-xl font-semibold mb-4">Sample Text</h3>
                            <p className="whitespace-pre-wrap font-serif text-base text-muted-foreground">
                                {book.sampleText || "No sample text available."}
                            </p>
                        </div>
                        
                        <Separator />
                        
                        <div id="reviews">
                            <h3 className="text-xl font-semibold mb-4">
                                Reviews {book.reviewCount > 0 && `(${book.reviewCount})`}
                            </h3>
                             <BookReviews 
                                bookId={book.id} 
                                initialRating={book.rating}
                                onRatingUpdate={(rating) => {
                                    setBook(prev => prev ? {
                                        ...prev,
                                        rating,
                                        reviewCount: rating.total
                                    } : null);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions Column */}
                <div className="lg:col-span-1">
                     <div className="sticky top-24 space-y-6 rounded-lg border border-border bg-card p-6">
                        <div className="text-3xl font-bold">{currencySymbol}{book.price.toFixed(2)}</div>
                        
                        <div className="flex flex-col gap-2">
                           <Button size="lg" className="w-full" onClick={() => router.push(`/store/checkout?bookId=${book?.id}`)}>Buy Now</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-4 w-4" />
                            <span>Free shipping on orders over {currencySymbol}50</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
