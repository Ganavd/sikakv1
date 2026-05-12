import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserItem = {
  id: string;
  nama: string;
  username: string;
  email: string;
  telepon: string;
  role: string;
  puskesmas: string;
  isActive: boolean;
  id_puskesmas: string;
  id_poli: string;
};

type ModalRole = "user_du" | "user_poli" | "admin_puskesmas";
type ModalMode = "register" | "edit" | "reset" | null;

export default function PenggunaPage() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [hasPuskesmas, setHasPuskesmas] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalMode>(null);
  const [registerRole, setRegisterRole] = useState<ModalRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [poliOptions, setPoliOptions] = useState<
    Array<{ id: string; nama: string }>
  >([]);
  const [puskesmasOptions, setPuskesmasOptions] = useState<
    Array<{ id: string; nama: string }>
  >([]);

  const [form, setForm] = useState({
    fullname_users: "",
    username: "",
    email_users: "",
    telepon: "",
    password: "",
    confirmPassword: "",
    id_poli: "",
    id_puskesmas: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);

  const isAdminDinkes = role === "admin_dinkes";
  const isAdminPuskesmas = role === "admin_puskesmas";

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (isAdminDinkes) {
        const { count } = await (supabase as any)
          .from("puskesmas")
          .select("id", { count: "exact", head: true });
        setHasPuskesmas((count ?? 0) > 0);
      }

      let query = (supabase as any)
        .from("users")
        .select("*, puskesmas(nama_puskesmas)")
  .order("fullname_users", { ascending: true });
      if (isAdminPuskesmas && user?.id_puskesmas) {
        query = query.eq("id_puskesmas", user.id_puskesmas);
      }

      const { data } = await query;
      const mapped: UserItem[] = (
        (data ?? []) as Array<Record<string, unknown>>
      ).map((row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.fullname_users ?? "-"),
        username: String(row.username ?? ""),
        email: String(row.email_users ?? "-"),
        telepon: String(row.telepon ?? ""),
        role: String(row.role_users ?? "-"),
        puskesmas: String((row.puskesmas as any)?.nama_puskesmas ?? "-"),
        isActive: Boolean(row.is_active),
        id_puskesmas: String(row.id_puskesmas ?? ""),
        id_poli: String(row.id_poli ?? ""),
      }));
      setUsers(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdminPuskesmas, user?.id_puskesmas]);

  // ── Options ───────────────────────────────────────────────────────────────

  const fetchPuskesmasOptions = async () => {
    const { data } = await (supabase as any)
      .from("puskesmas")
      .select("*")
      .order("nama_puskesmas", { ascending: true });
    setPuskesmasOptions(
      ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.nama_puskesmas ?? row.nama ?? `Puskesmas ${idx + 1}`),
      })),
    );
  };

  const fetchPoliOptions = async (puskesmasId?: string) => {
    let query = (supabase as any)
      .from("poli")
      .select("id, nama_poli")
      .order("nama_poli", { ascending: true });
    if (puskesmasId) query = query.eq("id_puskesmas", puskesmasId);
    const { data } = await query;
    setPoliOptions(
      ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.nama_poli ?? "-"),
      })),
    );
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openRegisterModal = async (nextRole: ModalRole) => {
    if (isAdminDinkes && !hasPuskesmas) {
      toast.warning(
        "Belum ada data puskesmas. Tambahkan puskesmas di menu Puskesmas terlebih dahulu.",
      );
      return;
    }
    setActiveModal("register");
    setRegisterRole(nextRole);
    setSelectedUser(null);
    setForm({
      fullname_users: "",
      username: "",
      email_users: "",
      telepon: "",
      password: "",
      confirmPassword: "",
      id_poli: "",
      id_puskesmas:
        nextRole === "admin_puskesmas" ? "" : (user?.id_puskesmas ?? ""),
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (nextRole === "user_poli")
      await fetchPoliOptions(user?.id_puskesmas ?? undefined);
    else setPoliOptions([]);
    if (nextRole === "admin_puskesmas") await fetchPuskesmasOptions();
    else setPuskesmasOptions([]);
  };

  const openEditModal = async (item: UserItem) => {
    setActiveModal("edit");
    setSelectedUser(item);
    setRegisterRole(null);
    setForm({
      fullname_users: item.nama,
      username: item.username,
      email_users: item.email === "-" ? "" : item.email,
      telepon: item.telepon,
      password: "",
      confirmPassword: "",
      id_poli: item.id_poli,
      id_puskesmas: item.id_puskesmas,
    });
    setErrors({});
    if (item.role === "user_poli")
      await fetchPoliOptions(item.id_puskesmas || undefined);
    else setPoliOptions([]);
  };

  const openResetModal = (item: UserItem) => {
    setActiveModal("reset");
    setSelectedUser(item);
    setRegisterRole(null);
    setForm({
      fullname_users: "",
      username: "",
      email_users: "",
      telepon: "",
      password: "",
      confirmPassword: "",
      id_poli: "",
      id_puskesmas: "",
    });
    setErrors({});
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  };

  const closeModal = () => {
    setActiveModal(null);
    setRegisterRole(null);
    setSelectedUser(null);
    setErrors({});
    setPoliOptions([]);
    setPuskesmasOptions([]);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  };

  // ── Labels ────────────────────────────────────────────────────────────────

  const getRoleLabel = (r: string) => {
    if (r === "user_du") return "Petugas Daftar Umum";
    if (r === "user_poli") return "Petugas Poli";
    if (r === "admin_puskesmas") return "Admin Puskesmas";
    if (r === "admin_dinkes") return "Admin Dinkes";
    return r;
  };

  const getModalTitle = () => {
    if (activeModal === "edit") return "Edit Pengguna";
    if (activeModal === "reset")
      return `Reset Password — ${selectedUser?.nama ?? ""}`;
    if (registerRole === "user_du") return "Daftarkan Petugas Daftar Umum";
    if (registerRole === "user_poli") return "Daftarkan Petugas Poli";
    return "Daftarkan Admin Puskesmas";
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateRegister = () => {
    const e: Record<string, string> = {};
    if (!form.fullname_users.trim())
      e.fullname_users = "Nama lengkap wajib diisi";
    if (!form.username.trim()) e.username = "Username wajib diisi";
    if (!form.password) e.password = "Password wajib diisi";
    else if (form.password.length < 6)
      e.password = "Password minimal 6 karakter";
    if (!form.confirmPassword)
      e.confirmPassword = "Konfirmasi password wajib diisi";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Konfirmasi password harus sama";
    if (registerRole === "user_poli" && !form.id_poli)
      e.id_poli = "Poli tujuan wajib dipilih";
    if (registerRole === "admin_puskesmas" && !form.id_puskesmas)
      e.id_puskesmas = "Puskesmas wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateEdit = () => {
    const e: Record<string, string> = {};
    if (!form.fullname_users.trim())
      e.fullname_users = "Nama lengkap wajib diisi";
    if (!form.username.trim()) e.username = "Username wajib diisi";
    if (selectedUser?.role === "user_poli" && !form.id_poli)
      e.id_poli = "Poli tujuan wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateReset = () => {
    const e: Record<string, string> = {};
    if (!form.password) e.password = "Password baru wajib diisi";
    else if (form.password.length < 6)
      e.password = "Password minimal 6 karakter";
    if (!form.confirmPassword)
      e.confirmPassword = "Konfirmasi password wajib diisi";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Konfirmasi password harus sama";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

 const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!registerRole || !user?.id || !validateRegister()) return;

  if (!form.email_users.trim()) {
    setErrors((prev) => ({
      ...prev,
      email_users: "Email wajib diisi untuk membuat akun",
    }));
    return;
  }

  setIsSubmitting(true);
  try {
    const { data, error } = await (supabase as any).rpc("create_app_user", {
      p_email: form.email_users.trim(),
      p_password: form.password,
      p_fullname: form.fullname_users.trim(),
      p_username: form.username.trim(),
      p_role: registerRole,
      p_id_puskesmas:
        registerRole === "admin_puskesmas"
          ? form.id_puskesmas || null
          : user?.id_puskesmas || null,
      p_id_poli: registerRole === "user_poli" ? form.id_poli || null : null,
      p_telepon: form.telepon.trim() || null,
    });

    if (error) throw error;
    if (data && !data.success)
      throw new Error(data.error ?? "Gagal membuat pengguna");

    closeModal();
    await fetchUsers();
    toast.success("Pengguna berhasil didaftarkan");
  } catch (err: any) {
    toast.error(err?.message ?? "Gagal mendaftarkan pengguna");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !validateEdit()) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullname_users: form.fullname_users.trim(),
        username: form.username.trim(),
        email_users: form.email_users.trim() || null,
        telepon: form.telepon.trim() || null,
      };
      if (selectedUser.role === "user_poli")
        payload.id_poli = form.id_poli || null;
      await (supabase as any)
        .from("users")
        .update(payload)
        .eq("id", selectedUser.id);
      closeModal();
      await fetchUsers();
      toast.success("Perubahan pengguna berhasil disimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !validateReset()) return;
    setIsSubmitting(true);
    try {
const { data, error } = await (supabase as any).rpc("reset_user_password", {
  p_user_id: selectedUser.id,
  p_password: form.password,
});
if (error) throw error;
if (data && !data.success)
  throw new Error(data.error ?? "Gagal reset password");
      if (error) throw error;

      closeModal();
      toast.success("Password berhasil direset.");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal mereset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: UserItem) => {
    const action = item.isActive ? "nonaktifkan" : "aktifkan";
    if (!window.confirm(`Yakin ${action} pengguna ini?`)) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc(
        "toggle_user_active",
        {
          p_user_id: item.id,
          p_is_active: !item.isActive,
        },
      );
      if (error) throw error;
      if (data && !data.success)
        throw new Error(data.error ?? "Gagal update status");

      await fetchUsers();
      toast.success(
        `Pengguna berhasil ${item.isActive ? "dinonaktifkan" : "diaktifkan"}`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal update status pengguna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (item: UserItem) => {
    if (
      !window.confirm(
        "Yakin hapus pengguna ini? Tindakan tidak bisa dibatalkan.",
      )
    )
      return;
    setIsSubmitting(true);
    try {
      await (supabase as any).from("users").delete().eq("id", item.id);
      await fetchUsers();
      toast.success("Pengguna berhasil dihapus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionButtons = useMemo(() => {
    if (isAdminDinkes) return ["+ User DU", "+ User Poli", "+ Admin Puskesmas"];
    if (isAdminPuskesmas) return ["+ User DU", "+ User Poli"];
    return [];
  }, [isAdminDinkes, isAdminPuskesmas]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Manajemen Pengguna
        </h1>
        <div className="flex flex-wrap gap-2">
          {actionButtons.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                navigate(
                  `/app/pengguna/baru?role=${
                    label.includes("Admin Puskesmas")
                      ? "admin_puskesmas"
                      : label.includes("User Poli")
                        ? "user_poli"
                        : "user_du"
                  }`,
                )
              }
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Warning puskesmas belum ada */}
      {isAdminDinkes && !hasPuskesmas && !isLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ Belum ada data puskesmas. Tambahkan puskesmas di menu{" "}
          <strong>Puskesmas</strong> sebelum mendaftarkan pengguna.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data pengguna...
        </div>
      ) : users.length === 0 ? (
        <div className="text-sm text-muted-foreground">Belum ada pengguna</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-foreground">
                  Nama
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Role
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Puskesmas
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {item.nama}
                  </td>
                  <td className="px-4 py-3 text-foreground">{item.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                        item.role.includes("admin")
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : item.role === "user_du"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {getRoleLabel(item.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {item.puskesmas}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${
                        item.isActive
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.isActive ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openResetModal(item)}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Reset Password
                      </button>
                      {isAdminDinkes && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                          >
                            {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item)}
                            className="rounded border border-red-200 text-red-600 px-2 py-1 text-xs hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
              <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  {getModalTitle()}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>

              <form
                onSubmit={
                  activeModal === "register"
                    ? handleRegister
                    : activeModal === "edit"
                      ? handleEdit
                      : handleResetPassword
                }
                className="p-5 space-y-4"
              >
                {/* REGISTER */}
                {activeModal === "register" && registerRole && (
                  <>
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                      {registerRole === "admin_puskesmas"
                        ? "Pastikan data puskesmas sudah ditambahkan di menu Puskesmas sebelum mendaftarkan."
                        : registerRole === "user_du"
                          ? "Pastikan data puskesmas sudah lengkap sebelum mendaftarkan pengguna."
                          : "Pastikan data poli sudah ditambahkan sebelum mendaftarkan pengguna."}
                    </div>

                    {registerRole === "admin_puskesmas" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Pilih Puskesmas*
                        </label>
                        <select
                          value={form.id_puskesmas}
                          onChange={(e) =>
                            setField("id_puskesmas", e.target.value)
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Pilih puskesmas</option>
                          {puskesmasOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                        {errors.id_puskesmas && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.id_puskesmas}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={getRoleLabel(registerRole)}
                        disabled
                        className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                      />
                    </div>

                    {registerRole === "user_poli" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Pilih Poli*
                        </label>
                        {poliOptions.length === 0 ? (
                          <p className="text-xs text-red-600 mt-1">
                            Belum ada poli. Tambah poli dulu di menu Puskesmas.
                          </p>
                        ) : (
                          <select
                            value={form.id_poli}
                            onChange={(e) =>
                              setField("id_poli", e.target.value)
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Pilih poli</option>
                            {poliOptions.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nama}
                              </option>
                            ))}
                          </select>
                        )}
                        {errors.id_poli && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.id_poli}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Nama Lengkap*
                      </label>
                      <input
                        type="text"
                        value={form.fullname_users}
                        onChange={(e) =>
                          setField("fullname_users", e.target.value)
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      {errors.fullname_users && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.fullname_users}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Username*
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setField("username", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Digunakan untuk login
                      </p>
                      {errors.username && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email*
                      </label>
                      <input
                        type="email"
                        value={form.email_users}
                        onChange={(e) =>
                          setField("email_users", e.target.value)
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="email@contoh.com"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email dipakai untuk login dan reset password
                      </p>
                      {errors.email_users && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.email_users}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Telepon{" "}
                        <span className="font-normal text-muted-foreground">
                          (opsional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={form.telepon}
                        onChange={(e) => setField("telepon", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setField("password", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute inset-y-0 right-2 flex items-center text-xs text-primary font-medium"
                        >
                          {showPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Konfirmasi Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) =>
                            setField("confirmPassword", e.target.value)
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute inset-y-0 right-2 flex items-center text-xs text-primary font-medium"
                        >
                          {showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* RESET */}
                {activeModal === "reset" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Password Baru*
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setField("password", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword((p) => !p)}
                          className="absolute inset-y-0 right-2 flex items-center text-xs text-primary font-medium"
                        >
                          {showResetPassword ? "Sembunyikan" : "Tampilkan"}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Konfirmasi Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showResetConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) =>
                            setField("confirmPassword", e.target.value)
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPassword((p) => !p)}
                          className="absolute inset-y-0 right-2 flex items-center text-xs text-primary font-medium"
                        >
                          {showResetConfirmPassword
                            ? "Sembunyikan"
                            : "Tampilkan"}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* EDIT */}
                {activeModal === "edit" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Nama Lengkap*
                      </label>
                      <input
                        type="text"
                        value={form.fullname_users}
                        onChange={(e) =>
                          setField("fullname_users", e.target.value)
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      {errors.fullname_users && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.fullname_users}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Username*
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setField("username", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Digunakan untuk login
                      </p>
                      {errors.username && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.username}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email{" "}
                        <span className="font-normal text-muted-foreground">
                          (opsional)
                        </span>
                      </label>
                      <input
                        type="email"
                        value={form.email_users}
                        onChange={(e) =>
                          setField("email_users", e.target.value)
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Telepon{" "}
                        <span className="font-normal text-muted-foreground">
                          (opsional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={form.telepon}
                        onChange={(e) => setField("telepon", e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    {selectedUser?.role === "user_poli" && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Poli Tujuan
                        </label>
                        <select
                          value={form.id_poli}
                          onChange={(e) => setField("id_poli", e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Pilih poli</option>
                          {poliOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nama}
                            </option>
                          ))}
                        </select>
                        {errors.id_poli && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors.id_poli}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-60"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
                  >
                    {isSubmitting && (
                      <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    )}
                    {activeModal === "edit"
                      ? "Simpan Perubahan"
                      : activeModal === "reset"
                        ? "Simpan"
                        : "Daftarkan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
