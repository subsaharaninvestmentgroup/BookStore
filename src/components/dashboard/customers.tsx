
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Customer, Order } from '@/lib/types';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol, getCachedData, setCachedData } from '@/lib/utils';

const CustomerDetailSheet = ({ customer, open, onOpenChange, currencySymbol }: { customer: Customer | null; open: boolean; onOpenChange: (open: boolean) => void, currencySymbol: string }) => {
    const [customerOrders, setCustomerOrders] = React.useState<Order[]>([]);
    const [loading, setLoading] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        if (customer && open) {
            const fetchOrders = async () => {
                setLoading(true);
                const cacheKey = `orders_${customer.id}`;
                const cachedOrders = getCachedData(cacheKey);
                if (cachedOrders) {
                    setCustomerOrders(cachedOrders);
                    setLoading(false);
                    return;
                }
                try {
                    const q = query(collection(db, 'orders'), where('customerEmail', '==', customer.email));
                    const querySnapshot = await getDocs(q);
                    const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
                    setCustomerOrders(ordersData);
                    setCachedData(cacheKey, ordersData);
                } catch(error: any) {
                    toast({
                        variant: 'destructive',
                        title: 'Error fetching orders',
                        description: error.message,
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchOrders();
        }
    }, [customer, open, toast]);

    if (!customer) return null;
  
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full max-w-full sm:max-w-lg">
          <SheetHeader className="mb-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${customer.email}`} />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <SheetTitle className="text-2xl">{customer.name}</SheetTitle>
                <SheetDescription>{customer.email}</SheetDescription>
                 <Badge variant={customer.isAdmin ? 'default' : 'secondary'}>{customer.isAdmin ? 'Admin' : 'Customer'}</Badge>
              </div>
            </div>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Join Date</p>
              <p className="font-medium">{customer.joinDate}</p>
            </div>
             <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Orders</p>
              <p className="font-medium">{customer.totalOrders}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Total Spent</p>
              <p className="font-medium text-lg text-primary">{currencySymbol}{customer.totalSpent.toFixed(2)}</p>
            </div>
             <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{customer.address || 'N/A'}</p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-2">Order History</h3>
          <div className="max-h-96 overflow-y-auto pr-2">
            {loading ? (
                <div className="flex justify-center items-center p-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className='text-right'>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <p className='font-medium'>{order.id.substring(0,7)}</p>
                                    <p className='text-xs text-muted-foreground'>{new Date(order.date).toLocaleString()}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={order.shippingStatus === 'Delivered' ? 'default' : 'secondary'} className='capitalize'>{order.shippingStatus}</Badge>
                                </TableCell>
                                <TableCell className='text-right'>{currencySymbol}{order.amount.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  };
  

export default function Customers() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { toast } = useToast();
  const [currencySymbol, setCurrencySymbol] = React.useState('$');

  React.useEffect(() => {
    const savedCurrency = localStorage.getItem('bookstore-currency') || 'USD';
    setCurrencySymbol(getCurrencySymbol(savedCurrency));

    const fetchCustomers = async () => {
        setLoading(true);
        const cachedCustomers = getCachedData('customers');
        if (cachedCustomers) {
            setCustomers(cachedCustomers);
            setLoading(false);
            return;
        }

        try {
            const q = query(collection(db, 'customers'), where('isAdmin', '!=', true));
            const querySnapshot = await getDocs(q);
            const customersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Customer[];
            setCustomers(customersData);
            setCachedData('customers', customersData);
        } catch(error: any) {
            toast({
                variant: 'destructive',
                title: 'Error fetching customers',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
      };
      fetchCustomers();
  }, [toast]);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>
          View and manage your customer profiles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Total Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
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
            ) : customers.length > 0 ? customers.map((customer) => (
              <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(customer)}>
                <TableCell className="font-medium flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${customer.email}`} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {customer.name}
                </TableCell>
                <TableCell className="hidden md:table-cell">{customer.totalOrders}</TableCell>
                <TableCell className="text-right">{currencySymbol}{customer.totalSpent.toFixed(2)}</TableCell>
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
                      <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); handleViewDetails(customer); }}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{customers.length}</strong> of <strong>{customers.length}</strong> customers
        </div>
      </CardFooter>
    </Card>
    <CustomerDetailSheet customer={selectedCustomer} open={isSheetOpen} onOpenChange={setIsSheetOpen} currencySymbol={currencySymbol} />
    </>
  );
}
