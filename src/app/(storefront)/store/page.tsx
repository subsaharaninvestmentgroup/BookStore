
'use client';

import * as React from 'react';
import type { Banner, Book } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/store/book-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCachedData, setCachedData } from '@/lib/utils';

export default function StorefrontPage() {
    const [banners, setBanners] = React.useState<Banner[]>([]);
    const [featuredBooks, setFeaturedBooks] = React.useState<Book[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const cachedData = getCachedData('storefront');
            if (cachedData) {
                setBanners(cachedData.banners);
                setFeaturedBooks(cachedData.featuredBooks);
                setLoading(false);
                return;
            }

            try {
                // Fetch banners
                const bannerQuery = query(collection(db, 'banners'), where('isActive', '==', true));
                const bannerSnapshot = await getDocs(bannerQuery);
                const bannersData = bannerSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Banner[];
                setBanners(bannersData);

                // Fetch featured books
                const booksQuery = query(collection(db, 'books'), limit(4));
                const booksSnapshot = await getDocs(booksQuery);
                const booksData = booksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Book[];
                setFeaturedBooks(booksData);
                
                setCachedData('storefront', { banners: bannersData, featuredBooks: booksData });

            } catch (error) {
                console.error("Failed to fetch storefront data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <section className="w-full">
                {loading || banners.length === 0 ? (
                    <div className="w-full aspect-[2/1] bg-muted animate-pulse" />
                ) : (
                    <Carousel className="w-full" opts={{ loop: true }}>
                        <CarouselContent>
                            {banners.map(banner => (
                                <CarouselItem key={banner.id}>
                                    <div className="relative aspect-[2/1] w-full">
                                        <Image
                                            src={banner.imageUrl}
                                            alt={banner.title}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="banner image"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-8 text-white">
                                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{banner.title}</h1>
                                            <p className="mt-4 max-w-2xl text-lg">{banner.description}</p>
                                            <Link href={banner.callToAction || '#'}>
                                                <Button className="mt-6">Shop Now</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white" />
                    </Carousel>
                )}
            </section>
            
            <section className="py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center">Featured Books</h2>
                    <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl text-center mt-4">
                        Discover our handpicked selection of must-read books.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <Card key={i}>
                                    <Skeleton className="aspect-[2/3] w-full rounded-t-lg" />
                                    <CardContent className="p-4">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            featuredBooks.map(book => <BookCard key={book.id} book={book} />)
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
