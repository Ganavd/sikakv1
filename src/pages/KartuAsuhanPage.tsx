import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Eye,
  LayoutGrid,
  List,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserRound,
  ChevronDown,
  ChevronRight,
  Lock,
  Edit,
  Package,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type KartuItem = {
  id: string;
  idKeluarga: string;
  idAnggota: string;
  namaKepala: string;
  namaAnggota: string;
  namaPoli: string;
  namaPuskesmas: string;
  tanggal: string;
  status: string;
  preview: string;
  petugas: string;
};

type KeluargaOption = {
  id: string;
  nama: string;
};

type AnggotaOption = {
  id: string;
  idKeluarga: string;
  nama: string;
};

type PuskesmasOption = {
  id: string;
  nama: string;
};

type ViewMode = "grid" | "list" | "hierarchical";

type KeluargaGroup = {
  id: string;
  namaKepala: string;
  kartu: KartuItem[];
  isExpanded: boolean;
};

export default function KartuAsuhanPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kartuList, setKartuList] = useState<KartuItem[]>([]);
  const [keluargaOptions, setKeluargaOptions] = useState<KeluargaOption[]>([]);
  const [anggotaOptions, setAnggotaOptions] = useState<AnggotaOption[]>([]);
  const [puskesmasOptions, setPuskesmasOptions] = useState<PuskesmasOption[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [familySearch, setFamilySearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchical");
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(
    new Set(),
  );

  const canInput = role !== "user_du";
  const canFilterPuskesmas = true;

  useEffect(() => {
    const fetchData = async () => {
      const idPuskesmas = user?.id_puskesmas;
      if (!idPuskesmas && !canFilterPuskesmas) {
        setKartuList([]);
        setKeluargaOptions([]);
        setAnggotaOptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [
          kartuRes,
          keluargaRes,
          anggotaRes,
          rowsRes,
          puskesmasRes,
          poliRes,
          usersRes,
        ] = await Promise.all([
          (() => {
            let query = (supabase as any)
              .from("kartu_asuhan_keperawatan")
              .select("*")
              .order("created_at", { ascending: false });
            if (role !== "admin_dinkes")
              query = query.eq("id_puskesmas", idPuskesmas);
            return query;
          })(),
          (supabase as any)
            .from("keluarga")
            .select("id, nama_kepala_keluarga")
            .order("nama_kepala_keluarga", { ascending: true }),
          (supabase as any)
            .from("anggota_keluarga")
            .select("id, id_keluarga, nama")
            .order("urutan", { ascending: true }),
          (supabase as any)
            .from("kak_rows")
            .select("*")
            .order("created_at", { ascending: true }),
          (supabase as any)
            .from("puskesmas")
            .select("id, nama_puskesmas")
            .order("nama_puskesmas", { ascending: true }),
          (supabase as any).from("poli").select("id, nama_poli"),
          (supabase as any)
            .from("users")
            .select("id, fullname_users, email_users"),
        ]);

        if (kartuRes.error) throw kartuRes.error;
        if (keluargaRes.error) throw keluargaRes.error;
        if (anggotaRes.error) throw anggotaRes.error;
        if (puskesmasRes.error) throw puskesmasRes.error;
        if (poliRes.error) throw poliRes.error;
        if (usersRes.error) throw usersRes.error;

        const mappedPuskesmas: PuskesmasOption[] = (
          (puskesmasRes.data ?? []) as Array<Record<string, unknown>>
        ).map((row, idx) => ({
          id: String(row.id ?? idx),
          nama: String(row.nama_puskesmas ?? `Puskesmas ${idx + 1}`),
        }));
        setPuskesmasOptions(mappedPuskesmas);
        const puskesmasMap = new Map(
          mappedPuskesmas.map((item) => [item.id, item.nama]),
        );

        const keluargaMap = new Map<string, string>(
          ((keluargaRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => [
              String(row.id ?? idx),
              String(row.nama_kepala_keluarga ?? "-"),
            ],
          ),
        );
        const anggotaMap = new Map<string, string>(
          ((anggotaRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => [String(row.id ?? idx), String(row.nama ?? "-")],
          ),
        );
        const poliMap = new Map<string, string>(
          ((poliRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => [
              String(row.id ?? idx),
              String(row.nama_poli ?? "Poli"),
            ],
          ),
        );
        const userMap = new Map<string, string>(
          ((usersRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => [
              String(row.id ?? idx),
              String(row.fullname_users ?? row.email_users ?? "Petugas"),
            ],
          ),
        );
        const rowsByKak = new Map<string, Array<Record<string, unknown>>>();
        ((rowsRes.data ?? []) as Array<Record<string, unknown>>).forEach(
          (row) => {
            const kakId = String(row.id_kak ?? row.kak_id ?? "");
            if (!kakId) return;
            rowsByKak.set(kakId, [...(rowsByKak.get(kakId) ?? []), row]);
          },
        );

        const mappedKartu: KartuItem[] = (
          (kartuRes.data ?? []) as Array<Record<string, unknown>>
        ).map((row, idx) => {
          const cardId = String(row.id ?? idx);
          const rows = rowsByKak.get(cardId) ?? [];
          const previewRaw = String(
            rows[0]?.data_pengkajian ??
              rows[0]?.catatan ??
              rows[0]?.konten ??
              rows[0]?.diagnosis_keperawatan ??
              rows[0]?.diagnosis ??
              "Konten asuhan tersedia",
          );
          return {
            id: cardId,
            idKeluarga: String(row.id_keluarga ?? row.keluarga_id ?? ""),
            idAnggota: String(
              row.id_anggota_keluarga ?? row.id_anggota ?? row.anggota_id ?? "",
            ),
            namaKepala:
              keluargaMap.get(
                String(row.id_keluarga ?? row.keluarga_id ?? ""),
              ) ?? String(row.nama_kepala_keluarga ?? "-"),
            namaAnggota:
              anggotaMap.get(
                String(
                  row.id_anggota_keluarga ??
                    row.id_anggota ??
                    row.anggota_id ??
                    "",
                ),
              ) ?? String(row.nama_anggota ?? "-"),
            namaPoli:
              poliMap.get(String(row.id_poli ?? row.poli_id ?? "")) ??
              String(row.nama_poli ?? row.poli ?? "Poli"),
            namaPuskesmas:
              puskesmasMap.get(String(row.id_puskesmas ?? "")) ??
              String(row.nama_puskesmas ?? "-"),
            tanggal: String(
              rows[0]?.tanggal ?? row.tanggal ?? row.created_at ?? "",
            ),
            status: String(row.status ?? "pending"),
            preview: previewRaw,
            petugas: String(
              rows[0]?.petugas_kesehatan ??
                rows[0]?.petugas ??
                row.petugas_kesehatan ??
                userMap.get(String(row.created_by ?? "")) ??
                "-",
            ),
          };
        });

        const mappedKeluarga: KeluargaOption[] = (
          (keluargaRes.data ?? []) as Array<Record<string, unknown>>
        ).map((row, idx) => ({
          id: String(row.id ?? idx),
          nama: String(row.nama_kepala_keluarga ?? "-"),
        }));
        const mappedAnggota: AnggotaOption[] = (
          (anggotaRes.data ?? []) as Array<Record<string, unknown>>
        ).map((row, idx) => ({
          id: String(row.id ?? idx),
          idKeluarga: String(row.id_keluarga ?? ""),
          nama: String(row.nama ?? "-"),
        }));

        setKartuList(mappedKartu);
        setKeluargaOptions(mappedKeluarga);
        setAnggotaOptions(mappedAnggota);
      } catch (err: any) {
        toast.error(err?.message ?? "Gagal memuat kartu asuhan");
        setKartuList([]);
        setKeluargaOptions([]);
        setAnggotaOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [canFilterPuskesmas, user?.id_puskesmas]);

  const filteredCards = useMemo(() => {
    return kartuList.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const familyKeyword = familySearch.trim().toLowerCase();
      const matchKeluarga =
        !familyKeyword || item.namaKepala.toLowerCase().includes(familyKeyword);
      const matchKeyword =
        !keyword ||
        item.namaKepala.toLowerCase().includes(keyword) ||
        item.namaAnggota.toLowerCase().includes(keyword) ||
        item.namaPoli.toLowerCase().includes(keyword) ||
        item.namaPuskesmas.toLowerCase().includes(keyword);
      return matchKeluarga && matchKeyword;
    });
  }, [familySearch, kartuList, search]);

  const groupedByKeluarga = useMemo(() => {
    const groups = new Map<string, KeluargaGroup>();
    filteredCards.forEach((item) => {
      if (!groups.has(item.idKeluarga)) {
        groups.set(item.idKeluarga, {
          id: item.idKeluarga,
          namaKepala: item.namaKepala,
          kartu: [],
          isExpanded: expandedFamilies.has(item.idKeluarga),
        });
      }
      const group = groups.get(item.idKeluarga);
      if (group) {
        group.kartu.push(item);
        group.isExpanded = expandedFamilies.has(item.idKeluarga);
      }
    });
    return Array.from(groups.values()).sort((a, b) =>
      a.namaKepala.localeCompare(b.namaKepala),
    );
  }, [filteredCards, expandedFamilies]);

  const toggleFamilyExpand = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const handleDelete = async (item: KartuItem) => {
    if (!window.confirm(`Hapus kartu asuhan untuk "${item.namaKepala}"?`))
      return;
    try {
      await (supabase as any).from("kak_rows").delete().eq("id_kak", item.id);
      await (supabase as any)
        .from("kartu_asuhan_keperawatan")
        .delete()
        .eq("id", item.id);
      setKartuList((prev) => prev.filter((card) => card.id !== item.id));
      toast.success("Kartu asuhan berhasil dihapus");
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menghapus kartu asuhan");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Kartu Asuhan Keperawatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kartu asuhan keperawatan keluarga
          </p>
        </div>
        {canInput && (
          <button
            type="button"
            onClick={() => navigate("/app/kartu/baru")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Buat Kartu Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari anggota, keluarga, puskesmas, atau poli..."
            className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <input
          value={familySearch}
          onChange={(e) => setFamilySearch(e.target.value)}
          placeholder="Filter kepala keluarga..."
          className="rounded-md border border-border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>
          Total Keluarga:{" "}
          <strong className="text-foreground">
            {groupedByKeluarga.length}
          </strong>
        </span>
        <span>
          Total Kartu:{" "}
          <strong className="text-foreground">{filteredCards.length}</strong>
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat kartu asuhan...
        </div>
      ) : groupedByKeluarga.length === 0 ? (
        <div className="text-sm text-muted-foreground py-10 text-center bg-card border border-border rounded-lg">
          Belum ada kartu asuhan
        </div>
      ) : viewMode === "hierarchical" ? (
        <div className="space-y-3">
          {groupedByKeluarga.map((family) => (
            <div
              key={family.id}
              className="rounded-lg border border-border bg-card"
            >
              {/* Family Header */}
              <button
                type="button"
                onClick={() => toggleFamilyExpand(family.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {family.isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-3">
                    <UserRound className="h-5 w-5 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        {family.namaKepala}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {family.kartu.length} Kartu Asuhan
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/kartu/family/${family.id}`);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors"
                  title="Lihat semua KAK keluarga"
                >
                  Lihat Semua
                  <ArrowRight className="h-4 w-4" />
                </button>
              </button>

              {/* Expanded Family Cards */}
              {family.isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-2">
                  {family.kartu.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada kartu asuhan
                    </p>
                  ) : (
                    family.kartu.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-border/50 p-3 flex items-start justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            {item.namaAnggota}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex rounded bg-slate-100 px-2 py-0.5">
                              {item.namaPoli}
                            </span>
                            <span className="inline-flex rounded bg-slate-100 px-2 py-0.5">
                              {item.tanggal
                                ? new Date(item.tanggal).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "-"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/app/kartu/${item.id}`)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canInput && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCards.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.tanggal
                    ? new Date(item.tanggal).toLocaleDateString("id-ID")
                    : "-"}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/kartu/${item.id}`)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
                    title="Detail"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canInput && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-lg font-bold text-foreground">
                  {item.namaAnggota}
                </p>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p>- Keluarga {item.namaKepala}</p>
                  <p>- Puskesmas {item.namaPuskesmas}</p>
                  <p>- Poli {item.namaPoli}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Petugas:{" "}
                  <span className="font-medium text-foreground">
                    {item.petugas}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-100">
              <tr className="text-left">
                <th className="px-5 py-4 font-semibold text-muted-foreground">
                  Kepala Keluarga
                </th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">
                  Anggota
                </th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">
                  Poli
                </th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">
                  Puskesmas
                </th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">
                  Tanggal
                </th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-5 text-foreground">
                    <span className="inline-flex rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-800 shadow-sm ring-1 ring-sky-100">
                      {item.namaKepala}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-foreground">
                    {item.namaAnggota}
                  </td>
                  <td className="px-5 py-5 text-foreground">{item.namaPoli}</td>
                  <td className="px-5 py-5 text-foreground">
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-100">
                      {item.namaPuskesmas}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-foreground">
                    {item.tanggal
                      ? new Date(item.tanggal).toLocaleDateString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/kartu/${item.id}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
                        title="Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canInput && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-1">
      <button
        type="button"
        onClick={() => onChange("hierarchical")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded ${
          value === "hierarchical"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Mode hierarki (Keluarga)"
      >
        <Package className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded ${
          value === "grid"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Mode grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded ${
          value === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Mode list"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
