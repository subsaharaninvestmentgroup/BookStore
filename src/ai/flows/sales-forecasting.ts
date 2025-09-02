'use server';

/**
 * @fileOverview Forecasts future sales trends based on historical data.
 *
 * - forecastSales - A function that forecasts sales based on historical data.
 * - ForecastSalesInput - The input type for the forecastSales function.
 * - ForecastSalesOutput - The return type for the forecastSales function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastSalesInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical sales data, formatted as a string. Each line should represent a day, week, or month, and include the date and sales figures.  Example: \n2023-01-01: 120\n2023-01-08: 150\n2023-01-15: 130'
    ),
  forecastHorizon: z
    .string()
    .describe(
      'The period for which the sales should be forecasted, e.g., next month, next quarter, next year.'
    ),
});
export type ForecastSalesInput = z.infer<typeof ForecastSalesInputSchema>;

const ForecastSalesOutputSchema = z.object({
  forecast: z
    .string()
    .describe(
      'A summary of the sales forecast, including estimated sales figures and key trends.'
    ),
});
export type ForecastSalesOutput = z.infer<typeof ForecastSalesOutputSchema>;

export async function forecastSales(input: ForecastSalesInput): Promise<ForecastSalesOutput> {
  return forecastSalesFlow(input);
}

const forecastSalesPrompt = ai.definePrompt({
  name: 'forecastSalesPrompt',
  input: {schema: ForecastSalesInputSchema},
  output: {schema: ForecastSalesOutputSchema},
  prompt: `You are an expert sales forecaster. Analyze the provided historical sales data to predict future sales trends.

Historical Data:
{{historicalData}}

Forecast Horizon:
{{forecastHorizon}}

Provide a summary of your sales forecast, including estimated sales figures and key trends. Consider seasonality, growth patterns, and any other relevant factors.
`,
});

const forecastSalesFlow = ai.defineFlow(
  {
    name: 'forecastSalesFlow',
    inputSchema: ForecastSalesInputSchema,
    outputSchema: ForecastSalesOutputSchema,
  },
  async input => {
    const {output} = await forecastSalesPrompt(input);
    return output!;
  }
);
