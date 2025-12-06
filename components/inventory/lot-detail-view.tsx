"use client";

import { useState, useTransition } from "react";
import { Plus, Package, DollarSign, Copy, Edit2, Check, X, Pencil } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryDataTable, DataTableColumnHeader } from "@/components/ui/inventory-data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddProductDialog } from "./add-product-dialog";
import { updateProductPrice, updateProductName } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [isPending, startTransition] = useTransition();

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

  const startEditingPrice = (product: Product) => {
    setEditingProductId(product.id);
    setEditPrice(product.sellingPrice);
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditPrice("");
  };

  const savePrice = async (productId: string) => {
    if (!editPrice || parseFloat(editPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsSaving(true);
    try {
      await updateProductPrice(productId, editPrice);
      toast.success("Price updated successfully");
      setEditingProductId(null);
      setEditPrice("");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update price");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditNameDialog = (product: Product) => {
    setEditingProduct(product);
    setNewProductName(product.name);
    setShowEditNameDialog(true);
  };

  const handleUpdateName = () => {
    if (!editingProduct || !newProductName.trim()) return;

    startTransition(async () => {
      try {
        await updateProductName(editingProduct.id, newProductName.trim());
        toast.success("Product name updated successfully");
        router.refresh();
        setShowEditNameDialog(false);
        setEditingProduct(null);
        setNewProductName("");
      } catch (error) {
        console.error("Failed to update product name:", error);
        toast.error("Failed to update product name");
      }
    });
  };

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
              openEditNameDialog(row.original);
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
      accessorKey: "costPrice",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
      cell: ({ row }) => {
        const cost = parseFloat(row.original.costPrice);
        return <div className="tabular-nums">฿{cost.toFixed(2)}</div>;
      },
    },
    {
      accessorKey: "sellingPrice",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const product = row.original;
        const price = parseFloat(product.sellingPrice);

        if (editingProductId === product.id) {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-24 h-8 text-sm"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    savePrice(product.id);
                  } else if (e.key === "Escape") {
                    e.stopPropagation();
                    cancelEditing();
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  savePrice(product.id);
                }}
                disabled={isSaving}
                title="Save price"
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
                disabled={isSaving}
                title="Cancel editing"
              >
                <X className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2 font-medium tabular-nums">
            <span>฿{price.toFixed(2)}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                startEditingPrice(product);
              }}
              title="Edit price"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
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
            <InventoryDataTable
              columns={columns}
              data={lot.products}
              searchKey="name"
              searchPlaceholder="Search products by name..."
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Product Name Dialog */}
      <Dialog open={showEditNameDialog} onOpenChange={setShowEditNameDialog}>
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
                setShowEditNameDialog(false);
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
