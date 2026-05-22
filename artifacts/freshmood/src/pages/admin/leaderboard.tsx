import { useState, useMemo } from "react";
import AdminLayout from "@/components/admin-layout";
import {
  useGetLeaderboard,
  getGetLeaderboardQueryKey,
  useGetMonthlyRevenue,
  getGetMonthlyRevenueQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { Loader2, Trophy, Medal, Phone, ShoppingBag, Crown } from "lucide-react";
import { format, parseISO } from "date-fns";
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

const RANK_CONFIG = [
  { bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-700", text: "text-yellow-600", label: "🥇 1st Place", crown: "text-yellow-500" },
  { bg: "bg-gray-50 dark:bg-gray-800/40", border: "border-gray-300 dark:border-gray-600", text: "text-gray-500", label: "🥈 2nd Place", crown: "text-gray-400" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-300 dark:border-orange-700", text: "text-orange-600", label: "🥉 3rd Place", crown: "text-orange-500" },
];

export default function AdminLeaderboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr());

  const { data: months } = useGetMonthlyRevenue({
    query: { queryKey: getGetMonthlyRevenueQueryKey() }
  });

  const monthOptions = useMemo(() => {
    const list = (months ?? []).map((m) => m.month);
    if (!list.includes(currentMonthStr())) list.unshift(currentMonthStr());
    return [...new Set(list)].sort((a, b) => b.localeCompare(a));
  }, [months]);

  const monthParam = { month: selectedMonth };

  const { data: leaderboard, isLoading } = useGetLeaderboard(monthParam, {
    query: {
      queryKey: getGetLeaderboardQueryKey(monthParam),
      refetchInterval: 30000,
    }
  });

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7 text-primary" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Customer ranking berdasarkan total belanja</p>
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
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-2xl">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Belum ada data untuk {monthLabel(selectedMonth)}</p>
            <p className="text-sm mt-1">Data akan muncul setelah ada orderan masuk</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {top3.map((customer, i) => {
                  const cfg = RANK_CONFIG[i];
                  return (
                    <Card key={`${customer.customerName}-${customer.customerPhone}`}
                      className={`border-2 ${cfg.border} ${cfg.bg} relative overflow-hidden`}>
                      <CardContent className="pt-6 pb-5 px-5 text-center">
                        {/* Crown icon */}
                        <div className={`text-4xl mb-2`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        </div>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${cfg.text}`}>{cfg.label}</p>

                        {/* Avatar circle */}
                        <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white
                          ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-orange-500"}`}>
                          {customer.customerName.charAt(0).toUpperCase()}
                        </div>

                        <h3 className="font-bold text-base leading-tight mb-1">{customer.customerName}</h3>
                        {customer.customerPhone && (
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-3">
                            <Phone className="w-3 h-3" />
                            {customer.customerPhone}
                          </p>
                        )}

                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">Total Belanja</span>
                            <span className="font-bold text-primary">{formatRupiah(customer.totalSpent)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">Total Order</span>
                            <span className="font-semibold">{customer.orderCount}x</span>
                          </div>
                          {customer.lastOrderAt && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-xs">Terakhir Order</span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(customer.lastOrderAt), "d MMM")}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Medal className="w-4 h-4 text-muted-foreground" />
                    Peringkat Selanjutnya
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium w-12">#</th>
                          <th className="px-5 py-3 text-left font-medium">Nama Customer</th>
                          <th className="px-5 py-3 text-left font-medium">No HP / WA</th>
                          <th className="px-5 py-3 text-right font-medium">Total Order</th>
                          <th className="px-5 py-3 text-right font-medium">Total Belanja</th>
                          <th className="px-5 py-3 text-right font-medium">Terakhir Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rest.map((customer) => (
                          <tr key={`${customer.customerName}-${customer.customerPhone}`}
                            className="hover:bg-muted/40 transition-colors">
                            <td className="px-5 py-3 font-mono text-muted-foreground text-sm">#{customer.rank}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                                  {customer.customerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{customer.customerName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {customer.customerPhone ? (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3" />
                                  {customer.customerPhone}
                                </span>
                              ) : <span className="text-muted-foreground/50">—</span>}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="flex items-center justify-end gap-1.5 text-muted-foreground">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                {customer.orderCount}x
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-primary">
                              {formatRupiah(customer.totalSpent)}
                            </td>
                            <td className="px-5 py-3 text-right text-muted-foreground text-xs">
                              {customer.lastOrderAt ? format(parseISO(customer.lastOrderAt), "d MMM yyyy") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-border">
                    {rest.map((customer) => (
                      <div key={`${customer.customerName}-${customer.customerPhone}`}
                        className="flex items-center gap-3 px-4 py-3">
                        <span className="text-sm font-mono text-muted-foreground w-7 shrink-0">#{customer.rank}</span>
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                          {customer.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{customer.customerName}</p>
                          {customer.customerPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />{customer.customerPhone}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-primary">{formatRupiah(customer.totalSpent)}</p>
                          <p className="text-xs text-muted-foreground">{customer.orderCount}x order</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer note */}
            <p className="text-xs text-center text-muted-foreground pb-2">
              Data realtime · Auto-refresh setiap 30 detik · {leaderboard.length} customer aktif di {monthLabel(selectedMonth)}
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
