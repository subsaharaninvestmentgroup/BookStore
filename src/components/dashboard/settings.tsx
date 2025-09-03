
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const CURRENCIES = [
    { value: 'USD', label: '$ USD' },
    { value: 'EUR', label: '€ EUR' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'ZAR', label: 'R ZAR' },
];

export default function Settings() {
    const [currency, setCurrency] = React.useState('ZAR');
    const { toast } = useToast();

    React.useEffect(() => {
        const savedCurrency = localStorage.getItem('bookstore-currency') || 'ZAR';
        setCurrency(savedCurrency);
    }, []);

    const handleSaveSettings = () => {
        localStorage.setItem('bookstore-currency', currency);
        toast({
            title: 'Success',
            description: 'Settings saved successfully. Changes will be reflected across the app.',
        });
        // Optionally, force a reload to ensure all components update
        window.location.reload();
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
                        <Button onClick={handleSaveSettings}>Save Settings</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
