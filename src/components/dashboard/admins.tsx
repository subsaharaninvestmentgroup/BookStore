
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Customer } from '@/lib/types';
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getCachedData, setCachedData, clearCache } from '@/lib/utils';
import { Badge } from '../ui/badge';

export default function Admins() {
  const [admins, setAdmins] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchAdmins = React.useCallback(async () => {
    setLoading(true);
    const cachedAdmins = getCachedData('admins');
    if (cachedAdmins) {
      setAdmins(cachedAdmins);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'customers'), where('isAdmin', '==', true));
      const querySnapshot = await getDocs(q);
      const adminsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Customer[];
      setAdmins(adminsData);
      setCachedData('admins', adminsData);
    } catch(error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching admins',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  React.useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);


  const demoteAdmin = async (adminId: string) => {
    // Placeholder for demotion logic
    toast({
        title: 'Action Required',
        description: 'Demoting admins is not yet implemented.',
    });
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Admins</CardTitle>
        <CardDescription>
          View and manage your store administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Join Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        <div className="flex justify-center items-center p-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    </TableCell>
                </TableRow>
            ) : admins.length > 0 ? admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${admin.email}`} />
                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {admin.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                    {admin.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">{admin.joinDate}</TableCell>
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
                      <DropdownMenuItem onSelect={() => demoteAdmin(admin.id)}>Demote to Customer</DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No admins found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{admins.length}</strong> of <strong>{admins.length}</strong> admins
        </div>
      </CardFooter>
    </Card>
    </>
  );
}
