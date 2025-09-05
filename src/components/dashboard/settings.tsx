
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { saveCompanyEmailAction } from '@/app/actions';

const CURRENCIES = [
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'ZAR', label: 'R ZAR' },
];

export default function Settings() {
    const [currency, setCurrency] = React.useState('ZAR');
    const [companyEmail, setCompanyEmail] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
        setCurrency(savedCurrency);
        // We can't read the .env file from the client, 
        // so we'll leave this blank initially. The user can enter a new value.
    }, []);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        localStorage.setItem('bookstore-currency', currency);

        if (companyEmail) {
            const result = await saveCompanyEmailAction(companyEmail);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    title: 'Error Saving Company Email',
                    description: result.error,
                });
                setIsSaving(false);
                return;
            }
        }

        toast({
            title: 'Success',
            description: 'Settings saved successfully. Changes will be reflected across the app. You may need to restart the server for all changes to take effect.',
        });

        // Optionally, force a reload to ensure all components update
        // We will wait a bit for the user to read the toast
        setTimeout(() => window.location.reload(), 2000);
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
                    <CardDescription>Manage store preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 max-w-xl">
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
                        <Button onClick={handleSaveSettings} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
