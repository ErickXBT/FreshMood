import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCashiers,
  getListCashiersQueryKey,
  useCreateCashier,
  useDeleteCashier,
  getGetActiveCashierQueryKey,
} from "@workspace/api-client-react";
import { useActiveCashier } from "@/hooks/use-cashier";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  User,
} from "lucide-react";

interface SwitchCashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SwitchCashierDialog({ open, onOpenChange }: SwitchCashierDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeCashier, switchCashier, isSwitching } = useActiveCashier();

  const { data: cashiers = [], isLoading } = useListCashiers({
    query: { queryKey: getListCashiersQueryKey(), enabled: open },
  });

  const createMutation = useCreateCashier();
  const deleteMutation = useDeleteCashier();

  const [newName, setNewName] = useState("");
  const [switchingId, setSwitchingId] = useState<number | null | "clear">(null);

  const handleSwitch = async (cashierId: number | null) => {
    setSwitchingId(cashierId ?? "clear");
    try {
      await switchCashier(cashierId);
      toast({
        title: cashierId ? "Kasir Aktif" : "Kasir Dihapus",
        description: cashierId
          ? `${cashiers.find(c => c.id === cashierId)?.name} sekarang sedang bertugas`
          : "Tidak ada kasir aktif saat ini",
      });
    } finally {
      setSwitchingId(null);
    }
  };

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
    if (!confirm(`Hapus kasir "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListCashiersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetActiveCashierQueryKey() });
      toast({ title: "Dihapus", description: `${name} dihapus dari daftar kasir` });
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat menghapus kasir", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Pilih Kasir yang Bertugas
          </DialogTitle>
          <DialogDescription>
            Nama kasir akan otomatis tercantum di setiap struk pesanan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Active cashier summary */}
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
            activeCashier
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-muted/50 border-border"
          }`}>
            {activeCashier ? (
              <>
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Kasir aktif sekarang</p>
                  <p className="font-bold text-sm truncate text-green-700 dark:text-green-400">{activeCashier.name}</p>
                </div>
                <button
                  onClick={() => handleSwitch(null)}
                  disabled={isSwitching}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  {switchingId === "clear" ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <UserX className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada kasir aktif</p>
              </>
            )}
          </div>

          {/* Cashier list */}
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : cashiers.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">
                Belum ada kasir. Tambahkan di bawah.
              </p>
            ) : (
              cashiers.map(cashier => {
                const isActive = activeCashier?.id === cashier.id;
                const isThisSwitching = switchingId === cashier.id;
                return (
                  <div
                    key={cashier.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted border-transparent hover:border-border"
                    }`}
                    onClick={() => !isActive && handleSwitch(cashier.id)}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {cashier.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium truncate">{cashier.name}</span>
                    {isThisSwitching ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : isActive ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cashier.id, cashier.name); }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0 opacity-50 hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add new cashier */}
          <form onSubmit={handleCreate} className="flex gap-2 pt-1 border-t">
            <Input
              placeholder="Nama kasir baru..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-9"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newName.trim() || createMutation.isPending}
              className="shrink-0"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
