'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Truck, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Book } from '@/lib/types';

interface BookPageActionsProps {
    book: Book;
    currencySymbol?: string;
    isActionColumn?: boolean;
}

export function BookPageActions({ book, currencySymbol, isActionColumn = false }: BookPageActionsProps) {
    const { toast } = useToast();
    const router = useRouter();

    const handleShare = async () => {
        if (!book) return;

        const shareData = {
            title: book.title,
            text: `Check out this book: ${book.title} by ${book.author}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
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
    
    if (isActionColumn) {
        return (
            <div className="lg:col-span-1">
                 <div className="sticky top-24 space-y-6 rounded-lg border border-border bg-card p-6">
                    <div className="text-3xl font-bold">{currencySymbol}{book.price.toFixed(2)}</div>
                    
                    <div className="flex flex-col gap-2">
                       <Button size="lg" className="w-full" onClick={() => router.push(`/store/checkout?bookId=${book?.id}`)}>Buy Now</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span>Free shipping on orders over {currencySymbol}600</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleShare}>
            <Upload className="h-5 w-5" />
        </Button>
    )
}
