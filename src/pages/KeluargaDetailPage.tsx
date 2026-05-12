import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type KeluargaDetail = {
  id: string;
  kodeKK: string;
  namaKepala: string;
  alamat: string;
  telepon: string;
  jumlahAnggota: number;
};

type AnggotaItem = {
  id: string;
  nama: string;
  hubungan: string;
  urutan: number;
};

type AnggotaForm = {
  nama: string;
  hubungan: string;
  urutan: string;
};

export default function KeluargaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canManage = role !== "user_poli";

  const [isLoading, setIsLoading] = useState(true);
  const [keluarga, setKeluarga] = useState<KeluargaDetail | null>(null);
  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>([]);
  const [isAnggotaLoading, setIsAnggotaLoading] = useState(false);

  // Tambah anggota form
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<AnggotaForm>({ nama: "", hubungan: "", urutan: "" });
  const [errors, setErrors] = useState<Partial<AnggotaForm>>({});

  const fetchKeluarga = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("keluarga")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setKeluarga({
          id: String(data.id),
          kodeKK: String(data.kode ?? "-"),
          namaKepala: String(data.nama_kepala_keluarga ?? "-"),
          alamat: String(data.alamat_keluarga ?? "-"),
          telepon: String(data.telp_keluarga ?? "-"),
          jumlahAnggota: Number(data.jumlah_anggota ?? 0),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnggota = async () => {
    if (!id) return;
    setIsAnggotaLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("anggota_keluarga")
        .select("*")
        .eq("id_keluarga", id)
        .order("urutan", { ascending: true });

      const mapped: AnggotaItem[] = ((data ?? []) as Array<Record<string, unknown>>).map(
        (row, index) => ({
          id: String(row.id ?? index),
          nama: String(row.nama ?? "-"),
          hubungan: String(row.hubungan ?? "-"),
          urutan: Number(row.urutan ?? index + 1),
        }),
      );
      setAnggotaList(mapped);
    } finally {
      setIsAnggotaLoading(false);
    }
  };

  useEffect(() => {
    fetchKeluarga();
    fetchAnggota();
  }, [id]);

  const validateForm = () => {
    const e: Partial<AnggotaForm> = {};
    if (!form.nama.trim()) e.nama = "Nama wajib diisi";
    if (!form.hubungan.trim()) e.hubungan = "Hubungan wajib dipilih";
    if (!form.urutan.trim()) e.urutan = "Urutan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await (supabase as any).from("anggota_keluarga").insert({
        id_keluarga: id,
        nama: form.nama.trim(),
        hubungan: form.hubungan,
        urutan: Number(form.urutan),
      });
      toast.success("Anggota keluarga berhasil ditambahkan");
      setShowForm(false);
      setForm({ nama: "", hubungan: "", urutan: "" });
      await fetchAnggota();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnggota = async (anggotaId: string) => {
    if (!window.confirm("Hapus anggota ini?")) return;
    try {
      await (supabase as any).from("anggota_keluarga").delete().eq("id", anggotaId);
      toast.success("Anggota dihapus");
      await fetchAnggota();
    } catch {
      toast.error("Gagal menghapus anggota");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!keluarga) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Data keluarga tidak ditemukan</p>
        <button
          type="button"
          onClick={() => navigate("/app/keluarga")}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/app/keluarga")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground -ml-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Data Keluarga
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{keluarga.namaKepala}</h1>
          <span className="inline-flex mt-1 rounded-full bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-0.5 text-xs font-medium">
            {keluarga.kodeKK}
          </span>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => navigate(`/app/keluarga/${id}/edit`)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-border bg-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <InfoRow label="Kode KK" value={keluarga.kodeKK} />
        <InfoRow label="Kepala Keluarga" value={keluarga.namaKepala} />
        <InfoRow label="Alamat" value={keluarga.alamat} />
        <InfoRow label="Telepon" value={keluarga.telepon} />
        <InfoRow
          label="Jumlah Anggota"
          value={
            <span className="inline-flex rounded-full bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 text-xs font-medium">
              {keluarga.jumlahAnggota} orang
            </span>
          }
        />
      </div>

      {/* Anggota Keluarga */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Anggota Keluarga</h2>
          {canManage && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Anggota
            </button>
          )}
        </div>

        {/* Inline add form */}
        {showForm && (
          <form
            onSubmit={handleSaveAnggota}
            className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">Tambah Anggota Baru</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nama*</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Nama lengkap"
                />
                {errors.nama && <p className="text-xs text-red-600 mt-1">{errors.nama}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Hubungan*</label>
                <select
                  value={form.hubungan}
                  onChange={(e) => setForm((p) => ({ ...p, hubungan: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih</option>
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Anak">Anak</option>
                  <option value="Kakek">Kakek</option>
                  <option value="Nenek">Nenek</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                {errors.hubungan && <p className="text-xs text-red-600 mt-1">{errors.hubungan}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Urutan*</label>
                <input
                  type="number"
                  min={1}
                  value={form.urutan}
                  onChange={(e) => setForm((p) => ({ ...p, urutan: e.target.value }))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  placeholder="1"
                />
                {errors.urutan && <p className="text-xs text-red-600 mt-1">{errors.urutan}</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setErrors({}); }}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving && <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />}
                Simpan
              </button>
            </div>
          </form>
        )}

        {isAnggotaLoading ? (
          <div className="text-sm text-muted-foreground py-4">Memuat anggota...</div>
        ) : anggotaList.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
            Belum ada data anggota keluarga
          </div>
        ) : (
          <div className="space-y-2">
            {anggotaList.map((anggota, index) => (
              <div
                key={anggota.id}
                className="rounded-md border border-border bg-card p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {anggota.urutan || index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{anggota.nama}</p>
                    <p className="text-xs text-muted-foreground">{anggota.hubungan}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toast.info("Edit anggota belum tersedia")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnggota(anggota.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
