'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { customers as initialCustomers, orders } from '@/lib/data';
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

const CustomerDetailSheet = ({ customer, orders, open, onOpenChange }: { customer: Customer | null; orders: Order[]; open: boolean; onOpenChange: (open: boolean) => void }) => {
    if (!customer) return null;
  
    const customerOrders = orders.filter(o => o.customerEmail === customer.email);
  
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${customer.email}`} />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl">{customer.name}</SheetTitle>
                <SheetDescription>{customer.email}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Join Date</p>
              <p className="font-medium">{customer.joinDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Orders</p>
              <p className="font-medium">{customer.totalOrders}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Total Spent</p>
              <p className="font-medium text-lg text-primary">${customer.totalSpent.toFixed(2)}</p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-2">Order History</h3>
          <div className="max-h-96 overflow-y-auto pr-2">
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
                                <p className='font-medium'>{order.id}</p>
                                <p className='text-xs text-muted-foreground'>{order.date}</p>
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.shippingStatus === 'Delivered' ? 'default' : 'secondary'} className='capitalize'>{order.shippingStatus}</Badge>
                            </TableCell>
                            <TableCell className='text-right'>${order.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    );
  };
  

export default function Customers() {
  const [customers] = React.useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

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
              <TableHead>Email</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(customer)}>
                <TableCell className="font-medium flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${customer.email}`} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {customer.name}
                </TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.totalOrders}</TableCell>
                <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
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
                      <DropdownMenuItem onSelect={() => handleViewDetails(customer)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Send Email</DropdownMenuItem>
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
          Showing <strong>1-{customers.length}</strong> of <strong>{customers.length}</strong> customers
        </div>
      </CardFooter>
    </Card>
    <CustomerDetailSheet customer={selectedCustomer} orders={orders} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  );
}
