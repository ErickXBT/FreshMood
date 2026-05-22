import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin-layout";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetTopMenuItems,
  getGetTopMenuItemsQueryKey,
  useGetRevenueByDay,
  getGetRevenueByDayQueryKey,
  useGetRecentOrders,
  getGetRecentOrdersQueryKey,
  useGetItemSales,
  getGetItemSalesQueryKey,
  useGetMonthlyRevenue,
  getGetMonthlyRevenueQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { DollarSign, ShoppingBag, Utensils, CheckCircle, Clock, Loader2, Package, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [year, mon] = m.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return format(date, "MMMM yyyy");
}

export default function AdminDashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr());

  const monthParam = { month: selectedMonth };

  const { data: months } = useGetMonthlyRevenue({
    query: { queryKey: getGetMonthlyRevenueQueryKey() }
  });

  // Ensure current month is always in the options
  const monthOptions = useMemo(() => {
    const list = (months ?? []).map((m) => m.month);
    if (!list.includes(currentMonthStr())) list.unshift(currentMonthStr());
    return [...new Set(list)].sort((a, b) => b.localeCompare(a));
  }, [months]);

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary(monthParam, {
    query: { queryKey: getGetDashboardSummaryQueryKey(monthParam) }
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useGetRevenueByDay(monthParam, {
    query: { queryKey: getGetRevenueByDayQueryKey(monthParam) }
  });

  const { data: topItems, isLoading: isLoadingTopItems } = useGetTopMenuItems(
    { limit: 5, ...monthParam },
    { query: { queryKey: getGetTopMenuItemsQueryKey({ limit: 5, ...monthParam }) } }
  );

  const { data: itemSales, isLoading: isLoadingItemSales } = useGetItemSales(monthParam, {
    query: { queryKey: getGetItemSalesQueryKey(monthParam) }
  });

  const { data: recentOrders, isLoading: isLoadingRecent } = useGetRecentOrders({ limit: 5 }, {
    query: { queryKey: getGetRecentOrdersQueryKey({ limit: 5 }) }
  });

  const isLoading = isLoadingSummary || isLoadingRevenue || isLoadingTopItems || isLoadingRecent || isLoadingItemSales;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const chartData = revenueData?.map(d => ({
    name: format(parseISO(d.date), 'd MMM'),
    total: d.revenue
  })) || [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header + Month Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <div className="w-full sm:w-52">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg md:text-2xl font-bold">{formatRupiah(summary?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">{monthLabel(selectedMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs md:text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg md:text-2xl font-bold">{summary?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{monthLabel(selectedMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs md:text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg md:text-2xl font-bold">{summary?.completedOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs md:text-sm font-medium">Avg Order Value</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg md:text-2xl font-bold">{formatRupiah(summary?.averageOrderValue || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-xl md:text-2xl font-bold">{summary?.pendingOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-4 pb-4 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <Utensils className="h-6 w-6 md:h-8 md:w-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Preparing</p>
                  <h3 className="text-xl md:text-2xl font-bold">{summary?.preparingOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-4 pb-4 px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-xl md:text-2xl font-bold">{summary?.completedOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart + Top Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Revenue — {monthLabel(selectedMonth)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000}k`}
                      width={40}
                    />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted))'}}
                      contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))'}}
                      formatter={(value: number) => [formatRupiah(value), "Revenue"]}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems?.map((item, i) => (
                  <div key={item.menuItemId} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.orderCount} orders</p>
                    </div>
                    <div className="font-medium text-xs md:text-sm shrink-0">
                      {formatRupiah(item.revenue)}
                    </div>
                  </div>
                ))}
                {(!topItems || topItems.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">No data for this month</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Sales Detail */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Detail Penjualan Per Item — {monthLabel(selectedMonth)}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {itemSales?.filter(i => i.qtySold > 0).length ?? 0} dari {itemSales?.length ?? 0} item terjual
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">#</th>
                    <th className="px-5 py-3 text-left font-medium">Menu Item</th>
                    <th className="px-5 py-3 text-right font-medium">Harga</th>
                    <th className="px-5 py-3 text-right font-medium">Qty Terjual</th>
                    <th className="px-5 py-3 text-right font-medium">Order Count</th>
                    <th className="px-5 py-3 text-right font-medium">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itemSales?.map((item, i) => (
                    <tr key={item.menuItemId} className={`transition-colors ${item.qtySold === 0 ? "opacity-50" : "hover:bg-muted/40"}`}>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.qtySold === 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingDown className="w-3 h-3" /> Belum terjual
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{formatRupiah(item.price)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-bold text-base ${item.qtySold > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {item.qtySold}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{item.orderCount}x</td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {item.revenue > 0 ? formatRupiah(item.revenue) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                  {(!itemSales || itemSales.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Tidak ada data untuk bulan ini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {itemSales?.map((item, i) => (
                <div key={item.menuItemId} className={`flex items-center gap-3 px-4 py-3 ${item.qtySold === 0 ? "opacity-50" : ""}`}>
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{i + 1}</span>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-md object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRupiah(item.price)} · {item.orderCount}x order</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${item.qtySold > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {item.qtySold > 0 ? `${item.qtySold} terjual` : "0 terjual"}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.revenue > 0 ? formatRupiah(item.revenue) : "—"}</p>
                  </div>
                </div>
              ))}
              {(!itemSales || itemSales.length === 0) && (
                <div className="py-10 text-center text-muted-foreground text-sm">Tidak ada data untuk bulan ini</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
