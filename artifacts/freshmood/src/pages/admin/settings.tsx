import { useState } from "react";
import AdminLayout from "@/components/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useAdminResetData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Settings,
  Moon,
  Sun,
  User,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminSettings() {
  const { username, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Reset dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const resetMutation = useAdminResetData();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword) {
      toast({ title: "Error", description: "Masukkan password untuk konfirmasi", variant: "destructive" });
      return;
    }
    try {
      const result = await resetMutation.mutateAsync({ data: { password: resetPassword } });
      setDeletedCount(result.deletedOrders);
      setResetDone(true);
      setResetPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "Password salah atau terjadi kesalahan";
      toast({ title: "Reset Gagal", description: msg, variant: "destructive" });
    }
  };

  const closeResetDialog = () => {
    setShowResetDialog(false);
    setResetPassword("");
    setResetDone(false);
    setShowResetPassword(false);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola preferensi dan data akun admin</p>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/60">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="font-semibold">{username}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Aktif
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Tampilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mode Tampilan</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saat ini: {theme === "dark" ? "Mode Gelap" : "Mode Terang"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Terang
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Gelap
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-4 h-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Tindakan di sini bersifat permanen dan tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-destructive">Reset Semua Data Penjualan</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Menghapus seluruh riwayat order, item, dan pembayaran. Menu dan kategori tidak akan terpengaruh.
                    Data yang dihapus <strong>tidak bisa dipulihkan</strong>.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowResetDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset Data Penjualan
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── RESET CONFIRMATION DIALOG ── */}
      <Dialog open={showResetDialog} onOpenChange={(open) => { if (!open) closeResetDialog(); }}>
        <DialogContent className="max-w-md">
          {!resetDone ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Konfirmasi Reset Data
                </DialogTitle>
                <DialogDescription>
                  Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>

              {/* Warning box */}
              <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Peringatan! Data berikut akan DIHAPUS PERMANEN:
                </div>
                <ul className="text-sm text-destructive/80 space-y-1 ml-6 list-disc">
                  <li>Seluruh riwayat order</li>
                  <li>Seluruh item dalam setiap order</li>
                  <li>Seluruh data pembayaran</li>
                  <li>Data leaderboard & analytics</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-1 border-t border-destructive/20">
                  Menu, kategori, dan akun admin <span className="font-semibold text-foreground">tidak akan</span> terpengaruh.
                </p>
              </div>

              {/* Password confirmation */}
              <form onSubmit={handleResetData} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Masukkan password kamu untuk konfirmasi
                  </label>
                  <div className="relative">
                    <Input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Password akun kamu"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="pr-10 border-destructive/40 focus-visible:ring-destructive"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={closeResetDialog}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="flex-1"
                    disabled={!resetPassword || resetMutation.isPending}
                  >
                    {resetMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mereset...</>
                    ) : (
                      <><Trash2 className="w-4 h-4 mr-2" />Ya, Hapus Semua Data</>
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Data Berhasil Direset</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {deletedCount} order telah dihapus. Dashboard sekarang fresh dan siap untuk data baru.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  closeResetDialog();
                  setLocation("/admin/dashboard");
                }}
              >
                Ke Dashboard
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
