import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the base URL for the application
 * Works on both server and client side
 */
export const getBaseUrl = () => {
  // In production, use Vercel URL (server-side only)
  if (process.env.NODE_ENV === "production") {
    // VERCEL_URL is automatically set by Vercel (e.g., "your-app.vercel.app")
    // It doesn't include the protocol, so we add https://
    // Note: VERCEL_URL is only available on the server
    if (typeof process.env.VERCEL_URL !== "undefined" && process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback to NEXT_PUBLIC_APP_URL (works on both client and server)
    if (typeof process.env.NEXT_PUBLIC_APP_URL !== "undefined" && process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
  }
  // In development, return localhost
  return "http://localhost:3000";
};
