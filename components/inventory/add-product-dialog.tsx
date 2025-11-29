"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, createCategory } from "@/lib/actions/inventory";
import { Plus } from "lucide-react";

type Category = { id: string; name: string };
type Lot = {
  id: string;
  costPerItem: string;
  supplier: { name: string };
  purchaseDate: Date;
};

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  lots: Lot[];
  preselectedLotId?: string; // When coming from lot detail page
}

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
  lots,
  preselectedLotId,
}: AddProductDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [lotId, setLotId] = useState<string>(preselectedLotId || "");
  const [categoryId, setCategoryId] = useState<string>("");

  // Quick add category
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");

  const selectedLot = lots.find((l) => l.id === lotId);
  const suggestedCost = selectedLot?.costPerItem || "";

  const handleQuickAddCategory = async () => {
    if (!quickCategoryName.trim()) return;

    startTransition(async () => {
      const newCategory = await createCategory({
        name: quickCategoryName,
      });
      setCategoryId(newCategory.id);
      setQuickCategoryName("");
      setShowQuickAddCategory(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      barcode: formData.get("barcode") as string || undefined,
      categoryId: categoryId || undefined, // Use state value
      lotId: lotId || undefined,
      costPrice: formData.get("costPrice") as string,
      sellingPrice: formData.get("sellingPrice") as string,
      stockQuantity: parseInt(formData.get("stockQuantity") as string) || 1,
    };

    startTransition(async () => {
      await createProduct(data);
      // Reset form state
      setLotId("");
      setCategoryId("");
      // Close dialog last
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Add a new clothing item to your inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Blue Denim Jacket"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="barcode">Barcode (Optional)</Label>
              <Input
                id="barcode"
                name="barcode"
                placeholder="Auto-generated from product ID if left empty"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate from product ID
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="categoryId">Category</Label>
              {!showQuickAddCategory ? (
                <Select
                  value={categoryId}
                  onValueChange={(value) => {
                    if (value === "__add_new__") {
                      setShowQuickAddCategory(true);
                    } else {
                      setCategoryId(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-primary">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Add new category...</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2 p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">New Category</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickAddCategory(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <Input
                    placeholder="Category name (e.g., Shirts)"
                    value={quickCategoryName}
                    onChange={(e) => setQuickCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuickAddCategory}
                    disabled={!quickCategoryName.trim() || isPending}
                    className="w-full"
                  >
                    {isPending ? "Adding..." : "Add Category"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stockQuantity">Quantity</Label>
              <Input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                defaultValue="1"
                min="0"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lotId">Lot (optional)</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id} className="tabular-nums">
                      {lot.supplier.name} - {new Date(lot.purchaseDate).toLocaleDateString()} (฿{parseFloat(lot.costPerItem).toFixed(2)}/item)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={suggestedCost}
                  key={suggestedCost} // Force re-render when lot changes
                  required
                />
                {selectedLot && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Suggested from lot: ฿{parseFloat(suggestedCost).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sellingPrice">Selling Price *</Label>
                <Input
                  id="sellingPrice"
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
