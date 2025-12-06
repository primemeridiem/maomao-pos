"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, DollarSign, Shirt, ChevronRight } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryDataTable, DataTableColumnHeader } from "@/components/ui/inventory-data-table";
import { AddLotDialog } from "./add-lot-dialog";

type Product = {
  id: string;
  name: string;
  barcode: string | null;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  isSold: boolean;
  category: { id: string; name: string } | null;
};

type Lot = {
  id: string;
  purchaseCost: string;
  washingCost: string;
  totalCost: string;
  totalItems: number;
  costPerItem: string;
  purchaseDate: Date;
  supplier: { id: string; name: string };
  products: Product[];
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

  const columns: ColumnDef<Lot>[] = [
    {
      accessorKey: "supplier.name",
      id: "supplier",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Supplier" />,
      cell: ({ row }) => <div className="font-medium">{row.original.supplier.name}</div>,
    },
    {
      accessorKey: "purchaseDate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase Date" />,
      cell: ({ row }) => (
        <div>
          {new Date(row.original.purchaseDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
      ),
    },
    {
      accessorKey: "purchaseCost",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Purchase Cost" />,
      cell: ({ row }) => {
        const purchaseCost = parseFloat(row.original.purchaseCost);
        return (
          <div className="tabular-nums">
            ฿
            {purchaseCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "washingCost",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Washing Cost" />,
      cell: ({ row }) => {
        const washingCost = parseFloat(row.original.washingCost);
        return (
          <div className="tabular-nums">
            ฿
            {washingCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "totalCost",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Cost" />,
      cell: ({ row }) => {
        const totalCost = parseFloat(row.original.totalCost);
        return (
          <div className="font-medium tabular-nums">
            ฿
            {totalCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "totalItems",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
      cell: ({ row }) => (
        <div className="tabular-nums">{row.original.totalItems.toLocaleString("en-US")}</div>
      ),
    },
    {
      accessorKey: "costPerItem",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost/Item" />,
      cell: ({ row }) => {
        const costPerItem = parseFloat(row.original.costPerItem);
        return (
          <div className="font-medium tabular-nums">
            ฿
            {costPerItem.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      id: "productsAdded",
      header: "Products Added",
      cell: ({ row }) => {
        const progress = row.original.products.length;
        const total = row.original.totalItems;
        const isComplete = progress >= total;
        return (
          <Badge variant={isComplete ? "default" : "secondary"}>
            {progress} / {total}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Inventory</h1>
          <p className='text-muted-foreground'>
            Manage your clothing lots. Click on a lot to add products.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Lot
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Lots</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{lots.length}</div>
            <p className='text-xs text-muted-foreground'>Batches purchased</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Investment</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              ฿
              {totalInvestment.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>Purchase + washing costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Cost/Item</CardTitle>
            <Shirt className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              ฿
              {avgCostPerItem.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>Across all lots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Products Cataloged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalProductsAdded}</div>
            <p className='text-xs text-muted-foreground'>out of {totalItems} total items</p>
          </CardContent>
        </Card>
      </div>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lots</CardTitle>
          <CardDescription>Click on a lot to view details and add products</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDataTable
            columns={columns}
            data={lots}
            searchKey="supplier"
            searchPlaceholder="Search by supplier..."
            onRowClick={(lot) => router.push(`/inventory/lots/${lot.id}`)}
          />
        </CardContent>
      </Card>

      <AddLotDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} suppliers={suppliers} />
    </>
  );
}
