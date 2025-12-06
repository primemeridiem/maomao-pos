"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { SalesOverTime } from "@/lib/actions/dashboard";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  sales: {
    label: "Sales",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface SalesChartProps {
  data: SalesOverTime[];
}

export function SalesChart({ data }: SalesChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");
  const [metric, setMetric] = React.useState<"revenue" | "sales">("revenue");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    const now = new Date();
    let daysToSubtract = 30;
    if (timeRange === "7d") {
      daysToSubtract = 7;
    } else if (timeRange === "14d") {
      daysToSubtract = 14;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [data, timeRange]);

  const totalRevenue = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.revenue, 0);
  }, [filteredData]);

  const totalSales = React.useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.sales, 0);
  }, [filteredData]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>
          {metric === "revenue" ? "Revenue Over Time" : "Sales Over Time"}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {metric === "revenue"
              ? `Total revenue: ฿${totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : `Total sales: ${totalSales.toLocaleString("en-US")}`}
          </span>
          <span className="@[540px]/card:hidden">
            {metric === "revenue"
              ? `฿${totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : `${totalSales.toLocaleString("en-US")} sales`}
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Select value={metric} onValueChange={(value: "revenue" | "sales") => setMetric(value)}>
              <SelectTrigger
                className="flex w-28"
                size="sm"
                aria-label="Select metric"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="revenue" className="rounded-lg">
                  Revenue
                </SelectItem>
                <SelectItem value="sales" className="rounded-lg">
                  Sales
                </SelectItem>
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
              <ToggleGroupItem value="14d">14 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-28 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select time range"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="30d" className="rounded-lg">
                  30 days
                </SelectItem>
                <SelectItem value="14d" className="rounded-lg">
                  14 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (metric === "revenue") {
                  return `฿${value.toLocaleString("en-US")}`;
                }
                return value.toLocaleString("en-US");
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  formatter={(value) => {
                    if (metric === "revenue") {
                      return `฿${Number(value).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`;
                    }
                    return `${value} sales`;
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey={metric}
              type="natural"
              fill="url(#fillMetric)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
