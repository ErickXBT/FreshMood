import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin-layout";
import {
  useGetSalesReport,
  getGetSalesReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { DollarSign, ShoppingBag, Receipt, Loader2, Download, FileBarChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const MONTHS_ID_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Format a bucket key into a short label for charts/tables.
function formatLabel(period: Period, key: string): string {
  if (period === "yearly") return key;
  if (period === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS_ID[m - 1]} ${y}`;
  }
  // daily + weekly use YYYY-MM-DD
  const [y, m, d] = key.split("-").map(Number);
  const short = `${d} ${MONTHS_ID[m - 1]}`;
  return period === "weekly" ? `Mng ${short}` : short;
}

// Longer label used in the CSV report.
function formatLabelLong(period: Period, key: string): string {
  if (period === "yearly") return `Tahun ${key}`;
  if (period === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS_ID_FULL[m - 1]} ${y}`;
  }
  const [y, m, d] = key.split("-").map(Number);
  const dateStr = `${d} ${MONTHS_ID_FULL[m - 1]} ${y}`;
  return period === "weekly" ? `Minggu mulai ${dateStr}` : dateStr;
}

function periodTitle(period: Period): string {
  return PERIODS.find((p) => p.value === period)?.label ?? "";
}

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>("daily");

  const params = { period };
  const { data, isLoading } = useGetSalesReport(params, {
    query: { queryKey: getGetSalesReportQueryKey(params) },
  });

  const chartData = useMemo(
    () =>
      (data?.buckets ?? []).map((b) => ({
        name: formatLabel(period, b.key),
        total: b.revenue,
      })),
    [data, period]
  );

  const handleDownload = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push(`Laporan Penjualan FreshMood`);
    rows.push(`Periode,${periodTitle(period)}`);
    rows.push(`Tanggal Unduh,${new Date().toLocaleString("id-ID")}`);
    rows.push("");
    rows.push(`Total Pendapatan,${data.summary.totalRevenue}`);
    rows.push(`Total Pesanan,${data.summary.totalOrders}`);
    rows.push(`Rata-rata per Pesanan,${Math.round(data.summary.averageOrderValue)}`);
    rows.push("");
    rows.push("Periode,Pendapatan (Rp),Jumlah Pesanan");
    for (const b of data.buckets) {
      const label = formatLabelLong(period, b.key).replace(/,/g, " ");
      rows.push(`${label},${b.revenue},${b.orderCount}`);
    }
    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `laporan-penjualan-${period}-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FileBarChart className="w-7 h-7 text-primary" />
              Laporan Penjualan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data penjualan {periodTitle(period).toLowerCase()} dari pesanan yang sudah dibayar
            </p>
          </div>
          <Button onClick={handleDownload} disabled={!data || isLoading} className="shrink-0">
            <Download className="w-4 h-4 mr-2" />
            Unduh Laporan (CSV)
          </Button>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-full items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Pendapatan</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg md:text-2xl font-bold">{formatRupiah(data?.summary.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{periodTitle(period)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Total Pesanan</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg md:text-2xl font-bold">{data?.summary.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{periodTitle(period)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs md:text-sm font-medium">Rata-rata per Pesanan</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg md:text-2xl font-bold">{formatRupiah(data?.summary.averageOrderValue || 0)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base md:text-lg">Grafik Pendapatan — {periodTitle(period)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] md:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                        formatter={(value: number) => [formatRupiah(value), "Pendapatan"]}
                      />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base md:text-lg">Rincian Penjualan — {periodTitle(period)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Periode</th>
                        <th className="px-5 py-3 text-right font-medium">Jumlah Pesanan</th>
                        <th className="px-5 py-3 text-right font-medium">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data?.buckets.map((b) => (
                        <tr key={b.key} className={`transition-colors ${b.revenue === 0 ? "opacity-50" : "hover:bg-muted/40"}`}>
                          <td className="px-5 py-3 font-medium">{formatLabelLong(period, b.key)}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{b.orderCount}x</td>
                          <td className="px-5 py-3 text-right font-semibold">
                            {b.revenue > 0 ? formatRupiah(b.revenue) : <span className="text-muted-foreground">—</span>}
                          </td>
                        </tr>
                      ))}
                      {(!data || data.buckets.length === 0) && (
                        <tr>
                          <td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                    {data && data.buckets.length > 0 && (
                      <tfoot className="border-t-2 border-border bg-muted/40 font-semibold">
                        <tr>
                          <td className="px-5 py-3">Total</td>
                          <td className="px-5 py-3 text-right">{data.summary.totalOrders}x</td>
                          <td className="px-5 py-3 text-right">{formatRupiah(data.summary.totalRevenue)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
