
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
        <Link href={`/store/book/${book.id}`}>
            <Card className="overflow-hidden h-full flex flex-col group transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div className="relative aspect-[2/3] w-full">
                    <Image
                        src={book.imageUrl || 'https://picsum.photos/400/600'}
                        alt={`Cover of ${book.title}`}
                        fill
                        className="object-cover"
                        data-ai-hint="book cover"
                    />
                </div>
                <CardContent className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                        {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                    <div className="mt-auto pt-4">
                        <p className="font-bold text-lg">{currencySymbol}{book.price.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
