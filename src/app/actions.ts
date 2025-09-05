
'use server';

import { generateBanner } from "@/ai/flows/generate-banner-flow";
import { checkApiStatus } from "@/ai/flows/check-api-status-flow";
import type { Book } from "@/lib/types";
import { sendShippingConfirmationEmail } from "@/lib/email";

export async function generateBannerAction(book: Book): Promise<{ title: string, description: string } | null> {
    try {
        const result = await generateBanner({
            bookTitle: book.title,
            bookAuthor: book.author,
            bookDescription: book.description,
        });
        return result;
    } catch(e) {
        console.error(e);
        return null;
    }
}

export async function checkApiStatusAction(): Promise<boolean> {
    return checkApiStatus();
}

export async function sendShippingEmailAction(params: { to: string; orderReference: string; trackingUrl: string; }): Promise<{ success: boolean; error?: string }> {
    try {
        await sendShippingConfirmationEmail(params);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send shipping email:', error);
        return { success: false, error: error.message };
    }
}
