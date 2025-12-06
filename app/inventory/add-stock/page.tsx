import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AddStockView } from "@/components/inventory/add-stock-view";
import { getProducts } from "@/lib/actions/inventory";
import { auth } from "@/lib/auth";

export default async function AddStockPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Load all products
  const products = await getProducts();

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
        <SiteHeader title="Add Stock" />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col p-4 md:p-6'>
            <AddStockView products={products} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
