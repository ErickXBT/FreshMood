import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin-layout";
import {
  useGetPaymentSummary,
  getGetPaymentSummaryQueryKey,
  useGetMonthlyRevenue,
  getGetMonthlyRevenueQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { Loader2, CreditCard, Wallet, Banknote, Truck, TrendingUp, ShoppingBag, ReceiptText, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [year, mon] = m.split("-");
  return format(new Date(Number(year), Number(mon) - 1, 1), "MMMM yyyy");
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  QRIS:          { label: "QRIS / e-Wallet", color: "#3B82F6", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",   icon: Wallet },
  CASH:          { label: "Cash at Cashier",  color: "#22C55E", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Banknote },
  DELIVERY_CASH: { label: "Delivery Cash",    color: "#A855F7", bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Truck },
  CARD:          { label: "Credit/Debit Card",color: "#06B6D4", bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",   icon: CreditCard },
};

function getConfig(method: string) {
  return PAYMENT_CONFIG[method] ?? { label: method, color: "#9CA3AF", bg: "bg-gray-100 text-gray-600", icon: CreditCard };
}

export default function AdminPayments() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());

  const { data: months } = useGetMonthlyRevenue({
    query: { queryKey: getGetMonthlyRevenueQueryKey() }
  });

  const monthOptions = useMemo(() => {
    const list = (months ?? []).map((m) => m.month);
    if (!list.includes(currentMonthStr())) list.unshift(currentMonthStr());
    return [...new Set(list)].sort((a, b) => b.localeCompare(a));
  }, [months]);

  const monthParam = { month: selectedMonth };
  const { data: summary, isLoading } = useGetPaymentSummary(monthParam, {
    query: {
      queryKey: getGetPaymentSummaryQueryKey(monthParam),
      refetchInterval: 30000,
    }
  });

  const grandTotal = summary?.reduce((a, r) => a + r.totalRevenue, 0) ?? 0;
  const grandOrders = summary?.reduce((a, r) => a + r.orderCount, 0) ?? 0;
  const grandSubtotal = summary?.reduce((a, r) => a + r.totalSubtotal, 0) ?? 0;
  const grandFees = summary?.reduce((a, r) => a + r.totalTax + r.totalServiceFee, 0) ?? 0;

  const pieData = summary?.map((r) => ({
    name: getConfig(r.paymentMethod).label,
    value: r.totalRevenue,
    color: getConfig(r.paymentMethod).color,
  })) ?? [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-primary" />
              Payment Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Rekap pendapatan berdasarkan metode pembayaran</p>
          </div>
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

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !summary || summary.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Belum ada data untuk {monthLabel(selectedMonth)}</p>
            <p className="text-sm mt-1">Data akan muncul setelah ada transaksi masuk</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Revenue</span>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatRupiah(grandTotal)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Semua metode pembayaran</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Order</span>
                  </div>
                  <p className="text-xl font-bold">{grandOrders} order</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg {formatRupiah(grandOrders > 0 ? grandTotal / grandOrders : 0)} / order</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ReceiptText className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Subtotal</span>
                  </div>
                  <p className="text-xl font-bold">{formatRupiah(grandSubtotal)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sebelum biaya tambahan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Total Biaya Tambahan</span>
                  </div>
                  <p className="text-xl font-bold">{formatRupiah(grandFees)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tax + Service + Delivery</p>
                </CardContent>
              </Card>
            </div>

            {/* Pie Chart + Method Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribusi Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatRupiah(value)}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue share bars */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue Share per Metode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {summary.map((r) => {
                    const cfg = getConfig(r.paymentMethod);
                    const Icon = cfg.icon;
                    return (
                      <div key={r.paymentMethod}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm">{formatRupiah(r.totalRevenue)}</span>
                            <span className="text-xs text-muted-foreground ml-2">({r.revenueShare.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${r.revenueShare}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Detail Cards per payment method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {summary.map((r) => {
                const cfg = getConfig(r.paymentMethod);
                const Icon = cfg.icon;
                return (
                  <Card key={r.paymentMethod} className="overflow-hidden">
                    {/* Color bar on top */}
                    <div className="h-1.5" style={{ backgroundColor: cfg.color }} />
                    <CardContent className="pt-4 pb-5 px-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: cfg.color + "22" }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-tight">{cfg.label}</p>
                          <p className="text-xs text-muted-foreground">{r.revenueShare.toFixed(1)}% dari total</p>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground text-xs">Jumlah Order</span>
                          <span className="font-semibold">{r.orderCount} order</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground text-xs">Total Revenue</span>
                          <span className="font-bold" style={{ color: cfg.color }}>{formatRupiah(r.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                          <span className="text-muted-foreground text-xs">Subtotal</span>
                          <span className="font-medium">{formatRupiah(r.totalSubtotal)}</span>
                        </div>
                        {r.totalTax > 0 && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground text-xs">Tax (10%)</span>
                            <span className="font-medium">{formatRupiah(r.totalTax)}</span>
                          </div>
                        )}
                        {r.totalServiceFee > 0 && (
                          <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                            <span className="text-muted-foreground text-xs">
                              {r.paymentMethod === "DELIVERY_CASH" ? "Delivery Fee" : "Service Fee (5%)"}
                            </span>
                            <span className="font-medium">{formatRupiah(r.totalServiceFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-muted-foreground text-xs">Rata-rata / Order</span>
                          <span className="font-semibold">{formatRupiah(r.avgOrderValue)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground pb-2">
              Data realtime · Auto-refresh setiap 30 detik · {monthLabel(selectedMonth)}
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
