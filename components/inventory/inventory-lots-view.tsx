"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, DollarSign, Shirt, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddLotDialog } from "./add-lot-dialog";

type Lot = {
  id: string;
  purchaseCost: string;
  washingCost: string;
  totalCost: string;
  totalItems: number;
  costPerItem: string;
  purchaseDate: Date;
  supplier: { id: string; name: string };
  products: any[];
};

type Supplier = { id: string; name: string };

interface InventoryLotsViewProps {
  lots: Lot[];
  suppliers: Supplier[];
}

export function InventoryLotsView({ lots, suppliers }: InventoryLotsViewProps) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const totalInvestment = lots.reduce((acc, lot) => acc + parseFloat(lot.totalCost), 0);
  const totalItems = lots.reduce((acc, lot) => acc + lot.totalItems, 0);
  const totalProductsAdded = lots.reduce((acc, lot) => acc + lot.products.length, 0);
  const avgCostPerItem = totalItems > 0 ? totalInvestment / totalItems : 0;

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your clothing lots. Click on a lot to add products.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lot
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lots.length}</div>
            <p className="text-xs text-muted-foreground">Batches purchased</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">฿{totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Purchase + washing costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Item</CardTitle>
            <Shirt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">฿{avgCostPerItem.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Across all lots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Cataloged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsAdded}</div>
            <p className="text-xs text-muted-foreground">
              out of {totalItems} total items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lots</CardTitle>
          <CardDescription>
            Click on a lot to view details and add products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Purchase Cost</TableHead>
                <TableHead>Washing Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Cost/Item</TableHead>
                <TableHead>Products Added</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                    No lots found. Click "Add Lot" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => {
                  const purchaseCost = parseFloat(lot.purchaseCost);
                  const washingCost = parseFloat(lot.washingCost);
                  const totalCost = parseFloat(lot.totalCost);
                  const progress = lot.products.length;
                  const total = lot.totalItems;
                  const isComplete = progress >= total;

                  return (
                    <TableRow
                      key={lot.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/inventory/lots/${lot.id}`)}
                    >
                      <TableCell className="font-medium">
                        {lot.supplier.name}
                      </TableCell>
                      <TableCell>
                        {new Date(lot.purchaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="tabular-nums">฿{purchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="tabular-nums">฿{washingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="font-medium tabular-nums">
                        ฿{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="tabular-nums">{total.toLocaleString('en-US')}</TableCell>
                      <TableCell className="font-medium tabular-nums">
                        ฿{parseFloat(lot.costPerItem).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isComplete ? "default" : "secondary"}>
                          {progress} / {total}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddLotDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        suppliers={suppliers}
      />
    </>
  );
}
