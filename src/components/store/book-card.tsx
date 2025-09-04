
'use client';

import * as React from 'react';
import type { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrencySymbol } from '@/lib/utils';

type BookCardProps = {
    book: Book;
};

export function BookCard({ book }: BookCardProps) {
    const [currencySymbol, setCurrencySymbol] = React.useState('$');

    React.useEffect(() => {
        const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
        setCurrencySymbol(getCurrencySymbol(savedCurrency));
    }, []);

    return (
        <Link href={`/store/book/${book.id}`} className="group block">
            <div className="relative bg-background rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300 z-10" />
                    <Image
                        src={book.imageUrl || 'https://picsum.photos/400/600'}
                        alt={`Cover of ${book.title}`}
                        fill
                        className="object-cover transform transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint="book cover"
                    />
                </div>
                <div className="p-4 space-y-2">
                    <div className="space-y-1">
                        <h3 className="font-medium text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-lg tracking-tight">{currencySymbol}{book.price.toFixed(2)}</p>
                        <div className="opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                            <div className="text-sm text-primary font-medium">View Details →</div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
