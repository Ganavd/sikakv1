import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicHeader from "@/components/PublicHeader";
import sikakLogo from "@/assets/sikak-logo.png";
import ponorogoLogo from "@/assets/ponorogo-logo.svg";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Silakan isi username/email dan password");
      return;
    }

    try {
      setIsLoading(true);
      await login(username, password);
      navigate("/app", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "Akun tidak aktif. Hubungi administrator.") setError(message);
      else if (message.includes("Username tidak ditemukan") || message.includes("salah"))
        setError("Username/email atau password salah");
      else setError("Gagal masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-800 to-cyan-500">
      <PublicHeader />
      <main className="px-4 py-8 md:py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 rounded-[28px] bg-white p-5 shadow-2xl md:grid-cols-[1fr_440px] md:p-8 lg:p-10">
          <section className="flex min-h-[620px] flex-col items-center justify-center text-center">
            <img src={ponorogoLogo} alt="Lambang Ponorogo" className="h-28 w-28 object-contain" />
            <img src={sikakLogo} alt="SIKAK" className="mt-8 h-44 w-44 object-contain md:h-56 md:w-56" />
            <h1 className="mt-6 text-4xl font-extrabold tracking-[0.28em] text-emerald-950 md:text-5xl">
              SIKAK
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Sistem Informasi Kartu Asuhan Keperawatan
            </p>
            <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate-600">
              SIKAK membantu Puskesmas di Kabupaten Ponorogo mencatat,
              mengelola, dan memantau asuhan keperawatan keluarga secara
              terintegrasi, akurat, dan mudah ditelusuri.
            </p>
          </section>

          <section className="flex items-center justify-center">
            <div className="w-full rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl md:p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-emerald-950">
                  Login Akun
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Masuk menggunakan akun petugas yang telah terdaftar.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nama Pengguna
                  </label>
                  <Input
                    type="text"
                    placeholder="Username atau email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-11 border-slate-300"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 border-slate-300 pr-10 focus-visible:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-700"
                      title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-emerald-700 to-cyan-500 font-bold hover:from-emerald-800 hover:to-cyan-600"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {isLoading ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <p className="mt-10 text-center text-xs text-slate-400">
                Didukung Pemerintah Kabupaten Ponorogo
              </p>
            </div>
          </section>
        </div>
        <p className="mt-6 text-center text-xs text-white/80">
          Copyright © 2026 Pemerintah Kabupaten Ponorogo
        </p>
      </main>
    </div>
  );
}
