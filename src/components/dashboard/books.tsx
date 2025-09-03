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

const BookForm = ({ book, onSave, onCancel }: { book?: Book | null, onSave: (book: Book) => void, onCancel: () => void }) => {
  const [formData, setFormData] = React.useState<Partial<Book>>(
    book || { title: '', author: '', category: '', price: 0, stock: 0 }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = () => {
    onSave(formData as Book);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
        <DialogDescription>
          {book ? 'Update the details of the book.' : 'Fill in the details for the new book.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="author" className="text-right">Author</Label>
          <Input id="author" name="author" value={formData.author} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="category" className="text-right">Category</Label>
          <Input id="category" name="category" value={formData.category} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="price" className="text-right">Price</Label>
          <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="stock" className="text-right">Stock</Label>
          <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} className="col-span-3" />
        </div>
      </div>
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
      <div className="flex items-center mb-4">
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
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
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Book
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Books</CardTitle>
          <CardDescription>
          Manage your book catalog. View, edit, and add new books.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>
                  <span className="sr-only">Actions</span>
              </TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {filteredBooks.map((book) => (
              <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>
                  <Badge variant="outline">{book.category}</Badge>
                  </TableCell>
                  <TableCell>
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
