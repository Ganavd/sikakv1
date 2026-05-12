import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type FilterPeriode = "hari_ini" | "bulan_ini" | "tahun_ini";

export default function LaporanPage() {
  const { role } = useAuth();
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>("hari_ini");

  const renderRoleContent = () => {
    if (role === "admin_dinkes")
      return <AdminDinkesLaporan periode={filterPeriode} />;
    if (role === "admin_puskesmas")
      return <AdminPuskesmasLaporan periode={filterPeriode} />;
    if (role === "user_du") return <UserDuLaporan periode={filterPeriode} />;
    if (role === "user_poli")
      return <UserPoliLaporan periode={filterPeriode} />;
    return <LaporanPlaceholder title="Statistik Umum" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Statistik & Laporan
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterPeriode("hari_ini")}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            filterPeriode === "hari_ini"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          Hari Ini
        </button>
        <button
          type="button"
          onClick={() => setFilterPeriode("bulan_ini")}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            filterPeriode === "bulan_ini"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          Bulan Ini
        </button>
        <button
          type="button"
          onClick={() => setFilterPeriode("tahun_ini")}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            filterPeriode === "tahun_ini"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          Tahun Ini
        </button>
      </div>

      {renderRoleContent()}
    </div>
  );
}

function LaporanPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">Loading statistik...</p>
    </div>
  );
}

function AdminDinkesLaporan({ periode }: { periode: FilterPeriode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [totalPuskesmas, setTotalPuskesmas] = useState(0);
  const [totalKkSemua, setTotalKkSemua] = useState(0);
  const [totalKakSemua, setTotalKakSemua] = useState(0);
  const [rankingPuskesmas, setRankingPuskesmas] = useState<
    Array<{
      id: string;
      nama: string;
      totalKk: number;
      totalKak: number;
      status: string;
    }>
  >([]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const toDate = (d: Date) => d.toISOString().slice(0, 10);
    if (periode === "hari_ini") {
      const today = toDate(now);
      return { startDate: today, endDate: today };
    }
    if (periode === "bulan_ini") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDate(first), endDate: toDate(last) };
    }
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { startDate: toDate(first), endDate: toDate(last) };
  }, [periode]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [puskesmasRes, keluargaRes, kakRes] = await Promise.all([
          (supabase as any).from("puskesmas").select("*"),
          (supabase as any)
            .from("keluarga")
            .select("id, id_puskesmas")
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id, id_puskesmas")
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
        ]);

        const pRows = (puskesmasRes.data ?? []) as Array<
          Record<string, unknown>
        >;
        const kRows = (keluargaRes.data ?? []) as Array<{
          id_puskesmas: string | null;
        }>;
        const kakRows = (kakRes.data ?? []) as Array<{
          id_puskesmas: string | null;
        }>;

        setTotalPuskesmas(pRows.length);
        setTotalKkSemua(kRows.length);
        setTotalKakSemua(kakRows.length);

        const kkMap = new Map<string, number>();
        const kakMap = new Map<string, number>();
        kRows.forEach((row) => {
          if (!row.id_puskesmas) return;
          kkMap.set(row.id_puskesmas, (kkMap.get(row.id_puskesmas) ?? 0) + 1);
        });
        kakRows.forEach((row) => {
          if (!row.id_puskesmas) return;
          kakMap.set(row.id_puskesmas, (kakMap.get(row.id_puskesmas) ?? 0) + 1);
        });

        const ranking = pRows
          .map((row, idx) => {
            const id = String(row.id ?? idx);
            const totalKk = kkMap.get(id) ?? 0;
            const totalKak = kakMap.get(id) ?? 0;
            return {
              id,
              nama: String(
                row.nama_puskesmas ??
                  row.nama ??
                  row.name ??
                  `Puskesmas ${idx + 1}`,
              ),
              totalKk,
              totalKak,
              status: totalKk > 0 || totalKak > 0 ? "Aktif" : "Minim Data",
            };
          })
          .sort((a, b) => b.totalKak + b.totalKk - (a.totalKak + a.totalKk));
        setRankingPuskesmas(ranking);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [endDate, startDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Puskesmas"
          value={isLoading ? "..." : totalPuskesmas}
        />
        <StatCard
          title="Total KK Semua"
          value={isLoading ? "..." : totalKkSemua}
        />
        <StatCard
          title="Total KAK Semua"
          value={isLoading ? "..." : totalKakSemua}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">
          Ranking Puskesmas
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground mt-2">
            Loading statistik...
          </p>
        ) : rankingPuskesmas.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            Belum ada data puskesmas.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3">Nama Puskesmas</th>
                  <th className="py-2 pr-3">Total KK</th>
                  <th className="py-2 pr-3">Total KAK</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingPuskesmas.map((row, idx) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 text-foreground">
                      {row.nama}{" "}
                      {idx === 0 && (
                        <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Terbaik
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-foreground">{row.totalKk}</td>
                    <td className="py-2 pr-3 text-foreground">
                      {row.totalKak}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPuskesmasLaporan({ periode }: { periode: FilterPeriode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totalKk, setTotalKk] = useState(0);
  const [totalKak, setTotalKak] = useState(0);
  const [totalPoli, setTotalPoli] = useState(0);
  const [totalUserAktif, setTotalUserAktif] = useState(0);
  const [performaPoli, setPerformaPoli] = useState<
    Array<{ id: string; nama: string; jumlahKak: number; jumlahPasien: number }>
  >([]);
  const [topKeluarga, setTopKeluarga] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);
  const [topPetugas, setTopPetugas] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const toDate = (d: Date) => d.toISOString().slice(0, 10);
    if (periode === "hari_ini") {
      const today = toDate(now);
      return { startDate: today, endDate: today };
    }
    if (periode === "bulan_ini") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDate(first), endDate: toDate(last) };
    }
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { startDate: toDate(first), endDate: toDate(last) };
  }, [periode]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id_puskesmas) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [kkRes, kakRes, poliRes, userAktifRes, keluargaRes, usersRes] =
          await Promise.all([
            (supabase as any)
              .from("keluarga")
              .select("id", { count: "exact", head: true })
              .eq("id_puskesmas", user.id_puskesmas),
            (supabase as any)
              .from("kartu_asuhan_keperawatan")
              .select("id, id_poli, id_keluarga, created_by")
              .eq("id_puskesmas", user.id_puskesmas)
              .gte("created_at", `${startDate}T00:00:00`)
              .lte("created_at", `${endDate}T23:59:59`),
            (supabase as any)
              .from("poli")
              .select("id, nama_poli")
              .eq("id_puskesmas", user.id_puskesmas),
            (supabase as any)
              .from("users")
              .select("id", { count: "exact", head: true })
              .eq("id_puskesmas", user.id_puskesmas)
              .eq("is_active", true),
            (supabase as any)
              .from("keluarga")
              .select("id, nama_kepala_keluarga")
              .eq("id_puskesmas", user.id_puskesmas),
            (supabase as any)
              .from("users")
              .select("id, fullname_users, email_users")
              .eq("id_puskesmas", user.id_puskesmas),
          ]);

        const kakRows = (kakRes.data ?? []) as Array<{
          id_poli: string | null;
          id_keluarga: string | null;
          created_by: string | null;
        }>;
        const poliRows = (poliRes.data ?? []) as Array<{
          id: string;
          nama_poli: string | null;
          nama: string | null;
        }>;
        const keluargaRows = (keluargaRes.data ?? []) as Array<{
          id: string;
          nama_kepala_keluarga: string | null;
        }>;
        const userRows = (usersRes.data ?? []) as Array<{
          id: string;
          fullname_users: string | null;
          email_users: string | null;
        }>;

        setTotalKk(kkRes.count ?? 0);
        setTotalKak(kakRows.length);
        setTotalPoli(poliRows.length);
        setTotalUserAktif(userAktifRes.count ?? 0);

        const kakPerPoli = new Map<string, number>();
        const pasienPerPoli = new Map<string, Set<string>>();
        kakRows.forEach((row) => {
          if (!row.id_poli) return;
          kakPerPoli.set(row.id_poli, (kakPerPoli.get(row.id_poli) ?? 0) + 1);
          if (!pasienPerPoli.has(row.id_poli))
            pasienPerPoli.set(row.id_poli, new Set());
          if (row.id_keluarga)
            pasienPerPoli.get(row.id_poli)?.add(row.id_keluarga);
        });
        setPerformaPoli(
          poliRows.map((row) => ({
            id: row.id,
            nama: row.nama_poli || "Poli",
            jumlahKak: kakPerPoli.get(row.id) ?? 0,
            jumlahPasien: pasienPerPoli.get(row.id)?.size ?? 0,
          })),
        );

        const keluargaMap = new Map(
          keluargaRows.map((k) => [k.id, k.nama_kepala_keluarga || "Keluarga"]),
        );
        const countKeluarga = new Map<string, number>();
        kakRows.forEach((row) => {
          if (!row.id_keluarga) return;
          countKeluarga.set(
            row.id_keluarga,
            (countKeluarga.get(row.id_keluarga) ?? 0) + 1,
          );
        });
        setTopKeluarga(
          [...countKeluarga.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama: keluargaMap.get(id) || "Keluarga",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );

        const userMap = new Map(
          userRows.map((u) => [
            u.id,
            u.fullname_users || u.email_users || "Petugas",
          ]),
        );
        const countPetugas = new Map<string, number>();
        kakRows.forEach((row) => {
          if (!row.created_by) return;
          countPetugas.set(
            row.created_by,
            (countPetugas.get(row.created_by) ?? 0) + 1,
          );
        });
        setTopPetugas(
          [...countPetugas.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama: userMap.get(id) || "Petugas",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [endDate, startDate, user?.id_puskesmas]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total KK" value={isLoading ? "..." : totalKk} />
        <StatCard title="Total KAK" value={isLoading ? "..." : totalKak} />
        <StatCard title="Total Poli" value={isLoading ? "..." : totalPoli} />
        <StatCard
          title="Total User Aktif"
          value={isLoading ? "..." : totalUserAktif}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">
          Performa Per Poli
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground mt-2">
            Loading statistik...
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-3">Nama Poli</th>
                  <th className="py-2 pr-3">Jumlah KAK</th>
                  <th className="py-2 pr-3">Jumlah Pasien</th>
                </tr>
              </thead>
              <tbody>
                {performaPoli.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 text-foreground">{row.nama}</td>
                    <td className="py-2 pr-3 text-foreground">
                      {row.jumlahKak}
                    </td>
                    <td className="py-2 pr-3 text-foreground">
                      {row.jumlahPasien}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RankingCard
        title="Top 3 Keluarga Terbanyak Kunjungan"
        data={topKeluarga}
        loading={isLoading}
      />
      <RankingCard
        title="Top 3 Petugas Paling Aktif"
        data={topPetugas}
        loading={isLoading}
      />
    </div>
  );
}

function UserDuLaporan({ periode }: { periode: FilterPeriode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kkSaya, setKkSaya] = useState(0);
  const [poliDikunjungi, setPoliDikunjungi] = useState(0);
  const [totalKkPuskesmas, setTotalKkPuskesmas] = useState(0);
  const [totalKakPuskesmas, setTotalKakPuskesmas] = useState(0);
  const [ranking, setRanking] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const toDate = (d: Date) => d.toISOString().slice(0, 10);
    if (periode === "hari_ini") {
      const today = toDate(now);
      return { startDate: today, endDate: today };
    }
    if (periode === "bulan_ini") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDate(first), endDate: toDate(last) };
    }
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { startDate: toDate(first), endDate: toDate(last) };
  }, [periode]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id || !user?.id_puskesmas) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [
          kkSayaRes,
          daftarMasukRes,
          totalKkRes,
          totalKakRes,
          rankingRes,
          usersRes,
        ] = await Promise.all([
          (supabase as any)
            .from("keluarga")
            .select("id", { count: "exact", head: true })
            .eq("created_by", user.id)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("daftar_masuk")
            .select("id_poli")
            .eq("created_by", user.id)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("keluarga")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", user.id_puskesmas),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", user.id_puskesmas),
          (supabase as any)
            .from("keluarga")
            .select("created_by")
            .eq("id_puskesmas", user.id_puskesmas)
            .not("created_by", "is", null)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("users")
            .select("id, fullname_users, email_users"),
        ]);

        setKkSaya(kkSayaRes.count ?? 0);
        const poliUnik = new Set(
          ((daftarMasukRes.data ?? []) as Array<{ id_poli: string | null }>)
            .map((row) => row.id_poli)
            .filter((id): id is string => Boolean(id)),
        );
        setPoliDikunjungi(poliUnik.size);
        setTotalKkPuskesmas(totalKkRes.count ?? 0);
        setTotalKakPuskesmas(totalKakRes.count ?? 0);

        const userMap = new Map(
          (
            (usersRes.data ?? []) as Array<{
              id: string;
              fullname_users: string | null;
              email_users: string | null;
            }>
          ).map((u) => [u.id, u]),
        );
        const countMap = new Map<string, number>();
        (
          (rankingRes.data ?? []) as Array<{ created_by: string | null }>
        ).forEach((row) => {
          if (!row.created_by) return;
          countMap.set(row.created_by, (countMap.get(row.created_by) ?? 0) + 1);
        });
        const rankTop3 = [...countMap.entries()]
          .map(([id, jumlah]) => ({
            id,
            jumlah,
            nama:
              userMap.get(id)?.fullname_users ||
              userMap.get(id)?.email_users ||
              "Petugas",
          }))
          .sort((a, b) => b.jumlah - a.jumlah)
          .slice(0, 3);
        setRanking(rankTop3);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [endDate, startDate, user?.id, user?.id_puskesmas]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="KK yang saya daftarkan"
          value={isLoading ? "..." : kkSaya}
        />
        <StatCard
          title="Poli yang dikunjungi"
          value={isLoading ? "..." : poliDikunjungi}
        />
        <StatCard
          title="Total KK"
          value={isLoading ? "..." : totalKkPuskesmas}
        />
        <StatCard
          title="Total KAK"
          value={isLoading ? "..." : totalKakPuskesmas}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground">
          Petugas Pencatat Terbanyak
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground mt-2">
            Loading statistik...
          </p>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            Belum ada data petugas.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {ranking.map((row, idx) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-slate-900"
                    style={{
                      backgroundColor:
                        idx === 0
                          ? "#FFD700"
                          : idx === 1
                            ? "#C0C0C0"
                            : "#CD7F32",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground">{row.nama}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {row.jumlah}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserPoliLaporan({ periode }: { periode: FilterPeriode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kakSaya, setKakSaya] = useState(0);
  const [kkTopSaya, setKkTopSaya] = useState<{
    nama: string;
    jumlah: number;
  } | null>(null);
  const [totalKakPoli, setTotalKakPoli] = useState(0);
  const [topKkPoli, setTopKkPoli] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);
  const [topPoli, setTopPoli] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);
  const [topPetugas, setTopPetugas] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const toDate = (d: Date) => d.toISOString().slice(0, 10);
    if (periode === "hari_ini") {
      const today = toDate(now);
      return { startDate: today, endDate: today };
    }
    if (periode === "bulan_ini") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDate(first), endDate: toDate(last) };
    }
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { startDate: toDate(first), endDate: toDate(last) };
  }, [periode]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id || !user?.id_poli || !user?.id_puskesmas) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [
          kakSayaRes,
          kakPoliRes,
          kakPuskesmasRes,
          keluargaRes,
          poliRes,
          usersRes,
        ] = await Promise.all([
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id, id_keluarga")
            .eq("created_by", user.id)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id, id_keluarga")
            .eq("id_poli", user.id_poli)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id, id_keluarga, id_poli, created_by")
            .eq("id_puskesmas", user.id_puskesmas)
            .gte("created_at", `${startDate}T00:00:00`)
            .lte("created_at", `${endDate}T23:59:59`),
          (supabase as any).from("keluarga").select("id, nama_kepala_keluarga"),
          (supabase as any)
            .from("poli")
            .select("id, nama_poli")
            .eq("id_puskesmas", user.id_puskesmas),
          (supabase as any)
            .from("users")
            .select("id, fullname_users, email_users"),
        ]);

        const kakSayaRows = (kakSayaRes.data ?? []) as Array<{
          id_keluarga: string | null;
        }>;
        const kakPoliRows = (kakPoliRes.data ?? []) as Array<{
          id_keluarga: string | null;
        }>;
        const kakPuskesmasRows = (kakPuskesmasRes.data ?? []) as Array<{
          id_keluarga: string | null;
          id_poli: string | null;
          created_by: string | null;
        }>;

        const keluargaMap = new Map(
          (
            (keluargaRes.data ?? []) as Array<{
              id: string;
              nama_kepala_keluarga: string | null;
            }>
          ).map((row) => [row.id, row.nama_kepala_keluarga || "Keluarga"]),
        );
        const poliMap = new Map(
          (
            (poliRes.data ?? []) as Array<{
              id: string;
              nama_poli: string | null;
              nama: string | null;
            }>
          ).map((row) => [row.id, row.nama_poli || "Poli"]),
        );
        const userMap = new Map(
          (
            (usersRes.data ?? []) as Array<{
              id: string;
              fullname_users: string | null;
              email_users: string | null;
            }>
          ).map((row) => [
            row.id,
            row.fullname_users || row.email_users || "Petugas",
          ]),
        );

        setKakSaya(kakSayaRows.length);
        setTotalKakPoli(kakPoliRows.length);

        const countKkSaya = new Map<string, number>();
        kakSayaRows.forEach((row) => {
          if (!row.id_keluarga) return;
          countKkSaya.set(
            row.id_keluarga,
            (countKkSaya.get(row.id_keluarga) ?? 0) + 1,
          );
        });
        const kkSayaTop = [...countKkSaya.entries()].sort(
          (a, b) => b[1] - a[1],
        )[0];
        setKkTopSaya(
          kkSayaTop
            ? {
                nama: keluargaMap.get(kkSayaTop[0]) || "Keluarga",
                jumlah: kkSayaTop[1],
              }
            : null,
        );

        const countKkPoli = new Map<string, number>();
        kakPoliRows.forEach((row) => {
          if (!row.id_keluarga) return;
          countKkPoli.set(
            row.id_keluarga,
            (countKkPoli.get(row.id_keluarga) ?? 0) + 1,
          );
        });
        setTopKkPoli(
          [...countKkPoli.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama: keluargaMap.get(id) || "Keluarga",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );

        const countPoli = new Map<string, number>();
        const countPetugas = new Map<string, number>();
        kakPuskesmasRows.forEach((row) => {
          if (row.id_poli)
            countPoli.set(row.id_poli, (countPoli.get(row.id_poli) ?? 0) + 1);
          if (row.created_by)
            countPetugas.set(
              row.created_by,
              (countPetugas.get(row.created_by) ?? 0) + 1,
            );
        });

        setTopPoli(
          [...countPoli.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama: poliMap.get(id) || "Poli",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );

        setTopPetugas(
          [...countPetugas.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama: userMap.get(id) || "Petugas",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [endDate, startDate, user?.id, user?.id_poli, user?.id_puskesmas]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          title="KAK yang saya catat"
          value={isLoading ? "..." : kakSaya}
        />
        <StatCard
          title="KK yang paling banyak dikunjungi"
          value={
            isLoading
              ? "..."
              : kkTopSaya
                ? `${kkTopSaya.nama} (${kkTopSaya.jumlah})`
                : "-"
          }
        />
        <StatCard
          title="Total KAK poli ini"
          value={isLoading ? "..." : totalKakPoli}
        />
      </div>

      <RankingCard
        title="Top 3 KK dengan KAK terbanyak di poli ini"
        data={topKkPoli}
        loading={isLoading}
      />
      <RankingCard
        title="Top 3 Poli dengan KAK terbanyak"
        data={topPoli}
        loading={isLoading}
      />
      <RankingCard
        title="Top 3 Petugas KAK terbanyak"
        data={topPetugas}
        loading={isLoading}
      />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function RankingCard({
  title,
  data,
  loading,
}: {
  title: string;
  data: Array<{ id: string; nama: string; jumlah: number }>;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground mt-2">
          Loading statistik...
        </p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">Belum ada data.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {data.map((row, idx) => (
            <div
              key={`${title}-${row.id}`}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold text-slate-900"
                  style={{
                    backgroundColor:
                      idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32",
                  }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm text-foreground">{row.nama}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {row.jumlah}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
