'use server';

import { z } from 'zod';
import { forecastSales } from '@/ai/flows/sales-forecasting';

const salesForecastSchema = z.object({
  historicalData: z.string().min(1, { message: 'Historical data is required.' }),
  forecastHorizon: z.string().min(1, { message: 'Forecast horizon is required.' }),
});

export async function getSalesForecast(prevState: any, formData: FormData) {
  const validatedFields = salesForecastSchema.safeParse({
    historicalData: formData.get('historicalData'),
    forecastHorizon: formData.get('forecastHorizon'),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors,
      forecast: null,
    };
  }

  try {
    const result = await forecastSales(validatedFields.data);
    return {
      message: null,
      forecast: result.forecast,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred while generating the forecast.',
      forecast: null,
    };
  }
}
