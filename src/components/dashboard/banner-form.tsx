
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { BookImage, ChevronLeft, Upload, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { Banner, Book } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';

type BannerFormProps = {
    bannerId?: string;
    onSaveSuccess: () => void;
    onCancel: () => void;
};

export function BannerForm({ bannerId, onSaveSuccess, onCancel }: BannerFormProps) {
  const [formData, setFormData] = React.useState<Partial<Banner>>({
    title: '',
    description: '',
    imageUrl: '',
    callToAction: '',
    bookId: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(!!bannerId);
  const [books, setBooks] = React.useState<Book[]>([]);

  React.useEffect(() => {
    const fetchBooks = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'books'));
            const booksData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Book[];
            setBooks(booksData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch books.' });
        }
    }
    fetchBooks();
  }, [toast]);
  

  React.useEffect(() => {
    if (bannerId) {
      const fetchBanner = async () => {
        setIsLoading(true);
        try {
          const bannerRef = doc(db, 'banners', bannerId);
          const bannerSnap = await getDoc(bannerRef);
          if (bannerSnap.exists()) {
            setFormData({ ...bannerSnap.data(), id: bannerSnap.id } as Banner);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Banner not found.' });
            onCancel();
          }
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to fetch banner: ${error.message}` });
        } finally {
          setIsLoading(false);
        }
      };
      fetchBanner();
    }
  }, [bannerId, onCancel, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, bookId: value }));
  };
  
  const handleSwitchChange = (checked: boolean) => {
      setFormData(prev => ({...prev, isActive: checked}));
  }

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
        if (bannerId && formData.imageUrl?.startsWith('gs://')) {
          try {
            const oldImageRef = ref(storage, formData.imageUrl);
            await deleteObject(oldImageRef);
          } catch (e) {
            console.warn("Old image not found, could not delete.", e);
          }
        }
        const imagePath = `banners/${uuidv4()}-${imageFile.name}`;
        imageUrl = await uploadFile(imageFile, imagePath);
      }

      const bannerData = { ...formData, imageUrl };
      delete bannerData.id;

      if (bannerId) {
        const bannerRef = doc(db, 'banners', bannerId);
        await updateDoc(bannerRef, bannerData);
        toast({ title: 'Success', description: 'Banner updated successfully.' });
      } else {
        await addDoc(collection(db, 'banners'), bannerData);
        toast({ title: 'Success', description: 'Banner added successfully.' });
      }
      onSaveSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to save banner: ${error.message}` });
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
                {bannerId ? 'Edit Banner' : 'Add New Banner'}
            </h1>
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Banner'}
                </Button>
            </div>
      </div>
        <Card>
            <CardHeader>
                <CardTitle>Banner Details</CardTitle>
                <CardDescription>Fill in the details for the promotional banner.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="sm:col-span-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} className="mt-1" />
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" />
                        </div>
                         <div className="sm:col-span-2">
                            <Label htmlFor="callToAction">Call to Action URL</Label>
                             <div className="relative mt-1">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="callToAction" name="callToAction" placeholder="/books/book-id" value={formData.callToAction} onChange={handleChange} className="pl-9" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <Label htmlFor="bookId">Link to Book (optional)</Label>
                            <Select onValueChange={handleSelectChange} value={formData.bookId}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {books.map(book => (
                                        <SelectItem key={book.id} value={book.id}>{book.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                           <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
                           <Label htmlFor="isActive">Set banner as active</Label>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <Label>Banner Image</Label>
                            <div
                                className="mt-1 aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                {formData.imageUrl ? (
                                    <Image src={formData.imageUrl} alt={formData.title || 'Banner image'} width={1280} height={720} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2">Click to upload banner image</p>
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
                    </div>
                </div>
            </CardContent>
        </Card>
        <div className="mt-4 flex items-center justify-end gap-2 md:hidden">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Banner'}
            </Button>
        </div>
    </div>
  );
}
