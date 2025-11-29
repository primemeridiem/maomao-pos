"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, DollarSign, Shirt, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  lotNumber: string;
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

interface LotsTabProps {
  lots: Lot[];
  suppliers: Supplier[];
}

export function LotsTab({ lots, suppliers }: LotsTabProps) {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const totalInvestment = lots.reduce((acc, lot) => acc + parseFloat(lot.totalCost), 0);
  const totalItems = lots.reduce((acc, lot) => acc + lot.totalItems, 0);
  const avgCostPerItem = totalItems > 0 ? totalInvestment / totalItems : 0;

  return (
    <>
      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
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
            <div className='text-2xl font-bold'>${totalInvestment.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Purchase + washing costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Cost/Item</CardTitle>
            <Shirt className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${avgCostPerItem.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>Across all lots</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Purchase Lots</h3>
          <p className='text-sm text-muted-foreground'>Track batches of clothing from suppliers</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Lot
        </Button>
      </div>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lots</CardTitle>
          <CardDescription>All purchased batches of clothing</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot Number</TableHead>
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
                  <TableCell colSpan={10} className='text-center text-muted-foreground'>
                    No lots found. Add your first lot to get started.
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => {
                  const purchaseCost = parseFloat(lot.purchaseCost);
                  const washingCost = parseFloat(lot.washingCost);
                  const totalCost = parseFloat(lot.totalCost);

                  return (
                    <TableRow
                      key={lot.id}
                      className='cursor-pointer hover:bg-muted/50'
                      onClick={() => router.push(`/inventory/lots/${lot.id}`)}
                    >
                      <TableCell className='font-medium font-mono'>{lot.lotNumber}</TableCell>
                      <TableCell>{lot.supplier.name}</TableCell>
                      <TableCell>{new Date(lot.purchaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>${purchaseCost.toFixed(2)}</TableCell>
                      <TableCell>${washingCost.toFixed(2)}</TableCell>
                      <TableCell className='font-medium'>${totalCost.toFixed(2)}</TableCell>
                      <TableCell>{lot.totalItems}</TableCell>
                      <TableCell className='font-medium'>
                        ${parseFloat(lot.costPerItem).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>
                          {lot.products.length} / {lot.totalItems}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddLotDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} suppliers={suppliers} />
    </>
  );
}
