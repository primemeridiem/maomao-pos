"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Barcode, Plus, Package, Minus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { addProductStock } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ScannedItem {
  product: any;
  quantityToAdd: number;
}

interface AddStockViewProps {
  products: any[];
}

export function AddStockView({ products }: AddStockViewProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ type: "success", title: "", message: "" });
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleClick = () => {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 10);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      if (tagName !== "input" && tagName !== "textarea" && tagName !== "select") {
        barcodeInputRef.current?.focus();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  // Handle barcode scan
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // Find product by barcode from loaded products
    const foundProduct = products.find((p) => p.barcode === barcodeInput.trim());

    if (foundProduct) {
      // Add to scanned items or increment quantity
      setScannedItems((prev) => {
        const existingItem = prev.find((item) => item.product.id === foundProduct.id);

        if (existingItem) {
          // Increment quantity
          return prev.map((item) =>
            item.product.id === foundProduct.id
              ? { ...item, quantityToAdd: item.quantityToAdd + 1 }
              : item
          );
        } else {
          // Add new item
          return [...prev, { product: foundProduct, quantityToAdd: 1 }];
        }
      });
    } else {
      setDialogMessage({
        type: "error",
        title: "Product Not Found",
        message: "This barcode is not in inventory. Please add the product first.",
      });
      setShowDialog(true);
    }

    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  };

  // Remove item from scanned list
  const handleRemoveItem = (productId: string) => {
    setScannedItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Update quantity for specific item
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setScannedItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantityToAdd: newQuantity } : item
      )
    );
  };

  // Complete bulk stock update
  const handleCompleteStockUpdate = () => {
    if (scannedItems.length === 0) {
      setDialogMessage({
        type: "error",
        title: "No Items Scanned",
        message: "Please scan at least one item before completing the stock update.",
      });
      setShowDialog(true);
      return;
    }

    startTransition(async () => {
      try {
        // Update all products
        for (const item of scannedItems) {
          await addProductStock(item.product.id, item.quantityToAdd);
        }

        // Calculate total items added
        const totalAdded = scannedItems.reduce((sum, item) => sum + item.quantityToAdd, 0);
        const productsCount = scannedItems.length;

        // Clear scanned items
        setScannedItems([]);

        // Refresh data
        router.refresh();

        // Refocus barcode input
        barcodeInputRef.current?.focus();

        // Show success dialog
        setDialogMessage({
          type: "success",
          title: "Stock Updated Successfully",
          message: `Added stock to ${productsCount} products (${totalAdded} total units).`,
        });
        setShowDialog(true);
      } catch (error) {
        console.error("Failed to update stock:", error);
        setDialogMessage({
          type: "error",
          title: "Update Failed",
          message: "Failed to update stock. Please try again.",
        });
        setShowDialog(true);
      }
    });
  };

  // Calculate totals
  const totalItems = scannedItems.reduce((sum, item) => sum + item.quantityToAdd, 0);

  return (
    <div className='space-y-6'>
      {/* Barcode Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Barcode className='h-5 w-5' />
            Scan Barcode to Add Stock
          </CardTitle>
          <CardDescription>
            Each scan adds 1 unit. Scan multiple times to increase quantity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeSubmit} className='flex gap-2'>
            <Input
              ref={barcodeInputRef}
              type='text'
              placeholder='Scan or enter barcode...'
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className='font-mono text-lg'
            />
            <Button type='submit'>Scan</Button>
          </form>
        </CardContent>
      </Card>

      {/* Scanned Items List */}
      {scannedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-5 w-5' />
              Scanned Items ({scannedItems.length}) - Total: {totalItems} units
            </CardTitle>
            <CardDescription>Review and adjust quantities before completing</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Items List */}
            <div className='space-y-2'>
              {scannedItems.map((item) => (
                <div key={item.product.id} className='flex items-center gap-3 p-3 rounded-lg border'>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium'>{item.product.name}</p>
                    <div className='flex items-center gap-2 mt-1'>
                      {item.product.category && (
                        <Badge variant='secondary' className='text-xs'>
                          {item.product.category.name}
                        </Badge>
                      )}
                      <span className='text-xs text-muted-foreground'>
                        Current: {item.product.stockQuantity}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantityToAdd - 1)}
                    >
                      <Minus className='h-4 w-4' />
                    </Button>
                    <Input
                      type='number'
                      min='1'
                      value={item.quantityToAdd}
                      onChange={(e) =>
                        handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)
                      }
                      className='w-16 text-center'
                    />
                    <Button
                      variant='outline'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => handleUpdateQuantity(item.product.id, item.quantityToAdd + 1)}
                    >
                      <Plus className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive'
                      onClick={() => handleRemoveItem(item.product.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-muted-foreground'>New Total</p>
                    <p className='font-bold text-lg'>
                      {item.product.stockQuantity + item.quantityToAdd}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Summary */}
            <div className='p-4 bg-primary/10 rounded-lg'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Total Units to Add</span>
                <span className='text-2xl font-bold'>{totalItems}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <Button
                className='flex-1'
                size='lg'
                onClick={handleCompleteStockUpdate}
                disabled={isPending}
              >
                <Package className='h-4 w-4 mr-2' />
                {isPending ? "Processing..." : "Complete Stock Update"}
              </Button>
              <Button
                variant='outline'
                onClick={() => setScannedItems([])}
                disabled={isPending}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog for messages */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              {dialogMessage.type === "success" ? (
                <CheckCircle2 className='h-5 w-5 text-green-600' />
              ) : (
                <AlertCircle className='h-5 w-5 text-red-600' />
              )}
              {dialogMessage.title}
            </DialogTitle>
            <DialogDescription>{dialogMessage.message}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
