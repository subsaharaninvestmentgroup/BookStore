
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency: string): string {
    switch (currency) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'ZAR': return 'R';
        default: return '$';
    }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const setCachedData = (key: string, data: any) => {
  try {
    const item = {
      data: data,
      timestamp: new Date().getTime(),
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error setting cache for key: ${key}`, error);
  }
};

export const getCachedData = (key: string) => {
  try {
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    if (now - item.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch (error) {
    console.error(`Error getting cache for key: ${key}`, error);
    return null;
  }
};

export const clearCache = (key: string) => {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
        console.error(`Error clearing cache for key: ${key}`, error);
    }
}

