
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle, File, ListFilter, Store } from 'lucide-react';
import type { Book } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getCurrencySymbol, getCachedData, setCachedData, clearCache } from '@/lib/utils';

type BooksProps = {
    onAddBook: () => void;
    onEditBook: (bookId: string) => void;
};

export default function Books({ onAddBook, onEditBook }: BooksProps) {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const { toast } = useToast();
  const [currencySymbol, setCurrencySymbol] = React.useState('$');

  React.useEffect(() => {
    const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
    setCurrencySymbol(getCurrencySymbol(savedCurrency));
  }, []);

  const fetchBooks = React.useCallback(async () => {
    setLoading(true);
    const cachedBooks = getCachedData('allBooks');
    if (cachedBooks) {
        setBooks(cachedBooks);
        setLoading(false);
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const booksData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Book[];
        setBooks(booksData);
        setCachedData('allBooks', booksData);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Error fetching books',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDeleteBook = async (bookId: string) => {
    const bookToDelete = books.find(b => b.id === bookId);
    if (!bookToDelete) return;

    if (!confirm(`Are you sure you want to delete "${bookToDelete.title}"?`)) return;

    try {
        // Delete supplementary files from storage
        if(bookToDelete.supplementaryFiles) {
            for(const file of bookToDelete.supplementaryFiles) {
                try {
                    await deleteObject(ref(storage, file.url));
                } catch (e) {
                    console.warn(`Could not delete supplementary file: ${file.url}`, e)
                }
            }
        }
        // Delete cover image from storage
        if(bookToDelete.imageUrl) {
            try {
                await deleteObject(ref(storage, bookToDelete.imageUrl));
            } catch (e) {
                console.warn(`Could not delete image: ${bookToDelete.imageUrl}`, e)
            }
        }
        // Delete book from firestore
        await deleteDoc(doc(db, 'books', bookId));
        toast({ title: 'Success', description: 'Book deleted successfully.' });
        clearCache('allBooks');
        clearCache(`book_${bookId}`);
        fetchBooks();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to delete book: ${error.message}`,
        });
    }
  };

  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    if (filter === 'fiction') return book.category.toLowerCase() === 'fiction';
    if (filter === 'non-fiction') return book.category.toLowerCase() === 'non-fiction';
    if (filter === 'low-stock') return book.stock > 0 && book.stock < 10;
    if (filter === 'in-stock') return book.stock > 0;
    if (filter === 'out-of-stock') return book.stock === 0;
    return true;
  });

  return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Books</CardTitle>
              <CardDescription>
              Manage your book catalog. View, edit, and add new books.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 w-full sm:w-auto">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                    </span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fiction">Fiction</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="non-fiction">Non-Fiction</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="low-stock">Low Stock</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="in-stock">In Stock</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="out-of-stock">Out of Stock</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" className="h-8 gap-1 w-full sm:w-auto">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
                </span>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-8 gap-1 w-full sm:w-auto">
                <Link href="/store">
                    <Store className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    View Storefront
                    </span>
                </Link>
              </Button>
              <Button size="sm" className="h-8 gap-1 w-full sm:w-auto" onClick={onAddBook}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Book
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                  <span className="sr-only">Actions</span>
              </TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center">
                        <div className="flex justify-center items-center p-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    </TableCell>
                </TableRow>
              ) : filteredBooks.length > 0 ? filteredBooks.map((book) => (
              <TableRow key={book.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                        alt="Book cover"
                        className="aspect-[2/3] rounded-md object-cover"
                        height="90"
                        src={book.imageUrl || "https://picsum.photos/60/90"}
                        width="60"
                        data-ai-hint="book cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{book.author}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{book.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                  {book.stock > 0 ? (
                      <span className={book.stock < 10 ? 'text-destructive font-semibold' : ''}>
                      {book.stock} in stock
                      </span>
                  ) : (
                      <span className="text-muted-foreground">Out of stock</span>
                  )}
                  </TableCell>
                  <TableCell className="text-right">{currencySymbol}{book.price.toFixed(2)}</TableCell>
                  <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onEditBook(book.id)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/store/book/${book.id}`} target="_blank">View in Store</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleDeleteBook(book.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  </TableCell>
              </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No books found.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{filteredBooks.length}</strong> of <strong>{books.length}</strong> books
          </div>
        </CardFooter>
      </Card>
  );
}
