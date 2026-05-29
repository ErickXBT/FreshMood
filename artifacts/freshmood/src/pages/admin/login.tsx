import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminLogin,
  useAdminRegister,
  useAdminForgotPassword,
  useAdminResetPassword,
} from "@workspace/api-client-react";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

type Mode = "login" | "register" | "forgot" | "otp";

export default function AdminLogin() {
  const [mode, setMode] = useState<Mode>("login");

  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot / OTP fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { login, isAuthenticated, getDefaultRoute } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useAdminLogin();
  const registerMutation = useAdminRegister();
  const forgotMutation = useAdminForgotPassword();
  const resetMutation = useAdminResetPassword();

  useEffect(() => {
    if (isAuthenticated) setLocation(getDefaultRoute());
  }, [isAuthenticated, setLocation, getDefaultRoute]);

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Username/email dan password wajib diisi", variant: "destructive" });
      return;
    }
    try {
      const result = await loginMutation.mutateAsync({ data: { username, password } });
      login({
        token: result.token,
        username: result.username,
        role: result.role,
        permissions: result.permissions,
        name: result.name,
      });
      toast({ title: "Berhasil", description: "Selamat datang kembali!" });
      setLocation(getDefaultRoute());
    } catch {
      toast({ title: "Login Gagal", description: "Username/email atau password salah", variant: "destructive" });
    }
  };

  // ── Register ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword || !regConfirm) {
      toast({ title: "Error", description: "Semua field wajib diisi", variant: "destructive" });
      return;
    }
    if (regPassword !== regConfirm) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    try {
      const result = await registerMutation.mutateAsync({
        data: { username: regUsername, email: regEmail, password: regPassword },
      });
      login({
        token: result.token,
        username: result.username,
        role: result.role,
        permissions: result.permissions,
        name: result.name,
      });
      toast({ title: "Akun dibuat!", description: "Selamat datang di FreshMood Admin" });
      setLocation(getDefaultRoute());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal membuat akun";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── Forgot Password ──
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast({ title: "Error", description: "Masukkan email akun kamu", variant: "destructive" });
      return;
    }
    try {
      await forgotMutation.mutateAsync({ data: { email: forgotEmail } });
      toast({ title: "Email terkirim!", description: "Cek inbox email kamu untuk kode OTP" });
      setMode("otp");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Email tidak ditemukan";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  // ── Reset Password ──
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast({ title: "Error", description: "Kode OTP dan password baru wajib diisi", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    try {
      await resetMutation.mutateAsync({ data: { email: forgotEmail, otp, newPassword } });
      toast({ title: "Password direset!", description: "Silakan login dengan password baru kamu" });
      setOtp("");
      setNewPassword("");
      setMode("login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Kode OTP tidak valid";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img src="/images/logo.png" alt="FreshMood" className="h-14 w-14 object-contain" />
          <h1 className="text-3xl font-bold text-primary">FreshMood</h1>
        </div>
        <p className="text-muted-foreground mt-2">Admin Portal</p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/50">

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <>
            <CardHeader>
              <CardTitle>Masuk</CardTitle>
              <CardDescription>Masukkan username/email dan password akun kamu</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username atau Email</label>
                  <Input
                    type="text"
                    placeholder="username atau email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
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
                <div className="text-right">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
                    onClick={() => setMode("forgot")}
                  >
                    Lupa password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Masuk...</>
                    : "Masuk"}
                </Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">atau</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMode("register")}
                >
                  Buat Akun Baru
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {/* ── REGISTER ── */}
        {mode === "register" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <CardTitle>Buat Akun</CardTitle>
                  <CardDescription className="mt-1">Daftarkan akun admin baru</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    type="text"
                    placeholder="contoh: admin_budi"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="email@kamu.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Digunakan untuk reset password jika lupa</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Konfirmasi Password</label>
                  <Input
                    type="password"
                    placeholder="Ulangi password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                  {registerMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Membuat Akun...</>
                    : "Buat Akun"}
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === "forgot" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <CardTitle>Lupa Password</CardTitle>
                  <CardDescription className="mt-1">Masukkan email yang terdaftar untuk menerima kode OTP</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="email@kamu.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
                    : "Kirim Kode OTP"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Kode akan dikirim ke inbox email kamu. Berlaku 10 menit.
                </p>
              </form>
            </CardContent>
          </>
        )}

        {/* ── ENTER OTP & NEW PASSWORD ── */}
        {mode === "otp" && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <CardTitle>Masukkan Kode OTP</CardTitle>
                  <CardDescription className="mt-1">
                    Kode dikirim ke <strong>{forgotEmail}</strong>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kode OTP (6 digit)</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest font-bold"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Baru</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                  {resetMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                    : "Reset Password"}
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
                  onClick={() => { setOtp(""); setMode("forgot"); }}
                >
                  Belum menerima kode? Kirim ulang
                </button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
