'use server';
/**
 * @fileOverview A flow to check the status of the Gemini API.
 * - checkApiStatus - A function that returns true if the API is available.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const checkApiStatusFlow = ai.defineFlow(
  {
    name: 'checkApiStatusFlow',
    inputSchema: z.void(),
    outputSchema: z.boolean(),
  },
  async () => {
    try {
      const { text } = await ai.generate({
        prompt: 'test',
        model: 'googleai/gemini-2.5-flash',
        config: { temperature: 0 },
      });
      return !!text;
    } catch (e) {
      console.error('API status check failed:', e);
      return false;
    }
  }
);

export async function checkApiStatus(): Promise<boolean> {
  return checkApiStatusFlow();
}
