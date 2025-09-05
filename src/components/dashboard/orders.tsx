
'use client';

import * as React from 'react';
import { MoreHorizontal, File, X, ShoppingCart, User, Mail, Home, CreditCard, ArrowUpDown } from 'lucide-react';
import type { Order } from '@/lib/types';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol, getCachedData, setCachedData, clearCache } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Separator } from '../ui/separator';

type ShippingStatus = Order['shippingStatus'];
const shippingStatuses: ShippingStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];


const OrderDetailSheet = ({ order, open, onOpenChange, currencySymbol }: { order: Order | null; open: boolean; onOpenChange: (open: boolean) => void, currencySymbol: string }) => {
    if (!order) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full max-w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">Order #{order.id.substring(0, 7)}</SheetTitle>
                    <SheetDescription>
                        Details for order placed on {new Date(order.date).toLocaleString()}.
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <User className="w-8 h-8 text-muted-foreground" />
                            <div>
                                <CardTitle>Customer</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span>{order.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span>{order.customerEmail}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping Address</span>
                                <span className="text-right">{order.address || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                            <div>
                                <CardTitle>Order Items</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {order.items.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center">
                                        <span>{item.bookTitle || `Book ID: ${item.bookId}`} x {item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                             <CreditCard className="w-8 h-8 text-muted-foreground" />
                            <div>
                                <CardTitle>Payment & Shipping</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>{currencySymbol}{order.amount.toFixed(2)}</span>
                            </div>
                             <Separator className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Status</span>
                                <Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'secondary'} className="capitalize">{order.paymentStatus}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping Status</span>
                                <Badge variant={getBadgeVariant(order.shippingStatus)} className="capitalize">{order.shippingStatus}</Badge>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Payment Reference</span>
                                <span className="font-mono text-xs">{order.paymentReference}</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </SheetContent>
        </Sheet>
    );
};

const getBadgeVariant = (status: Order['shippingStatus']) => {
    switch (status) {
      case 'Delivered':
        return 'default';
      case 'Shipped':
        return 'secondary';
      case 'Processing':
        return 'outline';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  }


export default function Orders() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('all');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const [currencySymbol, setCurrencySymbol] = React.useState('$');
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  React.useEffect(() => {
    const savedCurrency = localStorage.getItem('bookstore-currency') || 'USD';
    setCurrencySymbol(getCurrencySymbol(savedCurrency));
  }, []);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    const cacheKey = `orders_${sortDirection}`;
    const cachedOrders = getCachedData(cacheKey);
    if (cachedOrders) {
        setOrders(cachedOrders);
        setLoading(false);
        return;
    }
    try {
        const ordersQuery = query(collection(db, 'orders'), orderBy('date', sortDirection));
        const querySnapshot = await getDocs(ordersQuery);
        const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
        setOrders(ordersData);
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
  }, [toast, sortDirection]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleShippingStatusChange = async (orderId: string, status: ShippingStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
        await updateDoc(orderRef, { shippingStatus: status });
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, shippingStatus: status } : o);
        setOrders(updatedOrders);
        clearCache('orders_asc');
        clearCache('orders_desc');
        setCachedData(`orders_${sortDirection}`, updatedOrders); // Update cache
        clearCache('dashboardOverview'); // Invalidate overview cache
        toast({ title: 'Success', description: 'Order status updated.'});
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to update status: ${error.message}`,
        });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };
  
  const toggleSortDirection = () => {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.shippingStatus.toLowerCase() === activeTab;
  });

  const renderTable = (orderList: Order[]) => (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>Orders</CardTitle>
        <CardDescription>
        Manage your customer orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Table>
          <TableHeader>
              <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">
                  Shipping
              </TableHead>
              <TableHead className="hidden md:table-cell">
                  Date
              </TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
            ) : orderList.length > 0 ? orderList.map((order) => (
              <TableRow key={order.id} onClick={() => handleViewDetails(order)} className="cursor-pointer">
                  <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                          {order.customerEmail}
                      </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className='h-auto p-0'>
                          <Badge variant={getBadgeVariant(order.shippingStatus)} className="capitalize cursor-pointer">{order.shippingStatus}</Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuRadioGroup 
                            value={order.shippingStatus} 
                            onValueChange={(value) => handleShippingStatusChange(order.id, value as ShippingStatus)}
                          >
                          {shippingStatuses.map(status => (
                              <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                          ))}
                          </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                      {new Date(order.date).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{currencySymbol}{order.amount.toFixed(2)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => handleViewDetails(order)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
      </CardContent>
      <CardFooter>
          <div className="text-xs text-muted-foreground">
          Showing <strong>1-{orderList.length}</strong> of <strong>{orders.length}</strong> orders
          </div>
      </CardFooter>
    </Card>
  );


  return (
      <>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="flex items-center">
                <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="delivered" className="hidden sm:flex">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled" className="hidden sm:flex">Cancelled</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={toggleSortDirection}>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Sort by Time
                    </span>
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                    </span>
                </Button>
                </div>
            </div>
            <TabsContent value="all">{renderTable(filteredOrders)}</TabsContent>
            <TabsContent value="processing">{renderTable(filteredOrders)}</TabsContent>
            <TabsContent value="shipped">{renderTable(filteredOrders)}</TabsContent>
            <TabsContent value="delivered">{renderTable(filteredOrders)}</TabsContent>
            <TabsContent value="cancelled">{renderTable(filteredOrders)}</TabsContent>
        </Tabs>
        <OrderDetailSheet order={selectedOrder} open={isSheetOpen} onOpenChange={setIsSheetOpen} currencySymbol={currencySymbol} />
    </>
  );
}

    