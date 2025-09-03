
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
    const [apiKey, setApiKey] = React.useState('');
    const { toast } = useToast();

    // In a real app, you would fetch and save the API key to a secure backend or environment variables.
    // For this example, we'll just simulate the behavior.

    const handleSaveApiKey = () => {
        // Here you would typically call a server action to save the key
        console.log('Saving API Key:', apiKey);
        toast({
            title: 'Success',
            description: 'API Key saved successfully. Please restart the server for changes to take effect.',
        });
    };
    
    // In a real app, you might fetch the key from the server
    React.useEffect(() => {
        // e.g. fetch('/api/settings/gemini-key').then(res => res.json()).then(data => setApiKey(data.apiKey));
        // For now, we'll leave it blank or load from a local (and insecure) place
    }, []);

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
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Manage API keys for integrated services.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-w-xl">
                        <div className="space-y-2">
                            <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                            <Input 
                                id="gemini-api-key" 
                                type="password" 
                                placeholder="Enter your Gemini API Key" 
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)} 
                            />
                            <p className="text-sm text-muted-foreground">
                                Your Gemini API key is used for all AI-powered features.
                            </p>
                        </div>
                        <Button onClick={handleSaveApiKey}>Save API Key</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
