import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LotDetailView } from "@/components/inventory/lot-detail-view";
import { getLotById, getCategories } from "@/lib/actions/inventory";
import { auth } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const [lot, categories] = await Promise.all([getLotById(id), getCategories()]);

  if (!lot) {
    notFound();
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6'>
            {/* Back Button */}
            <div>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/inventory?tab=lots'>
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Back to Lots
                </Link>
              </Button>
            </div>

            <LotDetailView lot={lot} categories={categories} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
