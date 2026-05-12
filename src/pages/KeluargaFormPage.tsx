import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type KeluargaForm = {
  kode: string;
  nama_kepala_keluarga: string;
  alamat_keluarga: string;
  telp_keluarga: string;
  jumlah_anggota: string;
  id_puskesmas: string;
};

const EMPTY_FORM: KeluargaForm = {
  kode: "",
  nama_kepala_keluarga: "",
  alamat_keluarga: "",
  telp_keluarga: "",
  jumlah_anggota: "",
  id_puskesmas: "",
};

export default function KeluargaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isEdit = Boolean(id);
  const isAdminDinkes = role === "admin_dinkes";

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<KeluargaForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<KeluargaForm>>({});
  const [puskesmasOptions, setPuskesmasOptions] = useState<
    Array<{ id: string; nama: string }>
  >([]);

  useEffect(() => {
    if (!isAdminDinkes) return;

    const fetchPuskesmas = async () => {
      const { data } = await (supabase as any)
        .from("puskesmas")
        .select("id, nama_puskesmas")
        .order("nama_puskesmas", { ascending: true });
      setPuskesmasOptions(
        ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
          id: String(row.id ?? idx),
          nama: String(row.nama_puskesmas ?? `Puskesmas ${idx + 1}`),
        })),
      );
    };

    fetchPuskesmas();
  }, [isAdminDinkes]);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await (supabase as any)
          .from("keluarga")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (data) {
          setFormData({
            kode: String(data.kode ?? ""),
            nama_kepala_keluarga: String(data.nama_kepala_keluarga ?? ""),
            alamat_keluarga: String(data.alamat_keluarga ?? ""),
            telp_keluarga: String(data.telp_keluarga ?? ""),
            jumlah_anggota: String(data.jumlah_anggota ?? ""),
            id_puskesmas: String(data.id_puskesmas ?? ""),
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const set = (field: keyof KeluargaForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<KeluargaForm> = {};
    if (!formData.kode.trim()) e.kode = "Kode KK wajib diisi";
    if (!formData.nama_kepala_keluarga.trim()) e.nama_kepala_keluarga = "Nama kepala keluarga wajib diisi";
    if (!formData.alamat_keluarga.trim()) e.alamat_keluarga = "Alamat wajib diisi";
    if (!formData.jumlah_anggota.trim()) e.jumlah_anggota = "Jumlah anggota wajib diisi";
    if (isAdminDinkes && !formData.id_puskesmas) e.id_puskesmas = "Puskesmas wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const targetPuskesmasId = isAdminDinkes ? formData.id_puskesmas : user?.id_puskesmas;
    if (!user?.id || !targetPuskesmasId) return;

    setIsSubmitting(true);
    try {
      const payload = {
        kode: formData.kode.trim(),
        nama_kepala_keluarga: formData.nama_kepala_keluarga.trim(),
        alamat_keluarga: formData.alamat_keluarga.trim(),
        telp_keluarga: formData.telp_keluarga.trim() || null,
        jumlah_anggota: Number(formData.jumlah_anggota),
        id_puskesmas: targetPuskesmasId,
        created_by: user.id,
      };

      if (isEdit && id) {
        await (supabase as any).from("keluarga").update(payload).eq("id", id);
        toast.success("Data keluarga berhasil diperbarui");
        navigate(`/app/keluarga/${id}`);
      } else {
        await (supabase as any).from("keluarga").insert(payload);
        toast.success("Data keluarga berhasil disimpan");
        navigate("/app/keluarga");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(isEdit ? `/app/keluarga/${id}` : "/app/keluarga")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? "Edit Data Keluarga" : "Tambah Keluarga Baru"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit
            ? "Perbarui informasi keluarga di bawah ini"
            : "Isi data kepala keluarga untuk mendaftarkan keluarga baru"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-5">
        {isAdminDinkes && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Puskesmas <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.id_puskesmas}
              onChange={(e) => set("id_puskesmas", e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                errors.id_puskesmas ? "border-red-400" : "border-border"
              }`}
            >
              <option value="">Pilih puskesmas</option>
              {puskesmasOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama}
                </option>
              ))}
            </select>
            {errors.id_puskesmas && <p className="text-xs text-red-600 mt-1">{errors.id_puskesmas}</p>}
          </div>
        )}

        {/* Kode KK */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Kode KK <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: JNG-001"
            value={formData.kode}
            onChange={(e) => set("kode", e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.kode ? "border-red-400" : "border-border"
            }`}
          />
          {errors.kode && <p className="text-xs text-red-600 mt-1">{errors.kode}</p>}
        </div>

        {/* Nama Kepala */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nama Kepala Keluarga <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama_kepala_keluarga}
            onChange={(e) => set("nama_kepala_keluarga", e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.nama_kepala_keluarga ? "border-red-400" : "border-border"
            }`}
          />
          {errors.nama_kepala_keluarga && (
            <p className="text-xs text-red-600 mt-1">{errors.nama_kepala_keluarga}</p>
          )}
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Alamat <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.alamat_keluarga}
            onChange={(e) => set("alamat_keluarga", e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${
              errors.alamat_keluarga ? "border-red-400" : "border-border"
            }`}
          />
          {errors.alamat_keluarga && (
            <p className="text-xs text-red-600 mt-1">{errors.alamat_keluarga}</p>
          )}
        </div>

        {/* Telepon */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nomor Telepon</label>
          <input
            type="text"
            placeholder="08xx-xxxx-xxxx"
            value={formData.telp_keluarga}
            onChange={(e) => set("telp_keluarga", e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Jumlah Anggota */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Jumlah Anggota <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={formData.jumlah_anggota}
            onChange={(e) => set("jumlah_anggota", e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.jumlah_anggota ? "border-red-400" : "border-border"
            }`}
          />
          {errors.jumlah_anggota && (
            <p className="text-xs text-red-600 mt-1">{errors.jumlah_anggota}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/app/keluarga/${id}` : "/app/keluarga")}
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
            {isSubmitting && (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            )}
            {isSubmitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Keluarga"}
          </button>
        </div>
      </form>
    </div>
  );
}
