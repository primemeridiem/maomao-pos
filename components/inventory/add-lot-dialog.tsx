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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLot, createSupplier } from "@/lib/actions/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

type Supplier = { id: string; name: string };

interface AddLotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
}

export function AddLotDialog({
  open,
  onOpenChange,
  suppliers,
}: AddLotDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [purchaseCost, setPurchaseCost] = useState("");
  const [washingCost, setWashingCost] = useState("0");
  const [totalItems, setTotalItems] = useState("");
  const [supplierId, setSupplierId] = useState("");

  // Quick add supplier
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickSupplierName, setQuickSupplierName] = useState("");
  const [quickSupplierPhone, setQuickSupplierPhone] = useState("");

  const purchase = parseFloat(purchaseCost) || 0;
  const washing = parseFloat(washingCost) || 0;
  const total = purchase + washing;
  const items = parseInt(totalItems) || 0;
  const costPerItem = items > 0 ? total / items : 0;

  const handleQuickAddSupplier = async () => {
    if (!quickSupplierName.trim()) return;

    startTransition(async () => {
      const newSupplier = await createSupplier({
        name: quickSupplierName,
        phone: quickSupplierPhone || undefined,
      });
      setSupplierId(newSupplier.id);
      setQuickSupplierName("");
      setQuickSupplierPhone("");
      setShowQuickAdd(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      supplierId: supplierId, // Use state value instead of formData
      purchaseCost: formData.get("purchaseCost") as string,
      washingCost: formData.get("washingCost") as string,
      totalItems: parseInt(formData.get("totalItems") as string),
      notes: formData.get("notes") as string || undefined,
    };

    startTransition(async () => {
      await createLot(data);
      // Reset form state
      setPurchaseCost("");
      setWashingCost("0");
      setTotalItems("");
      setSupplierId("");
      // Close dialog last
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Lot</DialogTitle>
          <DialogDescription>
            Record a new batch of clothing from a supplier
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              {!showQuickAdd ? (
                <Select
                  name="supplierId"
                  value={supplierId}
                  onValueChange={(value) => {
                    if (value === "__add_new__") {
                      setShowQuickAdd(true);
                    } else {
                      setSupplierId(value);
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-primary">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Add new supplier...</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2 p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">New Supplier</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickAdd(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <Input
                    placeholder="Supplier name"
                    value={quickSupplierName}
                    onChange={(e) => setQuickSupplierName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddSupplier();
                      }
                    }}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={quickSupplierPhone}
                    onChange={(e) => setQuickSupplierPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAddSupplier();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleQuickAddSupplier}
                    disabled={!quickSupplierName.trim() || isPending}
                    className="w-full"
                  >
                    {isPending ? "Adding..." : "Add Supplier"}
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchaseCost">Purchase Cost *</Label>
              <Input
                id="purchaseCost"
                name="purchaseCost"
                type="number"
                step="0.01"
                placeholder="Amount paid to supplier"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="washingCost">Washing Cost</Label>
              <Input
                id="washingCost"
                name="washingCost"
                type="number"
                step="0.01"
                placeholder="Cost to wash clothes"
                value={washingCost}
                onChange={(e) => setWashingCost(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="totalItems">Total Items *</Label>
              <Input
                id="totalItems"
                name="totalItems"
                type="number"
                min="1"
                placeholder="Number of pieces"
                value={totalItems}
                onChange={(e) => setTotalItems(e.target.value)}
                required
              />
            </div>

            {/* Cost Summary */}
            {total > 0 && items > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Cost:</span>
                      <span className="tabular-nums">฿{purchase.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Washing Cost:</span>
                      <span className="tabular-nums">฿{washing.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total Cost:</span>
                      <span className="tabular-nums">฿{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-primary">
                      <span>Cost Per Item:</span>
                      <span className="tabular-nums">฿{costPerItem.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional notes about this lot"
                rows={3}
              />
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
              {isPending ? "Adding..." : "Add Lot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
