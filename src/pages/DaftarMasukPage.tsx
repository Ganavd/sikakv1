import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PoliItem = {
  id: string;
  nama: string;
};

type DaftarMasukItem = {
  id: string;
  idPoli: string;
  nomor: string;
  kepalaKeluarga: string;
  anggota: string;
  status: string;
};

type KeluargaItem = {
  id: string;
  namaKepala: string;
};

type AnggotaItem = {
  id: string;
  nama: string;
};

export default function DaftarMasukPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [poliList, setPoliList] = useState<PoliItem[]>([]);
  const [antrianList, setAntrianList] = useState<DaftarMasukItem[]>([]);
  const [activePoliId, setActivePoliId] = useState("");
  const [selectedAntrian, setSelectedAntrian] =
    useState<DaftarMasukItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingAntrian, setIsSavingAntrian] = useState(false);
  const [keluargaList, setKeluargaList] = useState<KeluargaItem[]>([]);
  const [anggotaList, setAnggotaList] = useState<AnggotaItem[]>([]);
  const [formPoliId, setFormPoliId] = useState("");
  const [formKeluargaId, setFormKeluargaId] = useState("");
  const [formAnggotaId, setFormAnggotaId] = useState("");
  const canAdd = role === "user_du";

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchData = async () => {
    const idPuskesmas = user?.id_puskesmas;
    if (!idPuskesmas) {
      setPoliList([]);
      setAntrianList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const todayStr = getTodayString();
      const [poliRes, antrianRes] = await Promise.all([
        (supabase as any)
          .from("poli")
          .select("*")
          .eq("id_puskesmas", idPuskesmas)
          .order("nama", { ascending: true }),
        (supabase as any)
          .from("daftar_masuk")
          .select("*")
          .eq("tanggal", todayStr)
          .order("created_at", { ascending: true }),
      ]);

      const mappedPoli: PoliItem[] = (
        (poliRes.data ?? []) as Array<Record<string, unknown>>
      ).map((row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.nama_poli ?? row.nama ?? `Poli ${idx + 1}`),
      }));
      setPoliList(mappedPoli);

      // Fetch keluarga dan anggota untuk enrichment data
      const [keluargaRes, anggotaRes] = await Promise.all([
        (supabase as any).from("keluarga").select("id, nama_kepala_keluarga"),
        (supabase as any).from("anggota_keluarga").select("id, nama"),
      ]);

      const keluargaMap = new Map(
        ((keluargaRes.data ?? []) as Array<Record<string, unknown>>).map(
          (r, i) => [String(r.id ?? i), String(r.nama_kepala_keluarga ?? "-")],
        ),
      );
      const anggotaMap = new Map(
        ((anggotaRes.data ?? []) as Array<Record<string, unknown>>).map(
          (r, i) => [String(r.id ?? i), String(r.nama ?? "-")],
        ),
      );

      const mappedAntrian: DaftarMasukItem[] = (
        (antrianRes.data ?? []) as Array<Record<string, unknown>>
      ).map((row, idx) => ({
        id: String(row.id ?? idx),
        idPoli: String(row.id_poli ?? ""),
        nomor: String(row.nomor_antrian ?? row.nomor ?? `${idx + 1}`).padStart(
          3,
          "0",
        ),
        kepalaKeluarga: keluargaMap.get(String(row.id_keluarga ?? "")) ?? "-",
        anggota: anggotaMap.get(String(row.id_anggota_keluarga ?? "")) ?? "-",
        status: String(row.status ?? "pending"),
      }));
      setAntrianList(mappedAntrian);

      setActivePoliId((prev) => prev || mappedPoli[0]?.id || "");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id_puskesmas]);

  const filteredAntrian = useMemo(
    () => antrianList.filter((item) => item.idPoli === activePoliId),
    [activePoliId, antrianList],
  );
  const selectedPoliName =
    poliList.find((p) => p.id === selectedAntrian?.idPoli)?.nama ?? "-";

  const openDetail = (item: DaftarMasukItem) => {
    setSelectedAntrian(item);
    setSelectedStatus(item.status || "pending");
  };

  const openAddModal = async () => {
    if (!activePoliId) return;
    setFormPoliId(activePoliId);
    setFormKeluargaId("");
    setFormAnggotaId("");
    setAnggotaList([]);
    setIsAddModalOpen(true);

    const idPuskesmas = user?.id_puskesmas;
    if (!idPuskesmas) return;
    const { data } = await (supabase as any)
      .from("keluarga")
      .select("id, nama_kepala_keluarga")
      .eq("id_puskesmas", idPuskesmas)
      .order("nama_kepala_keluarga", { ascending: true });
    const mapped = ((data ?? []) as Array<Record<string, unknown>>).map(
      (row, idx) => ({
        id: String(row.id ?? idx),
        namaKepala: String(row.nama_kepala_keluarga ?? "-"),
      }),
    );
    setKeluargaList(mapped);
  };

  const handleChooseKeluarga = async (keluargaId: string) => {
    setFormKeluargaId(keluargaId);
    setFormAnggotaId("");
    if (!keluargaId) {
      setAnggotaList([]);
      return;
    }
    const { data } = await (supabase as any)
      .from("anggota_keluarga")
      .select("id, nama")
      .eq("id_keluarga", keluargaId)
      .order("urutan", { ascending: true });
    const mapped = ((data ?? []) as Array<Record<string, unknown>>).map(
      (row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.nama ?? "-"),
      }),
    );
    setAnggotaList(mapped);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAntrian) return;
    setIsUpdatingStatus(true);
    try {
      await (supabase as any)
        .from("daftar_masuk")
        .update({ status: selectedStatus })
        .eq("id", selectedAntrian.id);
      setSelectedAntrian((prev) =>
        prev ? { ...prev, status: selectedStatus } : prev,
      );
      setAntrianList((prev) =>
        prev.map((row) =>
          row.id === selectedAntrian.id
            ? { ...row, status: selectedStatus }
            : row,
        ),
      );
      toast.success("Status antrian berhasil diperbarui");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveAntrian = async () => {
    if (!formPoliId || !formKeluargaId || !formAnggotaId) return;
    setIsSavingAntrian(true);
    try {
      const todayStr = getTodayString();
      const [{ data: lastData }] = await Promise.all([
        (supabase as any)
          .from("daftar_masuk")
          .select("nomor_antrian")
          .eq("id_poli", formPoliId)
          .eq("tanggal", todayStr)
          .order("nomor_antrian", { ascending: false })
          .limit(1),
      ]);

      const nextNumber = Number(lastData?.[0]?.nomor_antrian ?? 0) + 1;
      const nomorAntrian = String(nextNumber).padStart(3, "0");

      await (supabase as any).from("daftar_masuk").insert({
        id_poli: formPoliId,
        id_keluarga: formKeluargaId,
        id_anggota_keluarga: formAnggotaId,
        nomor_antrian: nextNumber,
        tanggal: todayStr,
        status: "pending",
      });

      setIsAddModalOpen(false);
      await fetchData();
      setActivePoliId(formPoliId);
      toast.success("Antrian berhasil ditambahkan");
      void nomorAntrian;
    } finally {
      setIsSavingAntrian(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Daftar Masuk - Antrian Hari Ini
        </h1>
        {canAdd && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Tambah Antrian
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat antrian hari ini...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {poliList.map((poli) => (
              <button
                key={poli.id}
                type="button"
                onClick={() => setActivePoliId(poli.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  activePoliId === poli.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {poli.nama}
              </button>
            ))}
          </div>

          {filteredAntrian.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Belum ada antrian hari ini
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAntrian.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDetail(item)}
                  className={`text-left rounded-lg border p-4 transition-colors ${
                    item.status === "selesai"
                      ? "bg-green-50 border-green-200"
                      : item.status === "proses"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-white border-slate-200"
                  }`}
                >
                  <p className="text-xl font-bold text-foreground">
                    {item.nomor}
                  </p>
                  <p className="text-sm text-foreground mt-2">
                    KK: {item.kepalaKeluarga}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Anggota: {item.anggota}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedAntrian && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Detail Antrian
              </h2>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <p className="text-foreground">
                Nomor antrian: {selectedAntrian.nomor}
              </p>
              <p className="text-foreground">
                Nama KK: {selectedAntrian.kepalaKeluarga}
              </p>
              <p className="text-foreground">
                Nama Anggota: {selectedAntrian.anggota}
              </p>
              <p className="text-foreground">Poli: {selectedPoliName}</p>
              <p className="text-foreground">
                Status: {selectedAntrian.status}
              </p>
              <div className="pt-2">
                <label className="block text-sm text-foreground mb-1">
                  Ubah Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="proses">Proses</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
                className="mt-2 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
              >
                {isUpdatingStatus && (
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                )}
                Update Status
              </button>
              {role === "user_poli" && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/app/kartu?id_daftar_masuk=${selectedAntrian.id}`)
                  }
                  className="ml-2 mt-2 inline-flex items-center rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
                >
                  Input KAK
                </button>
              )}
            </div>
            <div className="border-t border-border p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAntrian(null)}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Tambah Antrian
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-foreground mb-1">
                  Pilih Poli
                </label>
                <select
                  value={formPoliId}
                  onChange={(e) => setFormPoliId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih poli</option>
                  {poliList.map((poli) => (
                    <option key={poli.id} value={poli.id}>
                      {poli.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">
                  Pilih Keluarga
                </label>
                <select
                  value={formKeluargaId}
                  onChange={(e) => handleChooseKeluarga(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih keluarga</option>
                  {keluargaList.map((keluarga) => (
                    <option key={keluarga.id} value={keluarga.id}>
                      {keluarga.namaKepala}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">
                  Pilih Anggota
                </label>
                <select
                  value={formAnggotaId}
                  onChange={(e) => setFormAnggotaId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pilih anggota</option>
                  {anggotaList.map((anggota) => (
                    <option key={anggota.id} value={anggota.id}>
                      {anggota.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-border p-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
                disabled={isSavingAntrian}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAntrian}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
                disabled={
                  isSavingAntrian ||
                  !formPoliId ||
                  !formKeluargaId ||
                  !formAnggotaId
                }
              >
                {isSavingAntrian && (
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                )}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
