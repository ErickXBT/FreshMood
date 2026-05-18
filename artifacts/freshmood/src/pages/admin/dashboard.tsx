import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetTopMenuItems,
  getGetTopMenuItemsQueryKey,
  useGetRevenueByDay,
  getGetRevenueByDayQueryKey,
  useGetRecentOrders,
  getGetRecentOrdersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { DollarSign, ShoppingBag, Utensils, CheckCircle, Clock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useGetRevenueByDay({ days: 7 }, {
    query: { queryKey: getGetRevenueByDayQueryKey({ days: 7 }) }
  });

  const { data: topItems, isLoading: isLoadingTopItems } = useGetTopMenuItems({ limit: 5 }, {
    query: { queryKey: getGetTopMenuItemsQueryKey({ limit: 5 }) }
  });

  const { data: recentOrders, isLoading: isLoadingRecent } = useGetRecentOrders({ limit: 5 }, {
    query: { queryKey: getGetRecentOrdersQueryKey({ limit: 5 }) }
  });

  if (isLoadingSummary || isLoadingRevenue || isLoadingTopItems || isLoadingRecent) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const chartData = revenueData?.map(d => ({
    name: format(parseISO(d.date), 'MMM dd'),
    total: d.revenue
  })) || [];

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(summary?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(summary?.revenueToday || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.ordersToday || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRupiah(summary?.averageOrderValue || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold">{summary?.pendingOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Utensils className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Preparing</p>
                  <h3 className="text-2xl font-bold">{summary?.preparingOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold">{summary?.completedOrders || 0}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `Rp ${value / 1000}k`}
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

          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topItems?.map((item, i) => (
                  <div key={item.menuItemId} className="flex items-center">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.orderCount} orders</p>
                    </div>
                    <div className="font-medium text-sm">
                      {formatRupiah(item.revenue)}
                    </div>
                  </div>
                ))}
                {(!topItems || topItems.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
