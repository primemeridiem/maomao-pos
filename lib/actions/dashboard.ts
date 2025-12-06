"use server";

import { db } from "@/lib/db";
import { sale, saleItem, product, lot } from "@/db/schema";
import { sql, desc, gte, and, eq, lt } from "drizzle-orm";

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  totalProfit: number;
  revenueChange: number;
  salesChange: number;
  productsChange: number;
  profitChange: number;
}

export interface SalesOverTime {
  date: string;
  revenue: number;
  sales: number;
}

export interface RecentSale {
  id: string;
  totalAmount: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: Date;
}

/**
 * Get dashboard statistics for the current period and previous period
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Current period stats (last 30 days)
  const currentPeriodStats = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${sale.totalAmount} AS DECIMAL)), 0)`,
      totalSales: sql<number>`COUNT(${sale.id})`,
    })
    .from(sale)
    .where(gte(sale.createdAt, thirtyDaysAgo));

  // Previous period stats (30-60 days ago)
  const previousPeriodStats = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${sale.totalAmount} AS DECIMAL)), 0)`,
      totalSales: sql<number>`COUNT(${sale.id})`,
    })
    .from(sale)
    .where(
      and(
        gte(sale.createdAt, sixtyDaysAgo),
        lt(sale.createdAt, thirtyDaysAgo)
      )
    );

  // Calculate profit (revenue - cost) for current period
  const currentProfitData = await db
    .select({
      revenue: sql<number>`CAST(${saleItem.unitPrice} AS DECIMAL) * ${saleItem.quantity}`,
      cost: sql<number>`CAST(${product.costPrice} AS DECIMAL) * ${saleItem.quantity}`,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .innerJoin(product, eq(saleItem.productId, product.id))
    .where(gte(sale.createdAt, thirtyDaysAgo));

  const currentProfit = currentProfitData.reduce((sum, item) => {
    return sum + (item.revenue - item.cost);
  }, 0);

  // Calculate profit for previous period
  const previousProfitData = await db
    .select({
      revenue: sql<number>`CAST(${saleItem.unitPrice} AS DECIMAL) * ${saleItem.quantity}`,
      cost: sql<number>`CAST(${product.costPrice} AS DECIMAL) * ${saleItem.quantity}`,
    })
    .from(saleItem)
    .innerJoin(sale, eq(saleItem.saleId, sale.id))
    .innerJoin(product, eq(saleItem.productId, product.id))
    .where(
      and(
        gte(sale.createdAt, sixtyDaysAgo),
        lt(sale.createdAt, thirtyDaysAgo)
      )
    );

  const previousProfit = previousProfitData.reduce((sum, item) => {
    return sum + (item.revenue - item.cost);
  }, 0);

  // Total products in stock
  const totalProducts = await db
    .select({
      count: sql<number>`COUNT(${product.id})`,
    })
    .from(product)
    .where(eq(product.isSold, false));

  const current = currentPeriodStats[0] || { totalRevenue: 0, totalSales: 0 };
  const previous = previousPeriodStats[0] || { totalRevenue: 0, totalSales: 0 };

  // Calculate percentage changes
  const revenueChange = previous.totalRevenue > 0
    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
    : current.totalRevenue > 0 ? 100 : 0;

  const salesChange = previous.totalSales > 0
    ? ((current.totalSales - previous.totalSales) / previous.totalSales) * 100
    : current.totalSales > 0 ? 100 : 0;

  const profitChange = previousProfit > 0
    ? ((currentProfit - previousProfit) / previousProfit) * 100
    : currentProfit > 0 ? 100 : 0;

  return {
    totalRevenue: current.totalRevenue,
    totalSales: current.totalSales,
    totalProducts: totalProducts[0]?.count || 0,
    totalProfit: currentProfit,
    revenueChange,
    salesChange,
    productsChange: 0, // Would need historical data to calculate
    profitChange,
  };
}

/**
 * Get sales data over time (last 30 days)
 */
export async function getSalesOverTime(): Promise<SalesOverTime[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesData = await db
    .select({
      date: sql<string>`DATE(${sale.createdAt})`,
      revenue: sql<number>`COALESCE(SUM(CAST(${sale.totalAmount} AS DECIMAL)), 0)`,
      sales: sql<number>`COUNT(${sale.id})`,
    })
    .from(sale)
    .where(gte(sale.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${sale.createdAt})`)
    .orderBy(sql`DATE(${sale.createdAt})`);

  return salesData;
}

/**
 * Get recent sales (last 10 sales)
 */
export async function getRecentSales(): Promise<RecentSale[]> {
  const sales = await db
    .select({
      id: sale.id,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      createdAt: sale.createdAt,
    })
    .from(sale)
    .orderBy(desc(sale.createdAt))
    .limit(10);

  // Get item count for each sale
  const salesWithItemCount = await Promise.all(
    sales.map(async (s) => {
      const items = await db
        .select({
          count: sql<number>`SUM(${saleItem.quantity})`,
        })
        .from(saleItem)
        .where(eq(saleItem.saleId, s.id));

      return {
        ...s,
        itemCount: items[0]?.count || 0,
      };
    })
  );

  return salesWithItemCount;
}
