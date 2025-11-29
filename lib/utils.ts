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
  //if prd reutn vercel url
  //if dev return localhost
  if (process.env.NODE_ENV === "production") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};
