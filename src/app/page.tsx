
'use client';

import * as React from 'react';
import {
  Book,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  GalleryHorizontal,
  Home,
  PanelLeft,
  Search,
  ShoppingCart,
  Users,
  CheckCircle2,
  AlertTriangle,
  Store,
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import Overview from '@/components/dashboard/overview';
import Books from '@/components/dashboard/books';
import Orders from '@/components/dashboard/orders';
import Customers from '@/components/dashboard/customers';
import Banners from '@/components/dashboard/banners';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { BookForm } from '@/components/dashboard/book-form';
import { BannerForm } from '@/components/dashboard/banner-form';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { checkApiStatusAction } from './actions';

type View = 'overview' | 'orders' | 'books' | 'customers' | 'book-form' | 'banners' | 'banner-form';

export default function DashboardPage() {
  const [activeView, setActiveView] = React.useState<View>('overview');
  const [editingBookId, setEditingBookId] = React.useState<string | undefined>(undefined);
  const [editingBannerId, setEditingBannerId] = React.useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const [isApiAvailable, setIsApiAvailable] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    checkApiStatusAction().then(setIsApiAvailable);
  }, []);

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
      const customerRef = doc(db, 'customers', user.uid);
      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists() || !customerSnap.data()?.isAdmin) {
        await signOut(auth);
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to access the dashboard.',
        });
        router.push('/login');
      }
    };

    checkAdmin();
  }, [user, loading, router, toast]);
  
  React.useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  const handleLogout = () => {
    signOut(auth);
    router.push('/store');
  };

  const handleShowBookForm = (bookId?: string) => {
    setEditingBookId(bookId);
    setActiveView('book-form');
  };

  const handleBackToBooks = () => {
    setActiveView('books');
    setEditingBookId(undefined);
  };
  
  const handleShowBannerForm = (bannerId?: string) => {
    setEditingBannerId(bannerId);
    setActiveView('banner-form');
  };

  const handleBackToBanners = () => {
    setActiveView('banners');
    setEditingBannerId(undefined);
  };

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <Overview />;
      case 'orders':
        return <Orders />;
      case 'books':
        return <Books onAddBook={() => handleShowBookForm()} onEditBook={handleShowBookForm} />;
      case 'customers':
        return <Customers />;
      case 'book-form':
        return <BookForm bookId={editingBookId} onSaveSuccess={handleBackToBooks} onCancel={handleBackToBooks} />;
      case 'banners':
        return <Banners onAddBanner={() => handleShowBannerForm()} onEditBanner={handleShowBannerForm} />;
      case 'banner-form':
        return <BannerForm bannerId={editingBannerId} onSaveSuccess={handleBackToBanners} onCancel={handleBackToBanners} />;
      default:
        return <Overview />;
    }
  };

  const navItems = [
    { name: 'overview', label: 'Dashboard', icon: Home },
    { name: 'orders', label: 'Orders', icon: ShoppingCart },
    { name: 'books', label: 'Books', icon: Book },
    { name: 'customers', label: 'Customers', icon: Users },
    { name: 'banners', label: 'Banners', icon: GalleryHorizontal },
  ];

  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background transition-all duration-300 sm:flex',
          isCollapsed ? 'w-14' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="#" onClick={() => setActiveView('overview')} className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" />
            <span className={cn(isCollapsed && 'hidden')}>Bookstore</span>
          </Link>
          {!isMobile && (
            <Button
              variant="outline"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
        </div>
        <nav className="flex flex-col items-start gap-2 px-2 py-4 sm:py-5">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) =>
              isCollapsed ? (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setActiveView(item.name as View); }}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 w-full ${
                        activeView === item.name
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActiveView(item.name as View); }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full',
                    activeView === item.name && 'bg-accent text-accent-foreground hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </a>
              )
            )}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
         <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/store" className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8">
                  <Store className="h-5 w-5" />
                  <span className="sr-only">Storefront</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? 'right' : 'top'}>Storefront</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <CircleUser />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </aside>
      <div
        className={cn(
          'flex flex-col sm:gap-4 sm:py-4 transition-all duration-300',
          isCollapsed ? 'sm:pl-14' : 'sm:pl-64'
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActiveView('overview'); }}
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Logo className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Bookstore</span>
                </a>
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView(item.name as View);
                    }}
                    className={`flex items-center gap-4 px-2.5 ${
                      activeView === item.name
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    {isApiAvailable === true && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {isApiAvailable === false && <AlertTriangle className="h-5 w-5 text-destructive" />}
                </TooltipTrigger>
                <TooltipContent>
                    {isApiAvailable === true && <p>Gemini API is available.</p>}
                    {isApiAvailable === false && <p>Gemini API is not available. Check your API key.</p>}
                    {isApiAvailable === null && <p>Checking API status...</p>}
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <CircleUser />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
