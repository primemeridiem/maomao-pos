import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getRecentSales } from "@/lib/actions/dashboard";

export async function RecentSalesTable() {
  const sales = await getRecentSales();

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return `฿${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodBadgeVariant = (method: string) => {
    switch (method) {
      case "cash":
        return "default" as const;
      case "card":
        return "secondary" as const;
      case "transfer":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          Your latest {sales.length} transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No sales yet. Start selling to see transactions here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm">
                      {formatDate(sale.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="tabular-nums">{sale.itemCount}</span>{" "}
                      {sale.itemCount === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getPaymentMethodBadgeVariant(
                          sale.paymentMethod
                        )}
                        className="capitalize"
                      >
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
