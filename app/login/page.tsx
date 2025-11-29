"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/inventory");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-sm'>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If already logged in, redirect happens in useEffect
  // If not logged in, show login form
  if (!session) {
    return (
      <div className='flex min-h-svh w-full items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-sm'>
          <LoginForm />
        </div>
      </div>
    );
  }

  // This should not render as we redirect, but just in case
  return null;
}
