import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type KeluargaOption = { id: string; nama: string; kode: string; idPuskesmas: string };
type AnggotaOption = {
  id: string;
  idKeluarga: string;
  nama: string;
  hubungan: string;
};

export default function NewCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const daftarMasukId = searchParams.get("id_daftar_masuk");
  const isUserPoli = role === "user_poli";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [keluargaOptions, setKeluargaOptions] = useState<KeluargaOption[]>([]);
  const [anggotaOptions, setAnggotaOptions] = useState<AnggotaOption[]>([]);
  const [poliOptions, setPoliOptions] = useState<Array<{ id: string; nama: string }>>([]);
  const [selectedKeluargaId, setSelectedKeluargaId] = useState("");
  const [selectedAnggotaId, setSelectedAnggotaId] = useState("");
  const [selectedPoliId, setSelectedPoliId] = useState(user?.id_poli ?? "");
  const [poliName, setPoliName] = useState("-");
  const [tanggalKunjungan, setTanggalKunjungan] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dataPengkajian, setDataPengkajian] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [rencanaIntervensi, setRencanaIntervensi] = useState("");
  const [implementasi, setImplementasi] = useState("");
  const [petugasKesehatan, setPetugasKesehatan] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      const idPuskesmas = user?.id_puskesmas;
      if (!idPuskesmas && role !== "admin_dinkes") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [keluargaRes, anggotaRes, poliRes] = await Promise.all([
          (() => {
            let query = (supabase as any)
              .from("keluarga")
              .select("id, id_puskesmas, nama_kepala_keluarga, kode")
              .order("nama_kepala_keluarga", { ascending: true });
            if (role !== "admin_dinkes") query = query.eq("id_puskesmas", idPuskesmas);
            return query;
          })(),
          (supabase as any)
            .from("anggota_keluarga")
            .select("id, id_keluarga, nama, hubungan"),
          (() => {
            let query = (supabase as any)
              .from("poli")
              .select("id, nama_poli")
              .order("nama_poli", { ascending: true });
            if (isUserPoli && user?.id_poli) query = query.eq("id", user.id_poli);
            else if (role !== "admin_dinkes" && idPuskesmas) query = query.eq("id_puskesmas", idPuskesmas);
            return query;
          })(),
          user?.id_poli
            ? (supabase as any)
                .from("poli")
                .select("nama_poli")
                .eq("id", user.id_poli)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        setKeluargaOptions(
          ((keluargaRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => ({
              id: String(row.id ?? idx),
              nama: String(row.nama_kepala_keluarga ?? "-"),
              kode: String(row.kode ?? "-"),
              idPuskesmas: String(row.id_puskesmas ?? ""),
            }),
          ),
        );
        setAnggotaOptions(
          ((anggotaRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => ({
              id: String(row.id ?? idx),
              idKeluarga: String(row.id_keluarga ?? ""),
              nama: String(row.nama ?? "-"),
              hubungan: String(row.hubungan ?? "-"),
            }),
          ),
        );
        const poliList = ((poliRes.data ?? []) as Array<Record<string, unknown>>).map(
          (row, idx) => ({
            id: String(row.id ?? idx),
            nama: String(row.nama_poli ?? "-"),
          }),
        );
        setPoliOptions(poliList);
        const initialPoliId = user?.id_poli ?? poliList[0]?.id ?? "";
        setSelectedPoliId(initialPoliId);
        setPoliName(poliList.find((item) => item.id === initialPoliId)?.nama ?? "-");
        // Set nama petugas otomatis dari user yang login
        setPetugasKesehatan(user?.fullname_users ?? "");

        if (daftarMasukId) {
          const { data } = await (supabase as any)
            .from("daftar_masuk")
            .select("*")
            .eq("id", daftarMasukId)
            .maybeSingle();
          if (data) {
            setSelectedKeluargaId(String(data.id_keluarga ?? ""));
            setSelectedAnggotaId(String(data.id_anggota_keluarga ?? ""));
            if (data.id_poli) setSelectedPoliId(String(data.id_poli));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [daftarMasukId, isUserPoli, role, user?.id_poli, user?.id_puskesmas, user?.fullname_users]);

  const anggotaCascade = useMemo(
    () =>
      anggotaOptions.filter((item) => item.idKeluarga === selectedKeluargaId),
    [anggotaOptions, selectedKeluargaId],
  );
  const keluargaAktif = keluargaOptions.find(
    (item) => item.id === selectedKeluargaId,
  );
  const anggotaAktif = anggotaOptions.find(
    (item) => item.id === selectedAnggotaId,
  );
  const poliAktif = poliOptions.find((item) => item.id === selectedPoliId);

  const saveCard = async () => {
    if (
      !user?.id ||
      !selectedKeluargaId ||
      !selectedAnggotaId ||
      !selectedPoliId
    ) {
      throw new Error("Data pasien belum lengkap");
    }
    const keluargaAktifSaatIni = keluargaOptions.find((item) => item.id === selectedKeluargaId);
    const targetPuskesmasId = user?.id_puskesmas ?? keluargaAktifSaatIni?.idPuskesmas;
    if (!targetPuskesmasId) throw new Error("Puskesmas belum dipilih");

    // FIX: tambah created_by dan id_puskesmas saat insert
    const { data: card, error } = await (supabase as any)
      .from("kartu_asuhan_keperawatan")
      .insert({
        id_keluarga: selectedKeluargaId,
        id_anggota_keluarga: selectedAnggotaId,
        id_daftar_masuk: daftarMasukId || null,
        id_poli: selectedPoliId,
        id_puskesmas: targetPuskesmasId,
        status: "pending",
        created_by: user.id, // FIX: tambah ini
      })
      .select("id")
      .single();

    if (error) throw error;

    const { error: rowError } = await (supabase as any)
      .from("kak_rows")
      .insert({
        id_kak: card.id,
        tanggal: tanggalKunjungan,
        data_pengkajian: dataPengkajian,
        diagnosis_keperawatan: diagnosis,
        rencana_intervensi: rencanaIntervensi,
        implementasi,
        petugas: petugasKesehatan,
      });

    if (rowError) throw rowError;

    // Update status daftar_masuk jadi selesai
    if (daftarMasukId) {
      await (supabase as any)
        .from("daftar_masuk")
        .update({ status: "selesai" })
        .eq("id", daftarMasukId);
    }
  };

  const handleSave = async (shouldPrint: boolean) => {
    if (!selectedKeluargaId || !selectedAnggotaId || !selectedPoliId) {
      toast.error("Pilih keluarga, anggota, dan poli terlebih dahulu");
      return;
    }
    setIsSaving(true);
    try {
      await saveCard();
      toast.success("Kartu asuhan berhasil disimpan");
      if (shouldPrint) window.print();
      navigate("/app/kartu");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menyimpan kartu asuhan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app/kartu")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          Input Kartu Asuhan Keperawatan
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data pasien...
        </div>
      ) : (
        <>
          {!daftarMasukId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pilih Keluarga
                </label>
                <select
                  value={selectedKeluargaId}
                  onChange={(e) => {
                    setSelectedKeluargaId(e.target.value);
                    setSelectedAnggotaId("");
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih Keluarga</option>
                  {keluargaOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} ({item.kode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Pilih Anggota
                </label>
                <select
                  value={selectedAnggotaId}
                  onChange={(e) => setSelectedAnggotaId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih Anggota</option>
                  {anggotaCascade.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama} ({item.hubungan})
                    </option>
                  ))}
                </select>
              </div>
              {!isUserPoli && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Pilih Poli
                  </label>
                  <select
                    value={selectedPoliId}
                    onChange={(e) => {
                      setSelectedPoliId(e.target.value);
                      setPoliName(poliOptions.find((item) => item.id === e.target.value)?.nama ?? "-");
                    }}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Pilih Poli</option>
                    {poliOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2 text-sm">
            <p className="text-foreground">
              Keluarga:{" "}
              <span className="font-medium">{keluargaAktif?.nama ?? "-"}</span>{" "}
              ({keluargaAktif?.kode ?? "-"})
            </p>
            <p className="text-foreground">
              Anggota:{" "}
              <span className="font-medium">{anggotaAktif?.nama ?? "-"}</span> (
              {anggotaAktif?.hubungan ?? "-"})
            </p>
            <p className="text-foreground">
              Poli: <span className="font-medium">{poliAktif?.nama ?? poliName}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Tanggal Kunjungan:</span>
              <input
                type="date"
                value={tanggalKunjungan}
                onChange={(e) => setTanggalKunjungan(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <FormSection
              title="1. Data Pengkajian"
              placeholder="Masukkan hasil pengkajian kesehatan..."
              value={dataPengkajian}
              onChange={setDataPengkajian}
            />
            <FormSection
              title="2. Diagnosis Keperawatan"
              placeholder="Masukkan diagnosis keperawatan..."
              value={diagnosis}
              onChange={setDiagnosis}
            />
            <FormSection
              title="3. Rencana Intervensi"
              placeholder="Masukkan rencana tindakan keperawatan..."
              value={rencanaIntervensi}
              onChange={setRencanaIntervensi}
            />
            <FormSection
              title="4. Implementasi"
              placeholder="Masukkan hasil implementasi/tindakan..."
              value={implementasi}
              onChange={setImplementasi}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                5. Petugas Kesehatan
              </label>
              <input
                type="text"
                value={petugasKesehatan}
                onChange={(e) => setPetugasKesehatan(e.target.value)}
                placeholder="Nama petugas yang mendokumentasikan"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pb-8">
            <button
              type="button"
              onClick={() => navigate("/app/kartu")}
              className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              disabled={isSaving}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
              disabled={isSaving}
            >
              {isSaving && (
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              )}
              Simpan
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="inline-flex items-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-70"
              disabled={isSaving}
            >
              Simpan & Cetak
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function FormSection({
  title,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {title}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm resize-y"
      />
    </div>
  );
}
