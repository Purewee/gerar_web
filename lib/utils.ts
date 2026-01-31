import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize image URLs - replace localhost with network IP for Next.js image optimization
 * This ensures images can be loaded when Next.js runs on network IP (e.g. 192.168.1.3, 192.168.1.4)
 * @param url - Image URL to normalize
 * @returns Normalized URL
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return url || null;
  }

  // Get API base URL from environment
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiBaseUrl.replace(/\/api$/, '');

  // If API URL uses network IP and image URL uses localhost, replace it
  if (baseUrl.includes('192.168.') || baseUrl.includes('10.') || baseUrl.includes('172.')) {
    if (url.includes('localhost:3000') || url.includes('127.0.0.1:3000')) {
      return url.replace(/http:\/\/(localhost|127\.0\.0\.1):3000/g, baseUrl);
    }
  }

  return url;
}

