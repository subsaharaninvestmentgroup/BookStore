
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { BookImage, Paperclip, Upload, X as XIcon, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { Book, SupplementaryFile } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';

type UploadableFile = {
    file: File;
    name: string;
    url: string;
    type: string;
};

type BookFormProps = {
    bookId?: string;
    onSaveSuccess: () => void;
    onCancel: () => void;
};

export function BookForm({ bookId, onSaveSuccess, onCancel }: BookFormProps) {
  const [formData, setFormData] = React.useState<Partial<Book>>({
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
    sampleText: '',
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [newSupplementaryFiles, setNewSupplementaryFiles] = React.useState<UploadableFile[]>([]);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!bookId);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    if (bookId) {
      const fetchBook = async () => {
        setIsLoading(true);
        try {
          const bookRef = doc(db, 'books', bookId);
          const bookSnap = await getDoc(bookRef);
          if (bookSnap.exists()) {
            setFormData({ ...bookSnap.data(), id: bookSnap.id } as Book);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Book not found.' });
            onCancel();
          }
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to fetch book: ${error.message}` });
        } finally {
          setIsLoading(false);
        }
      };
      fetchBook();
    }
  }, [bookId, onCancel, toast]);

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
      const newFilesArray = Array.from(files).map(file => ({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      }));
      setNewSupplementaryFiles(prev => [...prev, ...newFilesArray]);
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
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      let imageUrl = formData.imageUrl || '';
      if (imageFile) {
        if (bookId && formData.imageUrl?.startsWith('gs://')) {
          try {
            const oldImageRef = ref(storage, formData.imageUrl);
            await deleteObject(oldImageRef);
          } catch (e) {
            console.warn("Old image not found, could not delete.", e);
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

      if (bookId) {
        const bookRef = doc(db, 'books', bookId);
        await updateDoc(bookRef, bookData);
        toast({ title: 'Success', description: 'Book updated successfully.' });
      } else {
        await addDoc(collection(db, 'books'), bookData);
        toast({ title: 'Success', description: 'Book added successfully.' });
      }
      onSaveSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to save book: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onCancel}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {bookId ? 'Edit Book' : 'Add New Book'}
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                 <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} disabled={isSaving}>
                    Preview
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Book'}
                </Button>
            </div>
      </div>
        <Card>
            <CardHeader>
                <CardTitle>Book Details</CardTitle>
                <CardDescription>Fill in the details for the book.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="sm:col-span-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
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
                            <Input id="details" name="details" placeholder="e.g. Hardcover, 224 pages" value={formData.details} onChange={handleChange} className="mt-1" />
                        </div>
                         <div className="sm:col-span-2">
                            <Label htmlFor="sampleText">Sample Text</Label>
                            <Textarea id="sampleText" name="sampleText" value={formData.sampleText} onChange={handleChange} className="mt-1" rows={5} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <Label>Book Cover</Label>
                            <div
                                className="mt-1 aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                {formData.imageUrl ? (
                                    <Image src={formData.imageUrl} alt={formData.title || 'Book cover'} width={400} height={600} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4">
                                        <BookImage className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2">Click to upload cover</p>
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
                                className="mt-1 p-4 w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="text-center text-sm text-muted-foreground">
                                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-2">Click to upload files</p>
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
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                                {formData.supplementaryFiles?.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2 truncate">
                                            <Paperclip className="h-4 w-4" />
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{file.name}</a>
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
            </CardContent>
        </Card>
        <div className="mt-4 flex items-center justify-end gap-2 md:hidden">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} disabled={isSaving}>
                Preview
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Book'}
            </Button>
        </div>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Book Preview</DialogTitle>
                    <DialogDescription>This is how the book details will look.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                         <div className="md:col-span-1">
                             {formData.imageUrl ? (
                                <Image src={formData.imageUrl} alt={formData.title || 'Book cover'} width={400} height={600} className="object-cover w-full rounded-lg shadow-lg" />
                            ) : (
                                <div className="aspect-[2/3] w-full bg-muted rounded-lg flex items-center justify-center">
                                    <BookImage className="h-16 w-16 text-gray-400" />
                                </div>
                            )}
                         </div>
                         <div className="md:col-span-2 space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold">{formData.title || "Untitled Book"}</h2>
                                <p className="text-lg text-muted-foreground">by {formData.author || 'Unknown Author'}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="font-semibold">${(formData.price || 0).toFixed(2)}</span>
                                <span className="text-muted-foreground">{formData.category}</span>
                                <span className="text-muted-foreground">{formData.details}</span>
                            </div>
                             <div>
                                <h3 className="font-semibold border-b pb-2 mb-2">Description</h3>
                                <p className="text-sm text-muted-foreground">{formData.description || "No description provided."}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold border-b pb-2 mb-2">Sample Text</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.sampleText || "No sample text provided."}</p>
                            </div>
                         </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

