import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  FileText,
  Building2,
  UserCog,
  Layers,
  UserCheck,
  Mail,
  Plus,
  TrendingUp,
  ArrowRight,
  Send,
  MailCheck,
  ArrowUpRight,
  AlertCircle,
  UserRoundCheck,
  Activity,
  type LucideIcon,
} from "lucide-react";
import ponorogoLogo from "@/assets/ponorogo-logo.svg";

function isInToday(dateValue?: string | null) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isInCurrentMonth(dateValue?: string | null) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isInCurrentYear(dateValue?: string | null) {
  if (!dateValue) return false;
  return new Date(dateValue).getFullYear() === new Date().getFullYear();
}

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
};

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
      <div
        className={`h-11 w-11 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-tight">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DashboardMetric({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className={`h-6 w-6 ${color}`} />
      <p className="mt-5 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function DashboardStatsPanel({
  isLoading,
  totalKeluarga,
  totalPoli,
  totalUserAktif,
  totalKartu,
  rataRataKeluarga,
  checklistCount,
}: {
  isLoading: boolean;
  totalKeluarga: number;
  totalPoli: number;
  totalUserAktif: number;
  totalKartu: number;
  rataRataKeluarga: number;
  checklistCount: number;
}) {
  const loadingValue = isLoading ? "..." : undefined;

  return (
    <section className="space-y-5 rounded-lg bg-slate-50 p-4 md:p-5">
      <div className="mx-auto grid w-full max-w-xl grid-cols-[72px_1fr] items-center gap-5 rounded-2xl bg-card px-5 py-4 shadow-sm ring-1 ring-slate-100">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
          <Activity className="h-8 w-8" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Ringkasan Data Aktif
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-700">
            {loadingValue ?? totalKeluarga + totalKartu + totalUserAktif}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Hijau berarti data aktif dan siap dipakai.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <StatsGroup title="Data Keluarga">
          <MiniStat
            icon={Users}
            label="Total Keluarga"
            value={loadingValue ?? totalKeluarga}
            color="bg-emerald-500"
            description="Data keluarga terdaftar"
          />
          <MiniStat
            icon={Building2}
            label="Total Poli"
            value={loadingValue ?? totalPoli}
            color="bg-blue-500"
            description="Layanan poli tersedia"
          />
        </StatsGroup>

        <StatsGroup title="Kartu Asuhan">
          <MiniStat
            icon={MailCheck}
            label="Kartu Terbaru"
            value={loadingValue ?? totalKartu}
            color="bg-amber-500"
            description="Aktivitas KAK terakhir"
          />
          <MiniStat
            icon={ArrowUpRight}
            label="Petugas Aktif"
            value={loadingValue ?? totalUserAktif}
            color="bg-emerald-500"
            description="Akun aktif di puskesmas"
          />
        </StatsGroup>
      </div>

      <StatsGroup title="Ringkasan Operasional" columns="lg:grid-cols-3">
        <MiniStat
          icon={TrendingUp}
          label="Rata-rata Keluarga"
          value={loadingValue ?? rataRataKeluarga}
          color="bg-blue-500"
          description="Perbandingan keluarga dan poli"
        />
        <MiniStat
          icon={Send}
          label="Total Kartu"
          value={loadingValue ?? totalKartu}
          color="bg-amber-500"
          description="KAK yang tampil terbaru"
        />
        <MiniStat
          icon={AlertCircle}
          label="Perlu Setup"
          value={loadingValue ?? checklistCount}
          color={checklistCount > 0 ? "bg-red-500" : "bg-emerald-500"}
          description="Merah berarti ada setup yang perlu dicek"
        />
      </StatsGroup>
    </section>
  );
}

function StatsGroup({
  title,
  children,
  columns = "sm:grid-cols-2",
}: {
  title: string;
  children: React.ReactNode;
  columns?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="text-center text-base font-semibold text-slate-500">
        {title}
      </h3>
      <div className={`mt-5 grid grid-cols-1 ${columns} gap-4`}>
        {children}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[132px] grid-cols-[64px_1fr] items-center gap-4 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-100">
      <span
        className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${color}`}
      >
        <Icon className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-700">{value}</p>
        <p className="mt-1 text-xs leading-snug text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function DashboardCopyright() {
  return (
    <p className="text-sm text-muted-foreground">
      Copyright © 2026 Pemerintah Kabupaten Ponorogo
    </p>
  );
}

function getDashboardRoleLabel(role: string) {
  if (role === "admin_puskesmas") return "Admin Puskesmas";
  if (role === "user_du") return "Petugas Daftar Umum";
  if (role === "user_poli") return "Petugas Poli";
  if (role === "admin_dinkes") return "Admin Dinkes";
  return role || "Petugas";
}

function RankingRow({
  index,
  nama,
  jumlah,
  satuan,
}: {
  index: number;
  nama: string;
  jumlah: number;
  satuan: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 gap-3">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-slate-900"
          style={{ backgroundColor: MEDAL_COLORS[index] ?? "#e2e8f0" }}
        >
          #{index + 1}
        </span>
        <p className="text-sm font-medium text-foreground truncate">{nama}</p>
      </div>
      <p className="text-sm text-muted-foreground shrink-0">
        {jumlah} {satuan}
      </p>
    </div>
  );
}

export default function AppDashboard() {
  const { role } = useAuth();
  if (role === "admin_dinkes") return <AdminDinkesDashboard />;
  if (role === "admin_puskesmas") return <AdminPuskesmasDashboard />;
  if (role === "user_du") return <UserDuDashboard />;
  if (role === "user_poli") return <UserPoliDashboard />;
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">
        Selamat datang di SIKAK
      </h1>
      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AdminDinkesDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totalKeluarga, setTotalKeluarga] = useState(0);
  const [puskesmasList, setPuskesmasList] = useState<
    Array<{ id: string; nama: string }>
  >([]);
  const [activePuskesmasIds, setActivePuskesmasIds] = useState<Set<string>>(
    new Set(),
  );
  const namaUser = user?.fullname_users || user?.email_users || "Admin";

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const [puskesmasRes, keluargaRes, adminRes] = await Promise.all([
          (supabase as any).from("puskesmas").select("*"),
          (supabase as any)
            .from("keluarga")
            .select("id", { count: "exact", head: true }),
          (supabase as any)
            .from("users")
            .select("id_puskesmas")
            .eq("role_users", "admin_puskesmas")
            .not("id_puskesmas", "is", null),
        ]);
        const rows = (puskesmasRes.data ?? []) as Array<
          Record<string, unknown>
        >;
        setPuskesmasList(
          rows.map((row, i) => ({
            id: String(row.id ?? i),
            nama: String(
              row.nama_puskesmas ?? row.nama ?? `Puskesmas ${i + 1}`,
            ),
          })),
        );
        setTotalKeluarga(keluargaRes.count ?? 0);
        setActivePuskesmasIds(
          new Set(
            ((adminRes.data ?? []) as Array<{ id_puskesmas: string | null }>)
              .map((x) => x.id_puskesmas)
              .filter((id): id is string => Boolean(id)),
          ),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const totalPuskesmasAktif = useMemo(
    () => puskesmasList.filter((p) => activePuskesmasIds.has(p.id)).length,
    [activePuskesmasIds, puskesmasList],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {namaUser}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Statistik dan status puskesmas Kabupaten
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/pengguna")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          + Mendaftarkan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Puskesmas"
          value={isLoading ? "..." : puskesmasList.length}
          icon={Building2}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Total Kartu Keluarga"
          value={isLoading ? "..." : totalKeluarga}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Puskesmas Aktif"
          value={isLoading ? "..." : totalPuskesmasAktif}
          icon={UserCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Daftar Puskesmas</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Memuat data puskesmas...
            </div>
          ) : puskesmasList.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Data puskesmas belum tersedia.
            </div>
          ) : (
            puskesmasList.map((item) => (
              <div
                key={item.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {item.nama}
                </p>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${activePuskesmasIds.has(item.id) ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                >
                  {activePuskesmasIds.has(item.id) ? "Aktif" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPuskesmasDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [totalKeluarga, setTotalKeluarga] = useState(0);
  const [totalPoli, setTotalPoli] = useState(0);
  const [totalUserAktif, setTotalUserAktif] = useState(0);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [namaPuskesmas, setNamaPuskesmas] = useState("");
  const [latestCards, setLatestCards] = useState<
    Array<{ id: string; nama: string; poli: string; tanggal: string }>
  >([]);
  const [activeUsers, setActiveUsers] = useState<
    Array<{ id: string; nama: string; role: string }>
  >([]);
  const namaUser = user?.fullname_users || user?.email_users || "Admin";

  useEffect(() => {
    const fetchData = async () => {
      const idPuskesmas = user?.id_puskesmas;
      if (!idPuskesmas) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [
          pkRes,
          keluargaRes,
          poliRes,
          userAktifRes,
          userDuRes,
          userPoliRes,
          usersRes,
          kakRes,
        ] = await Promise.all([
          (supabase as any)
            .from("puskesmas")
            .select("nama_puskesmas")
            .eq("id", idPuskesmas)
            .maybeSingle(),
          (supabase as any)
            .from("keluarga")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", idPuskesmas),
          (supabase as any)
            .from("poli")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", idPuskesmas),
          (supabase as any)
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", idPuskesmas)
            .eq("is_active", true),
          (supabase as any)
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", idPuskesmas)
            .eq("role_users", "user_du"),
          (supabase as any)
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("id_puskesmas", idPuskesmas)
            .eq("role_users", "user_poli"),
          (supabase as any)
            .from("users")
            .select("id, fullname_users, email_users, role_users")
            .eq("id_puskesmas", idPuskesmas)
            .eq("is_active", true)
            .order("fullname_users", { ascending: true })
            .limit(5),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("*")
            .eq("id_puskesmas", idPuskesmas)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);
        setNamaPuskesmas(pkRes.data?.nama_puskesmas ?? "");
        setTotalKeluarga(keluargaRes.count ?? 0);
        setTotalPoli(poliRes.count ?? 0);
        setTotalUserAktif(userAktifRes.count ?? 0);
        setActiveUsers(
          ((usersRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row, idx) => ({
              id: String(row.id ?? idx),
              nama: String(row.fullname_users ?? row.email_users ?? "Petugas"),
              role: getDashboardRoleLabel(String(row.role_users ?? "")),
            }),
          ),
        );

        const kakRows = (kakRes.data ?? []) as Array<Record<string, unknown>>;
        const keluargaIds = [
          ...new Set(
            kakRows
              .map((row) => String(row.id_keluarga ?? row.keluarga_id ?? ""))
              .filter(Boolean),
          ),
        ];
        const poliIds = [
          ...new Set(
            kakRows
              .map((row) => String(row.id_poli ?? row.poli_id ?? ""))
              .filter(Boolean),
          ),
        ];
        const [keluargaNamesRes, poliNamesRes] = await Promise.all([
          keluargaIds.length > 0
            ? (supabase as any)
                .from("keluarga")
                .select("id, nama_kepala_keluarga")
                .in("id", keluargaIds)
            : Promise.resolve({ data: [] }),
          poliIds.length > 0
            ? (supabase as any)
                .from("poli")
                .select("id, nama_poli")
                .in("id", poliIds)
            : Promise.resolve({ data: [] }),
        ]);
        const keluargaMap = new Map(
          ((keluargaNamesRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row) => [String(row.id), String(row.nama_kepala_keluarga ?? "-")],
          ),
        );
        const poliMap = new Map(
          ((poliNamesRes.data ?? []) as Array<Record<string, unknown>>).map(
            (row) => [String(row.id), String(row.nama_poli ?? "Poli")],
          ),
        );
        setLatestCards(
          kakRows.map((row, idx) => {
            const keluargaId = String(row.id_keluarga ?? row.keluarga_id ?? "");
            const poliId = String(row.id_poli ?? row.poli_id ?? "");
            return {
              id: String(row.id ?? idx),
              nama:
                keluargaMap.get(keluargaId) ??
                String(row.nama_kepala_keluarga ?? row.nama_kepala ?? "-"),
              poli: poliMap.get(poliId) ?? String(row.nama_poli ?? row.poli ?? "Poli"),
              tanggal: String(row.tanggal ?? row.created_at ?? ""),
            };
          }),
        );
        const items: string[] = [];
        if ((poliRes.count ?? 0) === 0)
          items.push("Belum ada poli — silakan setup terlebih dahulu");
        if ((userDuRes.count ?? 0) === 0)
          items.push("Belum ada pengguna Daftar Umum");
        if ((userPoliRes.count ?? 0) === 0)
          items.push("Belum ada pengguna Poli");
        setChecklistItems(items);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id_puskesmas]);

  const rataRataKeluarga = totalPoli > 0 ? Math.round(totalKeluarga / totalPoli) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {namaPuskesmas
                ? `Ringkasan operasional Puskesmas ${namaPuskesmas}`
                : "Ringkasan operasional puskesmas"}
              </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-slate-500" />
              <span>Beranda</span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/app/pengguna/baru")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="h-4 w-4" />
              Mendaftarkan
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:p-7">
          <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
            <img
              src={ponorogoLogo}
              alt="Lambang Kabupaten Ponorogo"
              className="h-36 w-36 object-contain md:h-44 md:w-44"
            />
            <h2 className="mt-6 text-2xl md:text-3xl font-bold text-slate-700">
              Pemerintah Kabupaten Ponorogo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sistem Informasi Kartu Asuhan Keperawatan
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowStats((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sky-600 transition-colors"
          >
            {showStats ? "Sembunyikan Statistik" : "Tampilkan Statistik"}
          </button>
        </div>
        {!showStats && <DashboardCopyright />}
      </div>

      {showChecklist && checklistItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Checklist Setup
              </p>
              <ul className="mt-2 space-y-1">
                {checklistItems.map((item) => (
                  <li key={item} className="text-sm text-amber-700">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowChecklist(false)}
              className="text-xs text-amber-700 hover:text-amber-900 shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {showStats && (
        <>
          <DashboardStatsPanel
            isLoading={isLoading}
            totalKeluarga={totalKeluarga}
            totalPoli={totalPoli}
            totalUserAktif={totalUserAktif}
            totalKartu={latestCards.length}
            rataRataKeluarga={rataRataKeluarga}
            checklistCount={checklistItems.length}
          />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
            <section className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  Kartu Terbaru
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/app/kartu")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
                >
                  Lihat Semua
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="px-5 py-6 text-sm text-muted-foreground">
                    Memuat kartu terbaru...
                  </div>
                ) : latestCards.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-muted-foreground">
                    Belum ada kartu terbaru.
                  </div>
                ) : (
                  latestCards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/app/kartu/${item.id}`)}
                      className="w-full px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {item.nama}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground truncate">
                            {item.poli}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {item.tanggal
                            ? new Date(item.tanggal).toLocaleDateString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  Petugas Aktif
                </h2>
              </div>
              <div className="divide-y divide-border">
                {isLoading ? (
                  <div className="px-5 py-6 text-sm text-muted-foreground">
                    Memuat petugas aktif...
                  </div>
                ) : activeUsers.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-muted-foreground">
                    Belum ada petugas aktif.
                  </div>
                ) : (
                  activeUsers.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                          <UserCheck className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.nama}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.role}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Aktif
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
          <DashboardCopyright />
        </>
      )}
    </div>
  );
}

function UserDuDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [personalToday, setPersonalToday] = useState(0);
  const [personalMonth, setPersonalMonth] = useState(0);
  const [personalYear, setPersonalYear] = useState(0);
  const [puskesmasToday, setPuskesmasToday] = useState(0);
  const [puskesmasMonth, setPuskesmasMonth] = useState(0);
  const [topPetugas, setTopPetugas] = useState<
    Array<{ id: string; nama: string; jumlah: number }>
  >([]);
  const namaUser = user?.fullname_users || user?.email_users || "Petugas";

  useEffect(() => {
    const fetchData = async () => {
      const userId = user?.id;
      const idPuskesmas = user?.id_puskesmas;
      if (!userId || !idPuskesmas) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [personalRes, puskesmasRes, usersRes] = await Promise.all([
          (supabase as any)
            .from("keluarga")
            .select("created_at")
            .eq("created_by", userId),
          (supabase as any)
            .from("keluarga")
            .select("created_at, created_by")
            .eq("id_puskesmas", idPuskesmas),
          (supabase as any)
            .from("users")
            .select("id, fullname_users, email_users")
            .eq("id_puskesmas", idPuskesmas),
        ]);
        const personalRows = (personalRes.data ?? []) as Array<{
          created_at?: string | null;
        }>;
        const puskesmasRows = (puskesmasRes.data ?? []) as Array<{
          created_at?: string | null;
          created_by?: string | null;
        }>;
        const userRows = (usersRes.data ?? []) as Array<{
          id: string;
          fullname_users?: string | null;
          email_users?: string | null;
        }>;
        setPersonalToday(
          personalRows.filter((r) => isInToday(r.created_at)).length,
        );
        setPersonalMonth(
          personalRows.filter((r) => isInCurrentMonth(r.created_at)).length,
        );
        setPersonalYear(
          personalRows.filter((r) => isInCurrentYear(r.created_at)).length,
        );
        setPuskesmasToday(
          puskesmasRows.filter((r) => isInToday(r.created_at)).length,
        );
        setPuskesmasMonth(
          puskesmasRows.filter((r) => isInCurrentMonth(r.created_at)).length,
        );
        const counts = new Map<string, number>();
        puskesmasRows
          .filter((r) => isInToday(r.created_at) && r.created_by)
          .forEach((r) =>
            counts.set(r.created_by!, (counts.get(r.created_by!) ?? 0) + 1),
          );
        const userMap = new Map(userRows.map((u) => [u.id, u]));
        setTopPetugas(
          [...counts.entries()]
            .map(([id, jumlah]) => ({
              id,
              nama:
                userMap.get(id)?.fullname_users ||
                userMap.get(id)?.email_users ||
                "Petugas",
              jumlah,
            }))
            .sort((a, b) => b.jumlah - a.jumlah)
            .slice(0, 3),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.id_puskesmas]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {namaUser}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ringkasan pendaftaran KK pribadi dan puskesmas
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/keluarga")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          + Daftar Keluarga Baru
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="KK saya hari ini"
          value={isLoading ? "..." : personalToday}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="KK saya bulan ini"
          value={isLoading ? "..." : personalMonth}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="KK saya tahun ini"
          value={isLoading ? "..." : personalYear}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total KK hari ini (Puskesmas)"
          value={isLoading ? "..." : puskesmasToday}
          icon={Building2}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Total KK bulan ini (Puskesmas)"
          value={isLoading ? "..." : puskesmasMonth}
          icon={Building2}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            🏆 Top 3 Petugas KK Terbanyak Hari Ini
          </h2>
        </div>
        <div className="p-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat ranking...</p>
          ) : topPetugas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada data pendaftaran hari ini.
            </p>
          ) : (
            topPetugas.map((petugas, index) => (
              <RankingRow
                key={petugas.id}
                index={index}
                nama={petugas.nama}
                jumlah={petugas.jumlah}
                satuan="KK"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function UserPoliDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [namaPoli, setNamaPoli] = useState("Poli");
  const [personalToday, setPersonalToday] = useState(0);
  const [personalMonth, setPersonalMonth] = useState(0);
  const [personalYear, setPersonalYear] = useState(0);
  const [totalKakPoliToday, setTotalKakPoliToday] = useState(0);
  // FIX: simpan nama keluarga yang sudah di-resolve dari DB
  const [topKeluarga, setTopKeluarga] = useState<
    Array<{ nama: string; jumlah: number }>
  >([]);
  const namaUser = user?.fullname_users || user?.email_users || "Petugas";

  useEffect(() => {
    const fetchData = async () => {
      const userId = user?.id;
      const idPoli = user?.id_poli;
      const idPuskesmas = user?.id_puskesmas;
      if (!userId || !idPoli) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [poliRes, kakPersonalRes, kakPoliRes] = await Promise.all([
          (supabase as any)
            .from("poli")
            .select("nama_poli")
            .eq("id", idPoli)
            .maybeSingle(),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("created_at")
            .eq("created_by", userId),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("created_at, id_keluarga")
            .eq("id_poli", idPoli),
        ]);
        setNamaPoli(poliRes.data?.nama_poli ?? "Poli");
        const personalRows = (kakPersonalRes.data ?? []) as Array<{
          created_at?: string | null;
        }>;
        const poliRows = (kakPoliRes.data ?? []) as Array<{
          created_at?: string | null;
          id_keluarga?: string | null;
        }>;
        setPersonalToday(
          personalRows.filter((r) => isInToday(r.created_at)).length,
        );
        setPersonalMonth(
          personalRows.filter((r) => isInCurrentMonth(r.created_at)).length,
        );
        setPersonalYear(
          personalRows.filter((r) => isInCurrentYear(r.created_at)).length,
        );
        setTotalKakPoliToday(
          poliRows.filter((r) => isInToday(r.created_at)).length,
        );

        // FIX: Hitung top keluarga lalu ambil nama dari DB
        const counts = new Map<string, number>();
        poliRows.forEach((r) => {
          const key = r.id_keluarga || "unknown";
          counts.set(key, (counts.get(key) ?? 0) + 1);
        });

        const topIds = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => id)
          .filter((id) => id !== "unknown");

        if (topIds.length > 0) {
          const { data: keluargaData } = await (supabase as any)
            .from("keluarga")
            .select("id, nama_kepala_keluarga")
            .in("id", topIds);

          const namaMap = new Map(
            ((keluargaData ?? []) as Array<Record<string, unknown>>).map(
              (r) => [String(r.id), String(r.nama_kepala_keluarga ?? "-")],
            ),
          );

          setTopKeluarga(
            topIds.map((id) => ({
              nama: namaMap.get(id) ?? "-",
              jumlah: counts.get(id) ?? 0,
            })),
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.id_poli, user?.id_puskesmas]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang, {namaUser}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Poli {namaPoli} — Ringkasan pencatatan KAK
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/kartu/baru")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          + Input Kartu Asuhan
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="KAK saya hari ini"
          value={isLoading ? "..." : personalToday}
          icon={FileText}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="KAK saya bulan ini"
          value={isLoading ? "..." : personalMonth}
          icon={FileText}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="KAK saya tahun ini"
          value={isLoading ? "..." : personalYear}
          icon={FileText}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Total KAK poli hari ini"
          value={isLoading ? "..." : totalKakPoliToday}
          icon={UserCog}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>
      <div className="bg-card rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            🏆 Top 3 KK dengan KAK Terbanyak
          </h2>
        </div>
        <div className="p-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat ranking...</p>
          ) : topKeluarga.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada data KAK di poli ini.
            </p>
          ) : (
            topKeluarga.map((item, index) => (
              <RankingRow
                key={`${item.nama}-${index}`}
                index={index}
                nama={item.nama}
                jumlah={item.jumlah}
                satuan="KAK"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
