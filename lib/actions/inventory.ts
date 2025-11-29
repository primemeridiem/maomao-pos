"use server";

import { db } from "@/lib/db";
import { category, supplier, lot, product } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ============================================================================
// Categories
// ============================================================================

export async function getCategories() {
  return await db.select().from(category).orderBy(category.name);
}

export async function createCategory(data: { name: string }) {
  const [newCategory] = await db.insert(category).values({ name: data.name }).returning();

  revalidatePath("/inventory");
  return newCategory;
}

export async function deleteCategory(id: string) {
  await db.delete(category).where(eq(category.id, id));
  revalidatePath("/inventory");
}

// ============================================================================
// Suppliers
// ============================================================================

export async function getSuppliers() {
  return await db.select().from(supplier).orderBy(supplier.name);
}

export async function createSupplier(data: { name: string; phone?: string; notes?: string }) {
  const [newSupplier] = await db.insert(supplier).values(data).returning();

  revalidatePath("/inventory");
  return newSupplier;
}

export async function deleteSupplier(id: string) {
  await db.delete(supplier).where(eq(supplier.id, id));
  revalidatePath("/inventory");
}

// ============================================================================
// Lots
// ============================================================================

export async function getLots() {
  return await db.query.lot.findMany({
    with: {
      supplier: true,
      products: {
        with: {
          category: true,
        },
      },
    },
    orderBy: (lot, { desc }) => [desc(lot.purchaseDate)],
  });
}

export async function getLotById(id: string) {
  return await db.query.lot.findFirst({
    where: (lot, { eq }) => eq(lot.id, id),
    with: {
      supplier: true,
      products: {
        with: {
          category: true,
        },
        orderBy: (product, { desc }) => [desc(product.createdAt)],
      },
    },
  });
}

export async function createLot(data: {
  supplierId: string;
  purchaseCost: string;
  washingCost: string;
  totalItems: number;
  notes?: string;
}) {
  const purchaseCost = parseFloat(data.purchaseCost);
  const washingCost = parseFloat(data.washingCost);
  const totalCost = purchaseCost + washingCost;
  const costPerItem = totalCost / data.totalItems;

  const [newLot] = await db
    .insert(lot)
    .values({
      supplierId: data.supplierId,
      purchaseCost: data.purchaseCost,
      washingCost: data.washingCost,
      totalCost: totalCost.toFixed(2),
      totalItems: data.totalItems,
      costPerItem: costPerItem.toFixed(2),
      notes: data.notes,
    })
    .returning();

  revalidatePath("/inventory");
  return newLot;
}

// ============================================================================
// Products
// ============================================================================

export async function getProducts() {
  return await db.query.product.findMany({
    with: {
      category: true,
      lot: {
        with: {
          supplier: true,
        },
      },
    },
    orderBy: (product, { desc }) => [desc(product.createdAt)],
  });
}

/**
 * Generate a barcode from a product ID (UUID)
 * Converts UUID to a numeric string suitable for barcode encoding (CODE128)
 * Uses a hash function to create a deterministic numeric value
 * Note: Collisions are possible but unlikely. The function includes collision handling.
 */
function generateBarcodeFromId(productId: string, suffix: number = 0): string {
  // Remove hyphens from UUID
  const uuidWithoutHyphens = productId.replace(/-/g, "");

  // Create a numeric hash from the UUID
  let hash = 0;
  for (let i = 0; i < uuidWithoutHyphens.length; i++) {
    const char = uuidWithoutHyphens.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Add suffix to handle collisions (modify last digits)
  if (suffix > 0) {
    hash = (hash + suffix) % 1000000000000; // Modulo to keep within 12 digits
  }

  // Convert to positive number and pad to 12 digits
  const numericBarcode = Math.abs(hash).toString().padStart(12, "0");

  // Ensure it's exactly 12 digits (take last 12 if longer)
  return numericBarcode.slice(-12);
}

/**
 * Generate a unique barcode for a product, checking for collisions
 * Returns a barcode that doesn't exist in the database
 */
async function generateUniqueBarcode(productId: string): Promise<string> {
  let attempt = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (attempt < maxAttempts) {
    const candidateBarcode = generateBarcodeFromId(productId, attempt);

    // Check if this barcode already exists for a different product
    const existingProducts = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.barcode, candidateBarcode),
          ne(product.id, productId) // Exclude current product
        )
      )
      .limit(1);

    // If no collision, return this barcode
    if (existingProducts.length === 0) {
      return candidateBarcode;
    }

    attempt++;
  }

  // Fallback: if all attempts failed, use product ID with timestamp
  // This should never happen in practice, but provides a safety net
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const uuidPart = productId.replace(/-/g, "").slice(0, 6); // First 6 chars of UUID
  return (uuidPart + timestamp).padStart(12, "0").slice(-12);
}

export async function createProduct(data: {
  name: string;
  barcode?: string;
  categoryId?: string;
  lotId?: string;
  costPrice: string;
  sellingPrice: string;
  stockQuantity?: number;
}) {
  // Insert product first to get the generated ID
  const [newProduct] = await db
    .insert(product)
    .values({
      ...data,
      stockQuantity: data.stockQuantity ?? 1,
    })
    .returning();

  // Auto-generate barcode from product ID if not provided
  if (!data.barcode) {
    // Generate a unique barcode (with collision detection)
    const generatedBarcode = await generateUniqueBarcode(newProduct.id);
    const [updatedProduct] = await db
      .update(product)
      .set({ barcode: generatedBarcode })
      .where(eq(product.id, newProduct.id))
      .returning();

    revalidatePath("/inventory");
    if (data.lotId) {
      revalidatePath(`/inventory/lots/${data.lotId}`);
    }
    return updatedProduct;
  }

  revalidatePath("/inventory");
  if (data.lotId) {
    revalidatePath(`/inventory/lots/${data.lotId}`);
  }
  return newProduct;
}

export async function markProductAsSold(id: string) {
  const [updatedProduct] = await db
    .update(product)
    .set({
      isSold: true,
      soldAt: new Date(),
      stockQuantity: 0,
    })
    .where(eq(product.id, id))
    .returning();

  revalidatePath("/inventory");
  return updatedProduct;
}

export async function updateProductPrice(id: string, sellingPrice: string) {
  const [updatedProduct] = await db
    .update(product)
    .set({ sellingPrice })
    .where(eq(product.id, id))
    .returning();

  revalidatePath("/inventory");
  // Revalidate the lot detail page if product has a lotId
  if (updatedProduct.lotId) {
    revalidatePath(`/inventory/lots/${updatedProduct.lotId}`);
  }
  return updatedProduct;
}

export async function deleteProduct(id: string) {
  await db.delete(product).where(eq(product.id, id));
  revalidatePath("/inventory");
}
