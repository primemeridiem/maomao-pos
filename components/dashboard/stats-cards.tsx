import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/lib/actions/dashboard";

export async function StatsCards() {
  const stats = await getDashboardStats();

  const formatCurrency = (value: number) => {
    return `฿${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString("en-US");
  };

  const formatPercentage = (value: number) => {
    const abs = Math.abs(value);
    return `${value >= 0 ? "+" : "-"}${abs.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? IconTrendingUp : IconTrendingDown;
  };

  const getTrendText = (value: number, metric: string) => {
    if (value >= 0) {
      return `Trending up by ${Math.abs(value).toFixed(1)}%`;
    }
    return `Down ${Math.abs(value).toFixed(1)}% from last period`;
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.totalRevenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.revenueChange >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(stats.revenueChange)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getTrendText(stats.revenueChange, "revenue")}
            {stats.revenueChange >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Revenue for the last 30 days
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Sales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.totalSales)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.salesChange >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(stats.salesChange)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getTrendText(stats.salesChange, "sales")}
            {stats.salesChange >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Transactions for the last 30 days
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Products in Stock</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(stats.totalProducts)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.productsChange >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(stats.productsChange || 0)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current inventory level
          </div>
          <div className="text-muted-foreground">
            Available items for sale
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Profit</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.totalProfit)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.profitChange >= 0 ? (
                <IconTrendingUp />
              ) : (
                <IconTrendingDown />
              )}
              {formatPercentage(stats.profitChange)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getTrendText(stats.profitChange, "profit")}
            {stats.profitChange >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Revenue minus costs for the last 30 days
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
