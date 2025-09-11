
import * as React from 'react';
import type { Book } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCurrencySymbol, getStoreCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { BookReviews } from '@/components/store/book-reviews';
import { BookPageActions } from '@/components/store/book-page-actions';
import { Star } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';

async function getBook(bookId: string): Promise<Book | null> {
    if (!bookId) return null;
    try {
        const docRef = doc(db, 'books', bookId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id } as Book;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch book:", error);
        return null;
    }
}

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id
  const book = await getBook(id);

  if (!book) {
    return {
      title: 'Book Not Found',
    }
  }
 
  const previousImages = (await parent).openGraph?.images || []
 
  return {
    title: `${book.title} by ${book.author}`,
    description: book.description,
    authors: [{ name: book.author }],
    openGraph: {
      title: `${book.title} | Bookstore`,
      description: book.description,
      images: [book.imageUrl, ...previousImages],
      type: 'book',
      authors: [book.author],
      releaseDate: book.publicationDate,
    },
  }
}

export default async function BookPage({ params }: { params: { id: string } }) {
    const book = await getBook(params.id);

    if (!book) {
        notFound();
    }
    
    const currency = await getStoreCurrency(); 
    const currencySymbol = getCurrencySymbol(currency);
    
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Book',
        name: book.title,
        image: book.imageUrl,
        description: book.description,
        author: {
            '@type': 'Person',
            name: book.author,
        },
        isbn: book.details?.includes('ISBN') ? book.details.split('ISBN:')[1].trim() : undefined,
        offers: {
            '@type': 'Offer',
            priceCurrency: currency,
            price: book.price.toFixed(2),
            itemCondition: 'https://schema.org/NewCondition',
            availability: book.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(book.rating && book.rating.total > 0 && {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: book.rating.average.toFixed(1),
                reviewCount: book.rating.total,
            },
        }),
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
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
                            priority
                        />
                    </div>

                    {/* Details Column */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold">{book.title}</h1>
                                    {(book.author || book.details) && (
                                        <p className="text-lg text-muted-foreground mt-1">
                                            {book.author && <>by <span className="text-primary">{book.author}</span></>}
                                            {book.author && book.details && ' | '}
                                            {book.details && `Format: ${book.details}`}
                                        </p>
                                    )}
                                </div>
                                <BookPageActions book={book} />
                            </div>

                            {book.reviewCount > 0 && book.rating && (
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
                            )}

                        </div>

                        <Separator />

                        {book.description && (
                            <article className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground">
                                <p className="lead">{book.description}</p>
                            </article>
                        )}


                        <div className="space-y-8">
                            {(book.publicationDate || book.details) && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4">Book Details</h3>
                                        <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                            {book.publicationDate && <li>Published Date: {book.publicationDate}</li>}
                                            {book.details && <li>Format: {book.details}</li>}
                                        </ul>
                                    </div>
                                </>
                            )}


                            {book.sampleText && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4">Sample Text</h3>
                                        <p className="whitespace-pre-wrap font-serif text-base text-muted-foreground">
                                            {book.sampleText}
                                        </p>
                                    </div>
                                </>
                            )}


                            <Separator />

                            <div id="reviews">
                                <h3 className="text-xl font-semibold mb-4">
                                    Reviews {book.reviewCount > 0 && `(${book.reviewCount})`}
                                </h3>
                                <BookReviews
                                    bookId={book.id}
                                    initialRating={book.rating}
                                    reviewCount={book.reviewCount}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions Column */}
                    <BookPageActions book={book} currencySymbol={currencySymbol} isActionColumn={true} />
                </div>
            </div>
        </>
    );
}
