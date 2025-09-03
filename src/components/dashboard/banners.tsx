
'use client';

import * as React from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import type { Banner } from '@/lib/types';
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

type BannersProps = {
    onAddBanner: () => void;
    onEditBanner: (bannerId: string) => void;
};

export default function Banners({ onAddBanner, onEditBanner }: BannersProps) {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchBanners = React.useCallback(async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'banners'));
        const bannersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Banner[];
        setBanners(bannersData);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Error fetching banners',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleDeleteBanner = async (bannerId: string) => {
    const bannerToDelete = banners.find(b => b.id === bannerId);
    if (!bannerToDelete) return;

    if (!confirm(`Are you sure you want to delete "${bannerToDelete.title}"?`)) return;

    try {
        if(bannerToDelete.imageUrl) {
            try {
                await deleteObject(ref(storage, bannerToDelete.imageUrl));
            } catch (e) {
                console.warn(`Could not delete image: ${bannerToDelete.imageUrl}`, e)
            }
        }
        await deleteDoc(doc(db, 'banners', bannerId));
        toast({ title: 'Success', description: 'Banner deleted successfully.' });
        fetchBanners();
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to delete banner: ${error.message}`,
        });
    }
  };

  return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Banners</CardTitle>
              <CardDescription>
                Manage your promotional sales banners.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button size="sm" className="h-8 gap-1 w-full sm:w-auto" onClick={onAddBanner}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Banner
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead className="hidden w-[200px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Linked Book</TableHead>
              <TableHead>
                  <span className="sr-only">Actions</span>
              </TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        <div className="flex justify-center items-center p-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    </TableCell>
                </TableRow>
              ) : banners.length > 0 ? banners.map((banner) => (
              <TableRow key={banner.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                        alt="Banner image"
                        className="aspect-video rounded-md object-cover"
                        height="64"
                        src={banner.imageUrl || "https://picsum.photos/128/72"}
                        width="128"
                        data-ai-hint="banner image"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{banner.bookId || 'N/A'}</TableCell>
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
                      <DropdownMenuItem onSelect={() => onEditBanner(banner.id)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDeleteBanner(banner.id)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  </TableCell>
              </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No banners found.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{banners.length}</strong> of <strong>{banners.length}</strong> banners
          </div>
        </CardFooter>
      </Card>
  );
}
