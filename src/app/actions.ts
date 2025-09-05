
'use server';

import { generateBanner } from "@/ai/flows/generate-banner-flow";
import { checkApiStatus } from "@/ai/flows/check-api-status-flow";
import type { Book } from "@/lib/types";
import { sendShippingConfirmationEmail } from "@/lib/email";
import * as fs from 'fs/promises';
import * as path from 'path';

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

async function updateEnvFile(key: string, value: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    try {
        let envFileContent = await fs.readFile(envPath, 'utf8');
        const keyRegex = new RegExp(`^${key}=.*$`, 'm');

        if (keyRegex.test(envFileContent)) {
            envFileContent = envFileContent.replace(keyRegex, `${key}=${value}`);
        } else {
            envFileContent += `\n${key}=${value}`;
        }

        await fs.writeFile(envPath, envFileContent);
        return { success: true };
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // .env file doesn't exist, create it
            await fs.writeFile(envPath, `${key}=${value}`);
            return { success: true };
        }
        console.error('Failed to update .env file:', error);
        return { success: false, error: error.message };
    }
}


export async function saveCompanyEmailAction(email: string): Promise<{ success: boolean, error?: string }> {
    return updateEnvFile('COMPANY_EMAIL', email);
}
