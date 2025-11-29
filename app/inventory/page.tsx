import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { InventoryLotsView } from "@/components/inventory/inventory-lots-view";
import { getLots, getSuppliers } from "@/lib/actions/inventory";
import { auth } from "@/lib/auth";

export default async function InventoryPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  const [lots, suppliers] = await Promise.all([getLots(), getSuppliers()]);

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
            <InventoryLotsView lots={lots} suppliers={suppliers} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
