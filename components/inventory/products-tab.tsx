"use client";

import { useState } from "react";
import { Search, Tag, Package, Copy } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = {
  id: string;
  name: string;
  barcode: string | null;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  isSold: boolean;
  category: { id: string; name: string } | null;
  lot: { id: string; lotNumber: string; supplier: { name: string } } | null;
};

interface ProductsTabProps {
  products: Product[];
}

export function ProductsTab({ products }: ProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const availableProducts = products.filter((p) => !p.isSold);
  const totalValue = availableProducts.reduce(
    (acc, p) => acc + parseFloat(p.sellingPrice) * p.stockQuantity,
    0
  );
  const totalCost = availableProducts.reduce(
    (acc, p) => acc + parseFloat(p.costPrice) * p.stockQuantity,
    0
  );
  const margin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;

  return (
    <>
      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{availableProducts.length}</div>
            <p className='text-xs text-muted-foreground'>Available in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Inventory Value</CardTitle>
            <Tag className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold tabular-nums'>฿{totalValue.toFixed(2)}</div>
            <p className='text-xs text-muted-foreground'>At selling price</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg. Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{margin.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground'>Potential profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search products...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            All items across all lots. Add products by clicking on a lot in the Lots tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='text-center text-muted-foreground py-12'>
                    {products.length === 0
                      ? "No products yet. Go to the Lots tab, add a lot, then click on it to add products."
                      : "No products match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
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
                      <TableCell className='font-mono text-sm text-muted-foreground'>
                        {product.lot?.lotNumber || "-"}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        ฿
                        {cost.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className='font-medium tabular-nums'>
                        ฿
                        {price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
