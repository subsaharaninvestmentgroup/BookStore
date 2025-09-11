
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { saveCompanyEmailAction, saveAdminCodeAction, saveCurrencyAction } from '@/app/actions';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { clearCache } from '@/lib/utils';

const CURRENCIES = [
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'ZAR', label: 'R ZAR' },
];

export default function Settings() {
    const [currency, setCurrency] = React.useState('ZAR');
    const [companyEmail, setCompanyEmail] = React.useState('');
    const [adminCode, setAdminCode] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const settingsRef = doc(db, 'storeSettings', 'main');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) {
                    const settingsData = settingsSnap.data();
                    if (settingsData.companyEmail) {
                        setCompanyEmail(settingsData.companyEmail);
                    }
                    if (settingsData.adminCode) {
                        setAdminCode(settingsData.adminCode);
                    }
                    if (settingsData.currency) {
                        setCurrency(settingsData.currency);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not load store settings.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    const handleGenerateCode = () => {
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        setAdminCode(newCode);
    }

    const handleSaveSettings = async () => {
        setIsSaving(true);
        
        const emailPromise = saveCompanyEmailAction(companyEmail);
        const adminCodePromise = saveAdminCodeAction(adminCode);
        const currencyPromise = saveCurrencyAction(currency);

        const [emailResult, adminCodeResult, currencyResult] = await Promise.all([emailPromise, adminCodePromise, currencyPromise]);

        if (!emailResult.success || !adminCodeResult.success || !currencyResult.success) {
            toast({
                variant: 'destructive',
                title: 'Error Saving Settings',
                description: emailResult.error || adminCodeResult.error || currencyResult.error || "An unknown error occurred.",
            });
        } else {
            toast({
                title: 'Success',
                description: 'Settings saved successfully. Changes will be reflected across the app.',
            });
            clearCache('storeCurrency');
        }

        setIsSaving(false);

        // Optionally, force a reload to ensure all components update
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your application settings.</CardDescription>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Manage store preferences and security.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-8 max-w-xl">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-[180px]" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                             <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-10 w-28" />
                         </div>
                    ) : (
                        <div className="space-y-8 max-w-xl">
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Choose the currency for your store.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyEmail">Company Email</Label>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    placeholder="notifications@example.com"
                                    value={companyEmail}
                                    onChange={(e) => setCompanyEmail(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    The email address to receive order confirmations.
                                </p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="adminCode">Admin Registration Code</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="adminCode"
                                        type="text"
                                        placeholder="Enter a secret code for admin signup"
                                        value={adminCode}
                                        onChange={(e) => setAdminCode(e.target.value)}
                                        className="flex-grow"
                                    />
                                     <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleGenerateCode}
                                        aria-label="Generate new code"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Users who sign up with this code will be granted admin privileges.
                                </p>
                            </div>
                            <Button onClick={handleSaveSettings} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
