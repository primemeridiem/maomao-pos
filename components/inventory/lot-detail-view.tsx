"use client";

import { useState } from "react";
import { Plus, Package, DollarSign, Copy } from "lucide-react";
import { toast } from "sonner";
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
import { AddProductDialog } from "./add-product-dialog";

type Category = { id: string; name: string };

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
  notes: string | null;
  supplier: { id: string; name: string };
  products: Product[];
};

interface LotDetailViewProps {
  lot: Lot;
  categories: Category[];
}

export function LotDetailView({ lot, categories }: LotDetailViewProps) {
  const [addProductOpen, setAddProductOpen] = useState(false);

  const purchaseCost = parseFloat(lot.purchaseCost);
  const washingCost = parseFloat(lot.washingCost);
  const totalCost = parseFloat(lot.totalCost);
  const costPerItem = parseFloat(lot.costPerItem);

  const productsAdded = lot.products.length;
  const remainingItems = lot.totalItems - productsAdded;

  const copyBarcode = async (barcode: string) => {
    try {
      await navigator.clipboard.writeText(barcode);
      toast.success("Barcode copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy barcode");
    }
  };

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success("Product name copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy product name");
    }
  };

  return (
    <>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>{lot.supplier.name}</h1>
          <p className='text-muted-foreground'>
            Purchased on {new Date(lot.purchaseDate).toLocaleDateString("en-US")}
          </p>
        </div>
        <Button onClick={() => setAddProductOpen(true)} disabled={remainingItems === 0}>
          <Plus className='mr-2 h-4 w-4' />
          Add Product to Lot
        </Button>
      </div>

      {/* Cost Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Purchase Cost</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              ฿
              {purchaseCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>Paid to supplier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Washing Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              ฿
              {washingCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground'>Cleaning expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>
              ฿
              {totalCost.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className='text-xs text-muted-foreground tabular-nums'>
              ฿
              {costPerItem.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              per item
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Items</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {productsAdded} / {lot.totalItems}
            </div>
            <p className='text-xs text-muted-foreground'>{remainingItems} remaining to add</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {lot.notes && (
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>{lot.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Products in this Lot */}
      <Card>
        <CardHeader>
          <CardTitle>Products in this Lot</CardTitle>
          <CardDescription>
            {productsAdded === 0
              ? "No products added yet. Click 'Add Product to Lot' to get started."
              : `${productsAdded} item(s) cataloged from this lot`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsAdded === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Package className='h-12 w-12 mx-auto mb-4 opacity-20' />
              <p>Start adding products from this lot</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lot.products.map((product) => {
                  const cost = parseFloat(product.costPrice);
                  const price = parseFloat(product.sellingPrice);
                  const margin = ((price - cost) / price) * 100;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <span>{product.name}</span>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => copyName(product.name)}
                            title='Copy product name'
                          >
                            <Copy className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.barcode ? (
                          <div className='flex items-center gap-2'>
                            <span className='font-mono text-sm'>{product.barcode}</span>
                            <Button
                              variant='ghost'
                              size='icon-sm'
                              onClick={() => copyBarcode(product.barcode!)}
                              title='Copy barcode'
                            >
                              <Copy className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant='outline'>{product.category.name}</Badge>
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                      <TableCell className='tabular-nums'>฿{cost.toFixed(2)}</TableCell>
                      <TableCell className='font-medium tabular-nums'>
                        ฿{price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={margin > 50 ? "default" : margin > 30 ? "secondary" : "outline"}
                        >
                          {margin.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{product.stockQuantity}</TableCell>
                      <TableCell>
                        {product.isSold ? (
                          <Badge variant='secondary'>Sold</Badge>
                        ) : (
                          <Badge>Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        categories={categories}
        lots={[
          {
            id: lot.id,
            costPerItem: lot.costPerItem,
            supplier: lot.supplier,
            purchaseDate: lot.purchaseDate,
          },
        ]}
        preselectedLotId={lot.id}
      />
    </>
  );
}
