import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Eye,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type KeluargaItem = {
  id: string;
  kodeKK: string;
  namaKepala: string;
  alamat: string;
  telepon: string;
  jumlahAnggota: number;
  puskesmas: string;
  tanggal: string;
};

type PuskesmasOption = {
  id: string;
  nama: string;
};

type ViewMode = "grid" | "list";

export default function DataKeluargaPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [puskesmasSearch, setPuskesmasSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [keluargaList, setKeluargaList] = useState<KeluargaItem[]>([]);
  const [puskesmasOptions, setPuskesmasOptions] = useState<PuskesmasOption[]>([]);

  const canManage = role !== "user_poli";
  const canFilterPuskesmas = true;

  const fetchKeluarga = async () => {
    const idPuskesmas = user?.id_puskesmas;
    if (!idPuskesmas && !canFilterPuskesmas) {
      setKeluargaList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [keluargaRes, puskesmasRes] = await Promise.all([
        (() => {
          let query = (supabase as any)
            .from("keluarga")
            .select("*")
            .order("created_at", { ascending: false });
          if (role !== "admin_dinkes") query = query.eq("id_puskesmas", idPuskesmas);
          return query;
        })(),
        (supabase as any)
          .from("puskesmas")
          .select("id, nama_puskesmas")
          .order("nama_puskesmas", { ascending: true }),
      ]);

      const puskesmasMapped: PuskesmasOption[] = (
        (puskesmasRes.data ?? []) as Array<Record<string, unknown>>
      ).map((row, idx) => ({
        id: String(row.id ?? idx),
        nama: String(row.nama_puskesmas ?? `Puskesmas ${idx + 1}`),
      }));
      setPuskesmasOptions(puskesmasMapped);
      const puskesmasMap = new Map(puskesmasMapped.map((item) => [item.id, item.nama]));

      const mapped: KeluargaItem[] = ((keluargaRes.data ?? []) as Array<Record<string, unknown>>).map(
        (row, index) => ({
          id: String(row.id ?? index),
          kodeKK: String(row.kode ?? "-"),
          namaKepala: String(row.nama_kepala_keluarga ?? "-"),
          alamat: String(row.alamat_keluarga ?? "-"),
          telepon: String(row.telp_keluarga ?? "-"),
          jumlahAnggota: Number(row.jumlah_anggota ?? 0),
          puskesmas: puskesmasMap.get(String(row.id_puskesmas ?? "")) ?? "-",
          tanggal: String(row.created_at ?? ""),
        }),
      );
      setKeluargaList(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeluarga();
  }, [user?.id_puskesmas]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const puskesmasKeyword = puskesmasSearch.trim().toLowerCase();
    return keluargaList.filter((item) => {
      const matchPuskesmas =
        !puskesmasKeyword || item.puskesmas.toLowerCase().includes(puskesmasKeyword);
      const matchKeyword =
        !keyword ||
        item.namaKepala.toLowerCase().includes(keyword) ||
        item.kodeKK.toLowerCase().includes(keyword) ||
        item.alamat.toLowerCase().includes(keyword);
      return matchPuskesmas && matchKeyword;
    });
  }, [keluargaList, puskesmasSearch, search]);

  const handleDelete = async (item: KeluargaItem) => {
    if (!window.confirm(`Hapus keluarga "${item.namaKepala}"? Tindakan ini tidak bisa dibatalkan.`))
      return;
    try {
      await (supabase as any).from("keluarga").delete().eq("id", item.id);
      toast.success("Data keluarga berhasil dihapus");
      await fetchKeluarga();
    } catch {
      toast.error("Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kartu Keluarga</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola data keluarga dan anggota keluarga
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => navigate("/app/keluarga/baru")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Buat Kartu Keluarga
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, alamat, atau kode..."
            className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={puskesmasSearch}
            onChange={(e) => setPuskesmasSearch(e.target.value)}
            placeholder="Filter puskesmas..."
            className="w-full rounded-md border border-border bg-background py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>
          Total: <strong className="text-foreground">{keluargaList.length}</strong>
        </span>
        <span>
          Hasil: <strong className="text-foreground">{filteredData.length}</strong>
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data keluarga...
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg text-muted-foreground">
          Belum ada data keluarga
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {item.kodeKK}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-lg font-bold text-foreground">{item.namaKepala}</p>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {item.jumlahAnggota} anggota
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {item.alamat}
                  </p>
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {item.puskesmas}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/app/keluarga/${item.id}`)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
                  title="Detail"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {canManage && (
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
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-100">
              <tr className="text-left">
                <th className="px-5 py-4 font-semibold text-muted-foreground">Kode</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">Kepala Keluarga</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">Alamat</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">Puskesmas</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-5 py-4 font-semibold text-muted-foreground text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-5 text-foreground font-semibold">{item.kodeKK}</td>
                  <td className="px-5 py-5 text-foreground">
                    <span className="inline-flex rounded-md bg-sky-50 px-2 py-1 font-semibold text-sky-800 shadow-sm ring-1 ring-sky-100">
                      {item.namaKepala}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-foreground">{item.alamat}</td>
                  <td className="px-5 py-5 text-foreground">
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-100">
                      {item.puskesmas}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-foreground">
                    {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/keluarga/${item.id}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
                        title="Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManage && (
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
        onClick={() => onChange("grid")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded ${
          value === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        }`}
        title="Mode grid"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex h-9 w-9 items-center justify-center rounded ${
          value === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        }`}
        title="Mode list"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
