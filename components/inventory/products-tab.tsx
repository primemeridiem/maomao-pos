"use client";

import { useState, useTransition } from "react";
import { Tag, Package, Copy, Pencil } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryDataTable, DataTableColumnHeader } from "@/components/ui/inventory-data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProductName } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setShowEditDialog(true);
  };

  const handleUpdateName = () => {
    if (!editingProduct || !newProductName.trim()) return;

    startTransition(async () => {
      try {
        await updateProductName(editingProduct.id, newProductName.trim());
        toast.success("Product name updated successfully");
        router.refresh();
        setShowEditDialog(false);
        setEditingProduct(null);
        setNewProductName("");
      } catch (error) {
        console.error("Failed to update product name:", error);
        toast.error("Failed to update product name");
      }
    });
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

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-medium">
          <span>{row.original.name}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(row.original);
            }}
            title="Edit product name"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              copyName(row.original.name);
            }}
            title="Copy product name"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "barcode",
      header: "Barcode",
      cell: ({ row }) => {
        if (!row.original.barcode) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{row.original.barcode}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                copyBarcode(row.original.barcode!);
              }}
              title="Copy barcode"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "category.name",
      id: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => {
        if (!row.original.category) {
          return <span className="text-muted-foreground">-</span>;
        }
        return <Badge variant="outline">{row.original.category.name}</Badge>;
      },
    },
    {
      accessorKey: "lot.lotNumber",
      id: "lot",
      header: "Lot",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.lot?.lotNumber || "-"}
        </span>
      ),
    },
    {
      accessorKey: "costPrice",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
      cell: ({ row }) => {
        const cost = parseFloat(row.original.costPrice);
        return (
          <div className="tabular-nums">
            ฿
            {cost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "sellingPrice",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const price = parseFloat(row.original.sellingPrice);
        return (
          <div className="font-medium tabular-nums">
            ฿
            {price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      },
    },
    {
      id: "margin",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Margin" />,
      cell: ({ row }) => {
        const cost = parseFloat(row.original.costPrice);
        const price = parseFloat(row.original.sellingPrice);
        const margin = ((price - cost) / price) * 100;
        return (
          <Badge variant={margin > 50 ? "default" : margin > 30 ? "secondary" : "outline"}>
            {margin.toFixed(0)}%
          </Badge>
        );
      },
    },
    {
      accessorKey: "stockQuantity",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
      cell: ({ row }) => <div>{row.original.stockQuantity}</div>,
    },
    {
      accessorKey: "isSold",
      header: "Status",
      cell: ({ row }) => {
        return row.original.isSold ? (
          <Badge variant="secondary">Sold</Badge>
        ) : (
          <Badge>Available</Badge>
        );
      },
    },
  ];

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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            All items across all lots. Add products by clicking on a lot in the Lots tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryDataTable
            columns={columns}
            data={products}
            searchKey="name"
            searchPlaceholder="Search products..."
          />
        </CardContent>
      </Card>

      {/* Edit Product Name Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Name</DialogTitle>
            <DialogDescription>Update the name for this product.</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='productName'>Product Name</Label>
              <Input
                id='productName'
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder='Enter product name'
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpdateName();
                  }
                }}
              />
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              className='flex-1'
              onClick={handleUpdateName}
              disabled={isPending || !newProductName.trim()}
            >
              {isPending ? "Updating..." : "Update Name"}
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                setShowEditDialog(false);
                setEditingProduct(null);
                setNewProductName("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
