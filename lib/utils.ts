import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for the application
 * Works on both server and client side
 * Server: Uses VERCEL_URL (automatically set by Vercel)
 * Client: Uses NEXT_PUBLIC_VERCEL_URL (automatically set by Vercel)
 * Reference: https://vercel.com/docs/environment-variables/framework-environment-variables#NEXT_PUBLIC_VERCEL_URL
 */
export const getBaseUrl = () => {
  // In production
  if (process.env.NODE_ENV === "production") {
    // First try VERCEL_URL (server-side, doesn't include protocol)
    if (typeof process.env.PRODUCTION_URL !== "undefined" && process.env.PRODUCTION_URL) {
      return `https://${process.env.PRODUCTION_URL}`;
    }
    // Fallback to NEXT_PUBLIC_VERCEL_URL (client-side, includes protocol)
    if (
      typeof process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL !== "undefined" &&
      process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    // Final fallback to NEXT_PUBLIC_APP_URL
    if (typeof process.env.NEXT_PUBLIC_APP_URL !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
  }
  // In development, return localhost
  return "http://localhost:3000";
};
