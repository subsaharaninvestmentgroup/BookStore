
'use client';

import * as React from 'react';
import { DollarSign, Users, CreditCard, BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Badge } from "../ui/badge";
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, Book } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol, getCachedData, setCachedData, getStoreCurrency } from '@/lib/utils';

const chartData = [
  { month: "January", total: 0 },
  { month: "February", total: 0 },
  { month: "March", total: 0 },
  { month: "April", total: 0 },
  { month: "May", total: 0 },
  { month: "June", total: 0 },
  { month: "July", total: 0 },
  { month: "August", total: 0 },
  { month: "September", total: 0 },
  { month: "October", total: 0 },
  { month: "November", total: 0 },
  { month: "December", total: 0 },
];

const chartConfig = {
  total: {
    label: "Total Sales",
    color: "hsl(var(--chart-1))",
  },
};

export default function Overview() {
  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [totalSales, setTotalSales] = React.useState(0);
  const [totalCustomers, setTotalCustomers] = React.useState(0);
  const [bestSeller, setBestSeller] = React.useState<Book | null>(null);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [salesData, setSalesData] = React.useState(chartData);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const [currencySymbol, setCurrencySymbol] = React.useState('$');

  React.useEffect(() => {
    getStoreCurrency().then(currency => {
        setCurrencySymbol(getCurrencySymbol(currency));
    });

    const fetchData = async () => {
      setLoading(true);
      const cachedData = getCachedData('dashboardOverview');
      if (cachedData) {
        setTotalRevenue(cachedData.totalRevenue);
        setTotalSales(cachedData.totalSales);
        setTotalCustomers(cachedData.totalCustomers);
        setBestSeller(cachedData.bestSeller);
        setRecentOrders(cachedData.recentOrders);
        setSalesData(cachedData.salesData);
        setLoading(false);
        return;
      }
      try {
        // Fetch Orders
        const ordersQuery = query(collection(db, 'orders'), orderBy('date', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({...doc.data(), id: doc.id})) as Order[];
        
        const monthlySales = [...chartData].map(d => ({...d}));
        let revenue = 0;
        ordersData.forEach(order => {
          revenue += order.amount;
          const orderDate = new Date(order.date);
          const monthIndex = orderDate.getMonth();
          if(monthlySales[monthIndex]) {
            monthlySales[monthIndex].total += order.amount;
          }
        });
        const currentMonthSales = monthlySales.slice(0, new Date().getMonth() + 1)
        
        setTotalRevenue(revenue);
        setTotalSales(ordersData.length);
        const slicedRecentOrders = ordersData.slice(0, 5)
        setRecentOrders(slicedRecentOrders);
        setSalesData(currentMonthSales);

        // Fetch Customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const numCustomers = customersSnapshot.size;
        setTotalCustomers(numCustomers);

        // Fetch Books for best seller
        const booksQuery = query(collection(db, 'books'), orderBy('stock', 'asc'), limit(1)); // Approximation of best seller
        const booksSnapshot = await getDocs(booksQuery);
        let foundBestSeller: Book | null = null;
        if(!booksSnapshot.empty) {
          foundBestSeller = booksSnapshot.docs[0].data() as Book
          setBestSeller(foundBestSeller);
        }
        
        setCachedData('dashboardOverview', {
            totalRevenue: revenue,
            totalSales: ordersData.length,
            totalCustomers: numCustomers,
            bestSeller: foundBestSeller,
            recentOrders: slicedRecentOrders,
            salesData: currentMonthSales,
        });

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error fetching dashboard data',
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  if (loading) {
      return (
          <div className="flex-1 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                      <Card key={i}><CardHeader className="pb-2"><CardTitle className="h-4 bg-muted rounded-md w-3/4"></CardTitle></CardHeader><CardContent><div className="h-8 bg-muted rounded-md w-1/2"></div><div className="h-3 bg-muted rounded-md w-1/3 mt-1"></div></CardContent></Card>
                  ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="lg:col-span-4"><CardHeader><CardTitle>Sales Overview</CardTitle><CardDescription>A summary of sales over the last months.</CardDescription></CardHeader><CardContent className="pl-2"><div className="h-[300px] w-full bg-muted rounded-md"></div></CardContent></Card>
                  <Card className="lg:col-span-3"><CardHeader><CardTitle>Recent Orders</CardTitle><CardDescription>A list of the 5 most recent orders.</CardDescription></CardHeader><CardContent><div className="space-y-2">{[...Array(5)].map((_,i) => (<div key={i} className="h-10 bg-muted rounded-md"></div>))}</div></CardContent></Card>
              </div>
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Based on all orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sales
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Total sales count
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Seller
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{bestSeller?.title || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {bestSeller ? `${bestSeller.stock} units left` : ''}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              A summary of sales over the last months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickFormatter={(value) => `${currencySymbol}${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
             </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              A list of the 5 most recent orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {order.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.shippingStatus === 'Delivered' ? 'default' : 'secondary'} className="capitalize">{order.shippingStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{currencySymbol}{order.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
