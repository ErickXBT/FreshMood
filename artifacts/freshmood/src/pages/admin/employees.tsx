import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import {
  useListCashiers,
  getListCashiersQueryKey,
  useCreateCashier,
  useDeleteCashier,
  getGetActiveCashierQueryKey,
} from "@workspace/api-client-react";
import { useActiveCashier } from "@/hooks/use-cashier";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  CheckCircle2,
  ArrowLeftRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function AdminEmployees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeCashier, switchCashier, isSwitching } = useActiveCashier();

  const { data: cashiers = [], isLoading } = useListCashiers({
    query: { queryKey: getListCashiersQueryKey() },
  });

  const createMutation = useCreateCashier();
  const deleteMutation = useDeleteCashier();

  const [newName, setNewName] = useState("");
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await createMutation.mutateAsync({ data: { name } });
      queryClient.invalidateQueries({ queryKey: getListCashiersQueryKey() });
      setNewName("");
      toast({ title: "Kasir ditambahkan", description: `${name} berhasil didaftarkan` });
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat menambah kasir", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kasir "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListCashiersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetActiveCashierQueryKey() });
      toast({ title: "Dihapus", description: `${name} dihapus dari daftar kasir` });
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat menghapus kasir", variant: "destructive" });
    }
  };

  const handleActivate = async (cashierId: number | null, name?: string) => {
    setSwitchingId(cashierId);
    try {
      await switchCashier(cashierId);
      queryClient.invalidateQueries({ queryKey: getGetActiveCashierQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCashiersQueryKey() });
      toast({
        title: cashierId ? "Kasir Aktif" : "Kasir Dihentikan",
        description: cashierId ? `${name} sekarang sedang bertugas` : "Tidak ada kasir aktif saat ini",
      });
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Manajemen Kasir
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola daftar kasir dan atur siapa yang sedang bertugas
          </p>
        </div>

        {/* Active Cashier Status */}
        <Card className={activeCashier ? "border-green-300 dark:border-green-700" : "border-dashed"}>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                activeCashier
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-muted"
              }`}>
                {activeCashier
                  ? <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  : <UserX className="w-6 h-6 text-muted-foreground" />
                }
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Status Kasir</p>
                {activeCashier ? (
                  <>
                    <p className="font-bold text-base text-green-700 dark:text-green-400">{activeCashier.name}</p>
                    <p className="text-xs text-muted-foreground">Sedang bertugas — nama akan tertera di setiap struk</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Tidak ada kasir aktif</p>
                    <p className="text-xs text-muted-foreground">Pilih kasir yang sedang jaga dari daftar di bawah</p>
                  </>
                )}
              </div>
              {activeCashier && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActivate(null)}
                  disabled={isSwitching}
                  className="shrink-0 text-destructive border-destructive/40 hover:bg-destructive/10"
                >
                  {isSwitching && switchingId === null
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : "Selesai Jaga"
                  }
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cashier List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Daftar Kasir ({cashiers.length})
            </CardTitle>
            <CardDescription>
              Klik "Mulai Jaga" untuk mengaktifkan kasir yang sedang bertugas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : cashiers.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada kasir terdaftar.</p>
                <p className="text-xs mt-1">Tambah kasir menggunakan form di bawah.</p>
              </div>
            ) : (
              cashiers.map(cashier => {
                const isActive = activeCashier?.id === cashier.id;
                const isThisSwitching = switchingId === cashier.id;
                return (
                  <div
                    key={cashier.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      isActive
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      isActive
                        ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{cashier.name}</p>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                            Bertugas
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Terdaftar {format(parseISO(cashier.createdAt), "d MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(null)}
                          disabled={isSwitching}
                          className="text-xs"
                        >
                          {isThisSwitching || (isSwitching && switchingId === null)
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />Aktif</>
                          }
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(cashier.id, cashier.name)}
                          disabled={isSwitching}
                          className="text-xs"
                        >
                          {isThisSwitching
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><ArrowLeftRight className="w-3.5 h-3.5 mr-1" />Mulai Jaga</>
                          }
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cashier.id, cashier.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Add new cashier form */}
            <form onSubmit={handleCreate} className="flex gap-2 pt-3 border-t">
              <Input
                placeholder="Nama kasir baru (contoh: Budi, Sari...)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newName.trim() || createMutation.isPending}>
                {createMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Plus className="w-4 h-4 mr-1" />Tambah</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info box */}
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Cara Kerja</p>
          <p>• Hanya satu kasir yang bisa aktif dalam satu waktu</p>
          <p>• Nama kasir aktif <strong>otomatis tercantum</strong> di setiap struk pesanan baru</p>
          <p>• Klik "Switch Kasir" di sidebar untuk ganti kasir dengan cepat</p>
          <p>• Hanya owner yang tahu password login — kasir tidak perlu login</p>
        </div>

      </div>
    </AdminLayout>
  );
}
