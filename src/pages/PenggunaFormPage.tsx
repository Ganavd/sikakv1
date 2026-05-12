import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RegisterRole = "user_du" | "user_poli" | "admin_puskesmas";

type Option = {
  id: string;
  nama: string;
};

const ROLE_OPTIONS: Array<{
  value: RegisterRole;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    value: "user_du",
    label: "Petugas Daftar Umum",
    description: "Mengelola data keluarga dan daftar masuk pasien.",
    icon: UserRound,
  },
  {
    value: "user_poli",
    label: "Petugas Poli",
    description: "Mengisi kartu asuhan dan catatan pelayanan poli.",
    icon: Stethoscope,
  },
  {
    value: "admin_puskesmas",
    label: "Admin Puskesmas",
    description: "Mengatur pengguna dan data operasional puskesmas.",
    icon: ShieldCheck,
  },
];

const EMPTY_FORM = {
  fullname_users: "",
  username: "",
  email_users: "",
  telepon: "",
  password: "",
  confirmPassword: "",
  id_puskesmas: "",
  id_poli: "",
};

export default function PenggunaFormPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();
  const initialRole = searchParams.get("role") as RegisterRole | null;
  const [selectedRole, setSelectedRole] = useState<RegisterRole | "">(
    isValidRole(initialRole) ? initialRole : "",
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [puskesmasOptions, setPuskesmasOptions] = useState<Option[]>([]);
  const [poliOptions, setPoliOptions] = useState<Option[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isAdminDinkes = role === "admin_dinkes";
  const isAdminPuskesmas = role === "admin_puskesmas";

  const allowedRoles = useMemo(() => {
    if (isAdminDinkes) return ROLE_OPTIONS;
    if (isAdminPuskesmas)
      return ROLE_OPTIONS.filter((item) => item.value !== "admin_puskesmas");
    return [];
  }, [isAdminDinkes, isAdminPuskesmas]);

  const selectedRoleMeta = ROLE_OPTIONS.find(
    (item) => item.value === selectedRole,
  );
  const selectedPuskesmasId = isAdminDinkes
    ? form.id_puskesmas
    : (user?.id_puskesmas ?? "");

  useEffect(() => {
    if (
      selectedRole &&
      !allowedRoles.some((item) => item.value === selectedRole)
    ) {
      setSelectedRole("");
    }
  }, [allowedRoles, selectedRole]);

  useEffect(() => {
    const fetchPuskesmas = async () => {
      if (!isAdminDinkes) {
        setIsLoadingOptions(false);
        return;
      }

      setIsLoadingOptions(true);
      try {
        const { data, error } = await (supabase as any)
          .from("puskesmas")
          .select("*")
          .order("nama_puskesmas", { ascending: true });
        if (error) throw error;
        setPuskesmasOptions(
          ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
            id: String(row.id ?? idx),
            nama: String(
              row.nama_puskesmas ?? row.nama ?? `Puskesmas ${idx + 1}`,
            ),
          })),
        );
      } catch (err: any) {
        toast.error(err?.message ?? "Gagal memuat puskesmas");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchPuskesmas();
  }, [isAdminDinkes]);

  useEffect(() => {
    const fetchPoli = async () => {
      if (selectedRole !== "user_poli" || !selectedPuskesmasId) {
        setPoliOptions([]);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("poli")
        .select("id, nama_poli")
        .eq("id_puskesmas", selectedPuskesmasId)
        .order("nama_poli", { ascending: true });
      if (error) {
        toast.error(error.message ?? "Gagal memuat poli");
        setPoliOptions([]);
        return;
      }
      setPoliOptions(
        ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
          id: String(row.id ?? idx),
          nama: String(row.nama_poli ?? "-"),
        })),
      );
    };

    fetchPoli();
  }, [selectedPuskesmasId, selectedRole]);

  const chooseRole = (nextRole: RegisterRole) => {
    setSelectedRole(nextRole);
    setSearchParams({ role: nextRole });
    setErrors({});
    setForm((prev) => ({
      ...prev,
      id_poli: "",
      id_puskesmas:
        isAdminDinkes && nextRole ? prev.id_puskesmas : (user?.id_puskesmas ?? ""),
    }));
  };

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "id_puskesmas") {
      setForm((prev) => ({ ...prev, id_puskesmas: value, id_poli: "" }));
    }
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedRole) nextErrors.role = "Pilih jenis pengguna terlebih dahulu";
    if (!form.fullname_users.trim())
      nextErrors.fullname_users = "Nama lengkap wajib diisi";
    if (!form.username.trim()) nextErrors.username = "Username wajib diisi";
    if (!form.email_users.trim())
      nextErrors.email_users = "Email wajib diisi untuk membuat akun";
    if (!form.password) nextErrors.password = "Password wajib diisi";
    else if (form.password.length < 6)
      nextErrors.password = "Password minimal 6 karakter";
    if (!form.confirmPassword)
      nextErrors.confirmPassword = "Konfirmasi password wajib diisi";
    else if (form.password !== form.confirmPassword)
      nextErrors.confirmPassword = "Konfirmasi password harus sama";
    if (isAdminDinkes && !form.id_puskesmas)
      nextErrors.id_puskesmas = "Puskesmas wajib dipilih";
    if (selectedRole === "user_poli" && !form.id_poli)
      nextErrors.id_poli = "Poli tujuan wajib dipilih";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !validate() || !selectedRole) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("create_app_user", {
        p_email: form.email_users.trim(),
        p_password: form.password,
        p_fullname: form.fullname_users.trim(),
        p_username: form.username.trim(),
        p_role: selectedRole,
        p_id_puskesmas: selectedPuskesmasId || null,
        p_id_poli: selectedRole === "user_poli" ? form.id_poli || null : null,
        p_telepon: form.telepon.trim() || null,
      });

      if (error) throw error;
      if (data && !data.success)
        throw new Error(data.error ?? "Gagal membuat pengguna");

      toast.success("Pengguna berhasil didaftarkan");
      navigate("/app/pengguna");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal mendaftarkan pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate("/app/pengguna")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Manajemen Pengguna
      </button>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Tambah Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Buat akun baru sesuai peran dan penempatan layanan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              Jenis Pengguna
            </p>
            <div className="space-y-2">
              {allowedRoles.map((item) => {
                const Icon = item.icon;
                const active = selectedRole === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => chooseRole(item.value)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {item.label}
                          </span>
                          {active && <Check className="h-4 w-4 text-primary" />}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-xs text-red-600 mt-2">{errors.role}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-foreground">
              {selectedRoleMeta?.label ?? "Belum memilih role"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {selectedRoleMeta?.description ??
                "Pilih role di atas untuk menyesuaikan field form."}
            </p>
          </div>
        </aside>

        <section className="rounded-lg border border-border bg-card p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdminDinkes && (
              <FormField
                label="Puskesmas"
                required
                error={errors.id_puskesmas}
              >
                <select
                  value={form.id_puskesmas}
                  onChange={(e) => setField("id_puskesmas", e.target.value)}
                  className={inputClass(errors.id_puskesmas)}
                  disabled={isLoadingOptions}
                >
                  <option value="">
                    {isLoadingOptions ? "Memuat puskesmas..." : "Pilih puskesmas"}
                  </option>
                  {puskesmasOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {!isAdminDinkes && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Puskesmas akun mengikuti puskesmas admin yang sedang login.
                </span>
              </div>
            )}

            {selectedRole === "user_poli" && (
              <FormField label="Poli Tujuan" required error={errors.id_poli}>
                <select
                  value={form.id_poli}
                  onChange={(e) => setField("id_poli", e.target.value)}
                  className={inputClass(errors.id_poli)}
                  disabled={!selectedPuskesmasId}
                >
                  <option value="">
                    {!selectedPuskesmasId
                      ? "Pilih puskesmas dulu"
                      : "Pilih poli"}
                  </option>
                  {poliOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
                {selectedPuskesmasId && poliOptions.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    Belum ada poli untuk puskesmas ini.
                  </p>
                )}
              </FormField>
            )}
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="text-base font-semibold text-foreground">
              Informasi Akun
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nama Lengkap"
                required
                error={errors.fullname_users}
              >
                <input
                  type="text"
                  value={form.fullname_users}
                  onChange={(e) => setField("fullname_users", e.target.value)}
                  className={inputClass(errors.fullname_users)}
                  placeholder="Nama petugas"
                />
              </FormField>

              <FormField label="Username" required error={errors.username}>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  className={inputClass(errors.username)}
                  placeholder="username_login"
                />
              </FormField>

              <FormField label="Email" required error={errors.email_users}>
                <input
                  type="email"
                  value={form.email_users}
                  onChange={(e) => setField("email_users", e.target.value)}
                  className={inputClass(errors.email_users)}
                  placeholder="nama@contoh.com"
                />
              </FormField>

              <FormField label="Telepon" error={errors.telepon}>
                <input
                  type="text"
                  value={form.telepon}
                  onChange={(e) => setField("telepon", e.target.value)}
                  className={inputClass(errors.telepon)}
                  placeholder="08xx-xxxx-xxxx"
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="text-base font-semibold text-foreground">
              Password
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Password" required error={errors.password}>
                <PasswordInput
                  value={form.password}
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  onChange={(value) => setField("password", value)}
                  error={errors.password}
                />
              </FormField>

              <FormField
                label="Konfirmasi Password"
                required
                error={errors.confirmPassword}
              >
                <PasswordInput
                  value={form.confirmPassword}
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  onChange={(value) => setField("confirmPassword", value)}
                  error={errors.confirmPassword}
                />
              </FormField>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => navigate("/app/pengguna")}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Daftarkan Pengguna
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function isValidRole(value: string | null): value is RegisterRole {
  return (
    value === "user_du" ||
    value === "user_poli" ||
    value === "admin_puskesmas"
  );
}

function inputClass(error?: string) {
  return `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
    error ? "border-red-400" : "border-border"
  }`;
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function PasswordInput({
  value,
  visible,
  error,
  onChange,
  onToggle,
}: {
  value: string;
  visible: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(error)} pr-11`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-1.5 inline-flex w-8 items-center justify-center text-muted-foreground hover:text-foreground"
        title={visible ? "Sembunyikan password" : "Tampilkan password"}
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
