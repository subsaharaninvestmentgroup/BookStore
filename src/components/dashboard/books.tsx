'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle, File, ListFilter } from 'lucide-react';
import { books as initialBooks } from '@/lib/data';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

const BookForm = ({ book, onSave, onCancel }: { book?: Book | null, onSave: (book: Book) => void, onCancel: () => void }) => {
  const [formData, setFormData] = React.useState<Partial<Book>>(
    book || { 
        title: '', 
        author: '', 
        category: '', 
        price: 0, 
        stock: 0, 
        description: '', 
        publicationDate: '', 
        details: '', 
        imageUrl: '' 
    }
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSave(formData as Book);
  };

  return (
    <DialogContent className="sm:max-w-3xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogDescription>
          {book ? 'Update the details of the book.' : 'Fill in the details for the new book.'}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="pr-4 -mr-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className='sm:col-span-2'>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1" />
              </div>
              <div className='sm:col-span-2'>
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" name="author" value={formData.author} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                  <Label htmlFor="publicationDate">Published Date</Label>
                  <Input id="publicationDate" name="publicationDate" type="date" value={formData.publicationDate} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                  <Label htmlFor="details">Details</Label>
                  <Input id="details" name="details" placeholder='e.g. Hardcover, 224 pages' value={formData.details} onChange={handleChange} className="mt-1" />
              </div>
          </div>
          <div className='space-y-4'>
              <div
                className='aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer'
                onClick={() => fileInputRef.current?.click()}
              >
                  {formData.imageUrl ? (
                      <Image src={formData.imageUrl} alt={formData.title || 'Book cover'} width={400} height={600} className="object-cover w-full h-full" />
                  ) : (
                      <div className='text-center text-sm text-muted-foreground p-4'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                          <p className='mt-2'>Click to upload image</p>
                      </div>
                  )}
              </div>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
          </div>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Save changes</Button>
      </DialogFooter>
    </DialogContent>
  );
};


export default function Books() {
  const [books, setBooks] = React.useState<Book[]>(initialBooks);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<Book | null>(null);
  const [filter, setFilter] = React.useState('all');

  const handleSaveBook = (bookToSave: Book) => {
    if (editingBook) {
      setBooks(books.map(b => b.id === bookToSave.id ? bookToSave : b));
    } else {
      setBooks([...books, { ...bookToSave, id: (books.length + 1).toString() }]);
    }
    setEditingBook(null);
    setIsFormOpen(false);
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
  };
  
  const handleAddNew = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  }

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
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
              <Button size="sm" className="h-8 gap-1 w-full sm:w-auto" onClick={handleAddNew}>
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
              {filteredBooks.map((book) => (
              <TableRow key={book.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                        alt="Book cover"
                        className="aspect-[2/3] rounded-md object-cover"
                        height="90"
                        src={book.imageUrl}
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
                  <TableCell className="text-right">${book.price.toFixed(2)}</TableCell>
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
                      <DropdownMenuItem onSelect={() => handleEdit(book)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDeleteBook(book.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  </TableCell>
              </TableRow>
              ))}
          </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{filteredBooks.length}</strong> of <strong>{books.length}</strong> books
          </div>
        </CardFooter>
      </Card>
      {isFormOpen && <BookForm book={editingBook} onSave={handleSaveBook} onCancel={() => setIsFormOpen(false)} />}
    </Dialog>
  );
}
