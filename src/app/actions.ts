'use server';

import { generateBanner } from "@/ai/flows/generate-banner-flow";
import type { Book } from "@/lib/types";

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
