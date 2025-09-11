
'use client';

import * as React from 'react';
import type { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getCurrencySymbol, getStoreCurrency } from '@/lib/utils';

type BookCardProps = {
    book: Book;
};

export function BookCard({ book }: BookCardProps) {
    const [currencySymbol, setCurrencySymbol] = React.useState('$');

    React.useEffect(() => {
        getStoreCurrency().then(currency => {
            setCurrencySymbol(getCurrencySymbol(currency));
        });
    }, []);

    return (
        <Link href={`/store/book/${book.id}`} className="group block h-full">
            <div className="relative flex flex-col h-full bg-background rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
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
                <div className="p-4 space-y-2 flex flex-col flex-grow text-center">
                    <div className="space-y-1 flex-grow">
                        <h3 className="font-medium text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <p className="font-semibold text-lg tracking-tight">{currencySymbol}{book.price.toFixed(2)}</p>
                        <div className="opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                            <div className="text-sm text-primary font-medium mt-1">View Details</div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
