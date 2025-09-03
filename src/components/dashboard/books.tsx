
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle, File, ListFilter, Upload, X as XIcon, Paperclip, BookImage } from 'lucide-react';
import type { Book, SupplementaryFile } from '@/lib/types';
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
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

type UploadableFile = {
    file: File;
    name: string;
    url: string;
    type: string;
};

const BookForm = ({ book, onSave, onCancel }: { book?: Book | null, onSave: () => void, onCancel: () => void }) => {
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
        imageUrl: '',
        supplementaryFiles: [],
    }
  );
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [newSupplementaryFiles, setNewSupplementaryFiles] = React.useState<UploadableFile[]>([]);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFilesArray = Array.from(files).map(file => {
        const reader = new FileReader();
        return new Promise<UploadableFile>(resolve => {
          reader.onloadend = () => {
            resolve({
              file,
              name: file.name,
              url: reader.result as string,
              type: file.type,
            });
          };
          reader.readAsDataURL(file);
        });
      });
      Promise.all(newFilesArray).then(processedFiles => {
        setNewSupplementaryFiles(prev => [...prev, ...processedFiles]);
      });
    }
  };

  const removeSupplementaryFile = (index: number, isNew: boolean) => {
    if (isNew) {
        setNewSupplementaryFiles(prev => prev.filter((_, i) => i !== index));
    } else {
        setFormData(prev => ({
            ...prev,
            supplementaryFiles: prev.supplementaryFiles?.filter((_, i) => i !== index),
        }));
    }
  }

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
        let imageUrl = formData.imageUrl || '';
        if (imageFile) {
            if (book?.imageUrl) {
                try {
                    const oldImageRef = ref(storage, book.imageUrl);
                    await deleteObject(oldImageRef);
                } catch(e) {
                    console.warn("Old image not found, could not delete.", e)
                }
            }
            const imagePath = `books/${uuidv4()}-${imageFile.name}`;
            imageUrl = await uploadFile(imageFile, imagePath);
        }
        
        const uploadedFiles: SupplementaryFile[] = [];
        for (const upFile of newSupplementaryFiles) {
            const filePath = `supplementary/${uuidv4()}-${upFile.name}`;
            const fileUrl = await uploadFile(upFile.file, filePath);
            uploadedFiles.push({ name: upFile.name, url: fileUrl, type: upFile.type });
        }
        
        const finalSupplementaryFiles = [...(formData.supplementaryFiles || []), ...uploadedFiles];

        const bookData = { ...formData, imageUrl, supplementaryFiles: finalSupplementaryFiles };
        delete bookData.id;

        if (book?.id) {
            const bookRef = doc(db, 'books', book.id);
            await updateDoc(bookRef, bookData);
            toast({ title: 'Success', description: 'Book updated successfully.' });
        } else {
            await addDoc(collection(db, 'books'), bookData);
            toast({ title: 'Success', description: 'Book added successfully.' });
        }
        onSave();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to save book: ${error.message}`,
        });
    } finally {
        setIsSaving(false);
    }
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
          <div className='space-y-6'>
              <div>
                <Label>Book Cover</Label>
                <div
                  className='mt-1 aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer'
                  onClick={() => imageInputRef.current?.click()}
                >
                    {formData.imageUrl ? (
                        <Image src={formData.imageUrl} alt={formData.title || 'Book cover'} width={400} height={600} className="object-cover w-full h-full" />
                    ) : (
                        <div className='text-center text-sm text-muted-foreground p-4'>
                            <BookImage className="mx-auto h-12 w-12 text-gray-400" />
                            <p className='mt-2'>Click to upload cover</p>
                        </div>
                    )}
                </div>
                <Input
                  id="imageUpload"
                  name="imageUpload"
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <div>
                <Label>Supplementary Files</Label>
                <div
                  className='mt-1 p-4 w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed'
                  onClick={() => fileInputRef.current?.click()}
                >
                    <div className='text-center text-sm text-muted-foreground'>
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className='mt-2'>Click to upload files</p>
                        <p className="text-xs">PDF, DOC, PPT</p>
                    </div>
                </div>
                <Input
                  id="fileUpload"
                  name="fileUpload"
                  type="file"
                  accept="application/pdf,.doc,.docx,.ppt,.pptx"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <div className="mt-2 space-y-2">
                  {formData.supplementaryFiles?.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-4 w-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSupplementaryFile(index, false)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {newSupplementaryFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-4 w-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSupplementaryFile(index, true)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};


export default function Books() {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<Book | null>(null);
  const [filter, setFilter] = React.useState('all');
  const { toast } = useToast();

  const fetchBooks = React.useCallback(async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const booksData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Book[];
        setBooks(booksData);
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

  const handleSaveBook = () => {
    setIsFormOpen(false);
    setEditingBook(null);
    fetchBooks();
  };

  const handleDeleteBook = async (bookId: string) => {
    const bookToDelete = books.find(b => b.id === bookId);
    if (!bookToDelete) return;

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
        fetchBooks();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to delete book: ${error.message}`,
        });
    }
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
    <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setEditingBook(null);
        }
        setIsFormOpen(isOpen);
    }}>
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
      {isFormOpen && <BookForm book={editingBook} onSave={handleSaveBook} onCancel={() => setIsFormOpen(false)} />}
    </Dialog>
  );
}
