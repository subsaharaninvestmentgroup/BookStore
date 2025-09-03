
'use client';

import * as React from 'react';
import { MoreHorizontal, File } from 'lucide-react';
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
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/lib/utils';

type ShippingStatus = Order['shippingStatus'];
const shippingStatuses: ShippingStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('all');
  const { toast } = useToast();
  const [currencySymbol, setCurrencySymbol] = React.useState('$');

  React.useEffect(() => {
    const savedCurrency = localStorage.getItem('bookstore-currency') || 'USD';
    setCurrencySymbol(getCurrencySymbol(savedCurrency));
  }, []);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
        setOrders(ordersData);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Error fetching orders',
            description: error.message,
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleShippingStatusChange = async (orderId: string, status: ShippingStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    try {
        await updateDoc(orderRef, { shippingStatus: status });
        setOrders(orders.map(o => o.id === orderId ? { ...o, shippingStatus: status } : o));
        toast({ title: 'Success', description: 'Order status updated.'});
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to update status: ${error.message}`,
        });
    }
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
              <TableRow key={order.id}>
                  <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                          {order.customerEmail}
                      </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
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
                      {order.date}
                  </TableCell>
                  <TableCell className="text-right">{currencySymbol}{order.amount.toFixed(2)}</TableCell>
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
                      <DropdownMenuItem>View Details</DropdownMenuItem>
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
  );
}
