import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import {
  useListStaff,
  getListStaffQueryKey,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  type StaffAccount,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
  X,
  KeyRound,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const PERMISSIONS: { key: string; label: string; description: string }[] = [
  { key: "dashboard", label: "Dashboard", description: "Lihat ringkasan & laporan penjualan" },
  { key: "kasir", label: "Kasir", description: "Buat pesanan dari kasir" },
  { key: "orders", label: "Pesanan", description: "Lihat daftar pesanan" },
  { key: "cancel_transactions", label: "Batalkan Transaksi", description: "Membatalkan pesanan" },
  { key: "kitchen", label: "Dapur", description: "Layar dapur & proses pesanan" },
  { key: "menu", label: "Menu", description: "Kelola menu & kategori" },
  { key: "payments", label: "Pembayaran", description: "Lihat ringkasan pembayaran" },
  { key: "leaderboard", label: "Leaderboard", description: "Lihat papan peringkat" },
  { key: "employees", label: "Karyawan", description: "Kelola daftar kasir" },
  { key: "settings", label: "Pengaturan", description: "Ubah pengaturan toko" },
];

function PermissionToggles({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {PERMISSIONS.map((perm) => {
        const active = value.includes(perm.key);
        return (
          <button
            type="button"
            key={perm.key}
            onClick={() => toggle(perm.key)}
            className={`flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg border transition-all ${
              active
                ? "bg-primary/5 border-primary/40"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <span
              className={`mt-0.5 w-9 h-5 rounded-full relative shrink-0 transition-colors ${
                active ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  active ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{perm.label}</span>
              <span className="block text-xs text-muted-foreground">{perm.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function AdminStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: staff = [], isLoading } = useListStaff({
    query: { queryKey: getListStaffQueryKey() },
  });

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Edit state (access only)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Reset password state
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });

  const resetCreateForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setNewPermissions([]);
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast({ title: "Error", description: "Nama, email, dan password wajib diisi", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: {
          name: name.trim(),
          email: email.trim(),
          password,
          permissions: newPermissions,
        },
      });
      invalidate();
      resetCreateForm();
      toast({ title: "Staf ditambahkan", description: `${name.trim()} berhasil dibuat` });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Tidak dapat menambah staf";
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    }
  };

  const startEdit = (s: StaffAccount) => {
    setResetId(null);
    setEditingId(s.id);
    setEditName(s.name ?? "");
    setEditPermissions(s.permissions);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPermissions([]);
  };

  const startReset = (s: StaffAccount) => {
    setEditingId(null);
    setResetId(s.id);
    setResetPassword("");
    setShowResetPassword(false);
  };

  const cancelReset = () => {
    setResetId(null);
    setResetPassword("");
    setShowResetPassword(false);
  };

  const handleUpdate = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: editName.trim(),
          permissions: editPermissions,
        },
      });
      invalidate();
      cancelEdit();
      toast({ title: "Tersimpan", description: "Perubahan akses staf disimpan" });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Tidak dapat menyimpan perubahan";
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!resetPassword || resetPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        data: { password: resetPassword },
      });
      invalidate();
      cancelReset();
      toast({ title: "Password direset", description: "Password baru langsung berlaku" });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Tidak dapat mereset password";
      toast({ title: "Gagal", description: msg, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Hapus akun staf "${label}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      invalidate();
      toast({ title: "Dihapus", description: `${label} dihapus` });
    } catch {
      toast({ title: "Gagal", description: "Tidak dapat menghapus staf", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Akun Staf
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buat login untuk staf dan atur area mana saja yang boleh mereka akses
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Tambah Staf
            </Button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Staf Baru</CardTitle>
                <CardDescription>Isi data login dan centang area yang boleh diakses</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={resetCreateForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama</label>
                    <Input
                      placeholder="contoh: Budi"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email (untuk login)</label>
                    <Input
                      type="email"
                      placeholder="budi@toko.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hak Akses</label>
                  <PermissionToggles value={newPermissions} onChange={setNewPermissions} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending
                      ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Menyimpan...</>
                      : <><Plus className="w-4 h-4 mr-1" />Buat Akun</>}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetCreateForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Staff list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Staf ({staff.length})</CardTitle>
            <CardDescription>Pemilik selalu memiliki akses penuh dan tidak tampil di sini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada akun staf.</p>
                <p className="text-xs mt-1">Tambah staf dengan tombol di atas.</p>
              </div>
            ) : (
              staff.map((s) => {
                const isEditing = editingId === s.id;
                const isResetting = resetId === s.id;
                return (
                  <div key={s.id} className="rounded-xl border border-border">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 text-sm font-bold">
                        {(s.name ?? s.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.name ?? s.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {format(parseISO(s.createdAt), "d MMM yyyy")}
                      </span>
                      {!isEditing && !isResetting ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => startEdit(s)}>
                            Atur Akses
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => startReset(s)}>
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            Reset Password
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(s.id, s.name ?? s.email)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {!isEditing && !isResetting && (
                      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                        {s.permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Belum ada akses diberikan</span>
                        ) : (
                          s.permissions.map((p) => {
                            const label = PERMISSIONS.find((x) => x.key === p)?.label ?? p;
                            return (
                              <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Nama</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Hak Akses</label>
                          <PermissionToggles value={editPermissions} onChange={setEditPermissions} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(s.id)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending
                              ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Menyimpan...</>
                              : <><Save className="w-4 h-4 mr-1" />Simpan</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}

                    {isResetting && (
                      <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Password Baru</label>
                          <div className="relative">
                            <Input
                              type={showResetPassword ? "text" : "password"}
                              placeholder="Minimal 6 karakter"
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              className="pr-10"
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
                          <p className="text-xs text-muted-foreground">
                            Password baru langsung berlaku. Beritahu {s.name ?? s.email} untuk login dengan password ini.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleResetPassword(s.id)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending
                              ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Menyimpan...</>
                              : <><KeyRound className="w-4 h-4 mr-1" />Simpan Password</>}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelReset}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Cara Kerja</p>
          <p>• Staf login memakai <strong>email</strong> dan password yang kamu buat di sini</p>
          <p>• Lupa password? Pakai <strong>Reset Password</strong> untuk membuat password baru yang langsung berlaku</p>
          <p>• Mereka hanya melihat menu samping untuk area yang diizinkan</p>
          <p>• Pemilik (owner) selalu punya akses penuh ke semua area</p>
        </div>
      </div>
    </AdminLayout>
  );
}
