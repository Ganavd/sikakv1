import { useEffect, useState } from "react";
import { User, Info, Camera } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PengaturanPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil dan informasi akun Anda
        </p>
      </div>

      <ProfilSection />
      <TentangSikakSection />
    </div>
  );
}

function ProfilSection() {
  const { user } = useAuth();
  const [namaLengkap, setNamaLengkap] = useState(user?.fullname_users ?? "");
  const [email, setEmail] = useState(user?.email_users ?? "");
  const [telepon, setTelepon] = useState(user?.telepon ?? "");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem(`avatar_${user?.id}`);
    setAvatar(savedAvatar);
  }, [user?.id]);

  useEffect(() => {
    setNamaLengkap(user?.fullname_users ?? "");
    setEmail(user?.email_users ?? "");
    setTelepon(user?.telepon ?? "");
  }, [user?.fullname_users, user?.email_users, user?.telepon]);

  const initial = (namaLengkap.trim() || user?.fullname_users || user?.email_users || "U")
    .charAt(0)
    .toUpperCase();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem(`avatar_${user.id}`, base64);
      setAvatar(base64);
      toast.success("Foto profil berhasil diupload");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Data pengguna tidak ditemukan.");
      return;
    }

    if (!namaLengkap.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("users")
        .update({
          fullname_users: namaLengkap.trim(),
          email_users: email.trim().toLowerCase(),
          telepon: telepon.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui.");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-5">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        Profil Saya
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">{initial}</span>
            )}
          </div>
          <label htmlFor="avatar-upload">
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-label="Unggah foto profil"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement | null;
                input?.click();
              }}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow hover:opacity-90 cursor-pointer"
              title="Ganti foto profil"
            >
              <Camera className="h-3 w-3 text-primary-foreground" />
            </button>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">
            {namaLengkap.trim() || "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {email.trim() || "Belum ada email"}
          </p>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
            {user?.role_users?.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="fullname"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Nama Lengkap
          </label>
          <input
            id="fullname"
            type="text"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nama lengkap Anda"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Email Anda"
          />
        </div>

        <div>
          <label
            htmlFor="telepon"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Nomor Telepon
          </label>
          <input
            id="telepon"
            type="text"
            value={telepon}
            onChange={(e) => setTelepon(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nomor telepon Anda"
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={user?.username ?? ""}
            disabled
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Username hanya dapat diubah oleh Admin melalui menu Pengguna
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Untuk reset password, hubungi Admin atau Admin Puskesmas Anda
      </p>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}

function TentangSikakSection() {
  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        Tentang SIKAK
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nama Sistem</span>
          <span className="font-medium text-foreground">SIKAK 1.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kepanjangan</span>
          <span className="font-medium text-foreground text-right max-w-[60%]">
            Sistem Informasi Kartu Asuhan Keperawatan Keluarga
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Versi</span>
          <span className="font-medium text-foreground">1.0</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tim</span>
          <span className="font-medium text-foreground">Tim DoubleA</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Anggota</span>
          <span className="font-medium text-foreground text-right">
            Argana (Frontend) · Aurina (Backend)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kontak</span>
          <span className="font-medium text-foreground">
            contact@sikak.ponorogo.go.id
          </span>
        </div>
      </div>
    </div>
  );
}
