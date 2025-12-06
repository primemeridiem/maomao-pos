"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Barcode,
  CheckCircle2,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { completeSale } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  categoryId: string | null;
  lotId: string | null;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: number;
  isSold: boolean;
  category: {
    id: string;
    name: string;
  } | null;
  lot: {
    id: string;
    supplier: {
      id: string;
      name: string;
    };
  } | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface CheckoutViewProps {
  products: Product[];
}

export function CheckoutView({ products }: CheckoutViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: "", message: "" });
  const [completedSale, setCompletedSale] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    amountPaid?: number;
    change?: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus search input on mount and keep it focused
  useEffect(() => {
    searchInputRef.current?.focus();

    // Helper to check if element is interactive
    const isInteractiveElement = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute("role");

      // Check if it's a button, link, input, or interactive element
      if (tagName === "button" || tagName === "a" || tagName === "input" || tagName === "textarea") return true;
      if (role === "button" || role === "menuitem" || role === "option" || role === "textbox") return true;
      if (element.hasAttribute("data-radix-collection-item")) return true; // shadcn/ui components

      // Check parent elements up to 3 levels
      let parent = element.parentElement;
      let depth = 0;
      while (parent && depth < 3) {
        const parentTag = parent.tagName.toLowerCase();
        const parentRole = parent.getAttribute("role");
        if (parentTag === "button" || parentTag === "a" || parentTag === "input") return true;
        if (parentRole === "button" || parentRole === "menuitem" || parentRole === "textbox") return true;
        if (parent.hasAttribute("data-radix-collection-item")) return true;
        parent = parent.parentElement;
        depth++;
      }

      return false;
    };

    // Refocus search input when clicking on non-interactive areas
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't refocus if clicking on interactive elements
      if (isInteractiveElement(target)) {
        return;
      }

      // Small delay to allow click handlers to execute first
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    };

    // Global keypress listener for barcode scanner
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();

      // If not focused on an input/textarea, focus the search input
      if (tagName !== "input" && tagName !== "textarea") {
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keypress", handleKeyPress);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search/barcode input on Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Try to find exact barcode match first
    const product = products.find((p) => p.barcode === searchQuery.trim());
    if (product) {
      addToCart(product);
      setSearchQuery("");
      searchInputRef.current?.focus();
    } else {
      // Check if search query looks like a barcode (12 digits)
      const looksLikeBarcode = /^\d{12}$/.test(searchQuery.trim());
      if (looksLikeBarcode) {
        // Show error for invalid barcode
        setErrorMessage({
          title: "Product Not Found",
          message: `Barcode "${searchQuery.trim()}" is not in inventory.`,
        });
        setShowErrorDialog(true);
        setSearchQuery("");
        searchInputRef.current?.focus();
      }
      // If not a barcode format, keep the search query to show filtered products
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Check stock quantity
        // if (existingItem.quantity >= product.stockQuantity) {
        //   alert("Cannot add more items than available in stock");
        //   return prevCart;
        // }
        // Increment quantity
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) {
              return null;
            }
            // if (newQuantity > item.stockQuantity) {
            //   alert("Cannot exceed stock quantity");
            //   return item;
            // }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Handle complete purchase
  const handleCompletePurchase = async () => {
    if (cart.length === 0) return;

    const saleTotal = cart.reduce(
      (sum, item) => sum + parseFloat(item.sellingPrice) * item.quantity,
      0
    );

    // Validate cash payment amount
    if (paymentMethod === "cash") {
      const paidAmount = parseFloat(amountPaid);
      if (!amountPaid || isNaN(paidAmount)) {
        setErrorMessage({
          title: "Invalid Amount",
          message: "Please enter the amount paid by customer.",
        });
        setShowErrorDialog(true);
        amountPaidInputRef.current?.focus();
        return;
      }
      if (paidAmount < saleTotal) {
        setErrorMessage({
          title: "Insufficient Payment",
          message: `Amount paid (฿${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) is less than total (฿${saleTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
        });
        setShowErrorDialog(true);
        amountPaidInputRef.current?.focus();
        return;
      }
    }

    startTransition(async () => {
      try {
        await completeSale({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.sellingPrice,
          })),
          paymentMethod: paymentMethod,
        });

        const paidAmount = paymentMethod === "cash" ? parseFloat(amountPaid) : saleTotal;
        const changeAmount = paymentMethod === "cash" ? paidAmount - saleTotal : 0;

        // Save completed sale data for dialog
        setCompletedSale({
          items: [...cart],
          total: saleTotal,
          paymentMethod: paymentMethod,
          amountPaid: paidAmount,
          change: changeAmount,
        });

        // Clear cart and payment info
        setCart([]);
        setAmountPaid("");

        // Show success dialog
        setShowSuccessDialog(true);

        // Refresh the page data
        router.refresh();

        // Refocus search input for next transaction
        searchInputRef.current?.focus();
      } catch (error) {
        console.error("Failed to complete purchase:", error);
        setErrorMessage({
          title: "Purchase Failed",
          message: "Failed to complete purchase. Please try again.",
        });
        setShowErrorDialog(true);
      }
    });
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + parseFloat(item.sellingPrice) * item.quantity,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Get payment method label
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "เงินสด";
      case "promptpay":
        return "พร้อมเพย์";
      case "khonlakhrueng":
        return "คนละครึ่ง";
      default:
        return method;
    }
  };

  return (
    <div className='flex flex-col h-full p-4 gap-4 md:p-6 md:gap-6'>
      {/* Search / Barcode Scanner Input */}
      <Card>
        <CardContent className='pt-6'>
          <form onSubmit={handleSearchSubmit} className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Barcode className='absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Input
              ref={searchInputRef}
              type='text'
              placeholder='Scan barcode or search products...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 pr-10 text-lg h-12'
            />
          </form>
        </CardContent>
      </Card>

      {/* Main Layout: Products List + Shopping Cart */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-1 overflow-hidden'>
        {/* Left: Products List */}
        <Card className='flex flex-col'>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 overflow-hidden'>
            <ScrollArea className='h-full pr-4'>
              <div className='space-y-2'>
                {filteredProducts.length === 0 ? (
                  <p className='text-sm text-muted-foreground text-center py-8'>
                    No products found
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className='flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors'
                      onClick={() => addToCart(product)}
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{product.name}</p>
                        <div className='flex items-center gap-2 mt-1'>
                          {product.category && (
                            <Badge variant='secondary' className='text-xs'>
                              {product.category.name}
                            </Badge>
                          )}

                          {product.barcode && (
                            <span className='text-xs text-muted-foreground font-mono'>
                              {product.barcode}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='text-right ml-4'>
                        <p className='font-bold tabular-nums'>
                          ฿
                          {parseFloat(product.sellingPrice).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Stock: {product.stockQuantity}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Shopping Cart */}
        <Card className='flex flex-col'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShoppingCart className='h-5 w-5' />
              Shopping Cart ({totalItems})
            </CardTitle>
          </CardHeader>
          <CardContent className='flex-1 flex flex-col overflow-hidden'>
            <ScrollArea className='flex-1 pr-4'>
              {cart.length === 0 ? (
                <div className='text-center py-12'>
                  <ShoppingCart className='h-12 w-12 mx-auto text-muted-foreground mb-3' />
                  <p className='text-muted-foreground'>Cart is empty</p>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Scan a barcode or click a product to add
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {cart.map((item) => (
                    <div key={item.id} className='flex items-start gap-3 p-3 rounded-lg border'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium'>{item.name}</p>
                        {item.category && (
                          <Badge variant='secondary' className='text-xs mt-1'>
                            {item.category.name}
                          </Badge>
                        )}
                        <p className='text-sm text-muted-foreground mt-1 tabular-nums'>
                          ฿
                          {parseFloat(item.sellingPrice).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          each
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className='h-4 w-4' />
                        </Button>
                        <span className='w-8 text-center font-medium tabular-nums'>
                          {item.quantity}
                        </span>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-destructive'
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold tabular-nums'>
                          ฿
                          {(parseFloat(item.sellingPrice) * item.quantity).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {cart.length > 0 && (
              <>
                <Separator className='my-4' />
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-lg font-medium'>Subtotal</span>
                    <span className='text-2xl font-bold tabular-nums'>
                      ฿
                      {subtotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>Payment Method</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      <div
                        onClick={() => setPaymentMethod("cash")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent",
                          paymentMethod === "cash"
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <Banknote className='h-6 w-6' />
                        <span className='text-sm font-medium'>เงินสด</span>
                      </div>
                      <div
                        onClick={() => setPaymentMethod("promptpay")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent",
                          paymentMethod === "promptpay"
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <Image
                          src='/assets/promptpay-logo.svg'
                          alt='พร้อมเพย์'
                          width={100}
                          height={100}
                          className='h-8 w-8'
                        />
                        <span className='text-sm font-medium'>พร้อมเพย์</span>
                      </div>
                      <div
                        onClick={() => setPaymentMethod("khonlakhrueng")}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent",
                          paymentMethod === "khonlakhrueng"
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        <Image
                          src='/assets/KLK-logo.svg'
                          alt='คนละครึ่ง'
                          width={100}
                          height={100}
                          className='h-8 w-8'
                        />
                        <span className='text-sm font-medium'>คนละครึ่ง</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Paid Input (Cash only) */}
                  {paymentMethod === "cash" && (
                    <div className='space-y-2'>
                      <Label htmlFor='amountPaid' className='text-sm font-medium'>
                        Amount Paid
                      </Label>
                      <div className='relative'>
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                          ฿
                        </span>
                        <Input
                          id='amountPaid'
                          ref={amountPaidInputRef}
                          type='number'
                          step='0.01'
                          min='0'
                          placeholder='0.00'
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className='pl-6 text-lg h-12 tabular-nums'
                        />
                      </div>
                      {amountPaid && !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) >= subtotal && (
                        <div className='flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'>
                          <span className='text-sm font-medium text-green-900 dark:text-green-100'>
                            Change
                          </span>
                          <span className='text-xl font-bold text-green-900 dark:text-green-100 tabular-nums'>
                            ฿
                            {(parseFloat(amountPaid) - subtotal).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    className='w-full'
                    size='lg'
                    onClick={handleCompletePurchase}
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : "Complete Purchase"}
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setCart([])}
                    disabled={isPending}
                  >
                    Clear Cart
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-green-600 dark:text-green-400'>
              <CheckCircle2 className='h-6 w-6' />
              Purchase Completed!
            </DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>

          {completedSale && (
            <div className='space-y-4 mt-4'>
              {/* Items Summary */}
              <div className='space-y-2'>
                <h4 className='font-medium text-sm text-muted-foreground'>Items</h4>
                <div className='space-y-2'>
                  {completedSale.items.map((item) => (
                    <div key={item.id} className='flex justify-between text-sm'>
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span className='tabular-nums'>
                        ฿
                        {(parseFloat(item.sellingPrice) * item.quantity).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Payment Method</span>
                <span className='font-medium'>
                  {getPaymentMethodLabel(completedSale.paymentMethod)}
                </span>
              </div>

              <Separator />

              {/* Total */}
              <div className='flex justify-between items-center'>
                <span className='text-lg font-medium'>Total</span>
                <span className='text-2xl font-bold tabular-nums'>
                  ฿
                  {completedSale.total.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Amount Paid & Change (Cash only) */}
              {completedSale.paymentMethod === "cash" && completedSale.amountPaid !== undefined && (
                <>
                  <Separator />
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-muted-foreground'>Amount Paid</span>
                    <span className='font-medium tabular-nums'>
                      ฿
                      {completedSale.amountPaid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {completedSale.change !== undefined && completedSale.change > 0 && (
                    <div className='flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'>
                      <span className='text-lg font-medium text-green-900 dark:text-green-100'>
                        Change
                      </span>
                      <span className='text-2xl font-bold text-green-900 dark:text-green-100 tabular-nums'>
                        ฿
                        {completedSale.change.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </>
              )}

              <Button
                className='w-full'
                onClick={() => {
                  setShowSuccessDialog(false);
                  setCompletedSale(null);
                }}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600 dark:text-red-400'>
              <AlertCircle className='h-5 w-5' />
              {errorMessage.title}
            </DialogTitle>
            <DialogDescription>{errorMessage.message}</DialogDescription>
          </DialogHeader>
          <Button
            className='w-full mt-4'
            onClick={() => {
              setShowErrorDialog(false);
              searchInputRef.current?.focus();
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
