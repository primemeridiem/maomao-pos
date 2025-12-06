import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getProducts } from "@/lib/actions/inventory";
import { auth } from "@/lib/auth";

export default async function CheckoutPage() {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Get all available (unsold) products
  const products = await getProducts();
  const availableProducts = products.filter(p => !p.isSold && p.stockQuantity > 0);

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
        <SiteHeader title="Checkout" />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col h-full'>
            <CheckoutView products={availableProducts} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
