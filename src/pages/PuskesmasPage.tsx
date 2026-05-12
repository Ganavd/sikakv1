import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  Users,
  Layers,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Puskesmas = { id: string; nama: string; telp: string | null };
type Poli = { id: string; nama: string; idPuskesmas: string };
type UserRow = { id: string; nama: string; role: string };
type KakRow = {
  id: string;
  namaKepala: string;
  namaAnggota: string;
  tanggal: string;
  idKak: string;
  idKeluarga: string;
};

// ─── Admin Dinkes View ────────────────────────────────────────────────────────

export default function PuskesmasPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-10 text-muted-foreground">
        <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Memuat...
      </div>
    );
  }

  if (role === "admin_dinkes") return <AdminDinkesView />;
  if (role === "admin_puskesmas") return <AdminPuskesmasView />;
  return null;
}

// ── Admin Dinkes: list semua puskesmas → klik → statistik ─────────────────────

function AdminDinkesView() {
  const [list, setList] = useState<Puskesmas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Puskesmas | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("puskesmas")
        .select("*")
        .order("nama_puskesmas");
      setList(
        ((data ?? []) as Array<Record<string, unknown>>).map((r, i) => ({
          id: String(r.id ?? i),
          nama: String(r.nama_puskesmas ?? r.nama ?? `Puskesmas ${i + 1}`),
          telp: r.telp ? String(r.telp) : null,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  if (selected) {
    return (
      <PuskesmasStatistik
        puskesmas={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Puskesmas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Klik puskesmas untuk melihat statistik dan pengguna
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Puskesmas
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data puskesmas...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            Belum ada data puskesmas.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tambahkan puskesmas terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {p.nama}
                    </p>
                    {p.telp && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.telp}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {addOpen && (
        <AddPuskesmasModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

// ── Statistik Puskesmas (level 2 admin dinkes) ────────────────────────────────

function PuskesmasStatistik({
  puskesmas,
  onBack,
}: {
  puskesmas: Puskesmas;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [duUsers, setDuUsers] = useState<UserRow[]>([]);
  const [poliList, setPoliList] = useState<
    Array<{ id: string; nama: string; petugas: UserRow[] }>
  >([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [usersRes, poliRes] = await Promise.all([
          (supabase as any)
            .from("users")
            .select("id, fullname_users, role_users")
            .eq("id_puskesmas", puskesmas.id),
          (supabase as any)
            .from("poli")
            .select("*")
            .eq("id_puskesmas", puskesmas.id)
            .order("nama_poli"),
        ]);

        const allUsers = (
          (usersRes.data ?? []) as Array<Record<string, unknown>>
        ).map((r, i) => ({
          id: String(r.id ?? i),
          nama: String(r.fullname_users ?? "-"),
          role: String(r.role_users ?? "-"),
        }));

        setAdmins(allUsers.filter((u) => u.role === "admin_puskesmas"));
        setDuUsers(allUsers.filter((u) => u.role === "user_du"));

        const poliRows = (
          (poliRes.data ?? []) as Array<Record<string, unknown>>
        ).map((r, i) => ({
          id: String(r.id ?? i),
          nama: String(r.nama_poli ?? r.nama ?? `Poli ${i + 1}`),
        }));

        // Fetch petugas per poli
        const poliWithPetugas = await Promise.all(
          poliRows.map(async (poli) => {
            const { data } = await (supabase as any)
              .from("users")
              .select("id, fullname_users, role_users")
              .eq("id_poli", poli.id)
              .eq("role_users", "user_poli");
            const petugas = (
              (data ?? []) as Array<Record<string, unknown>>
            ).map((r, i) => ({
              id: String(r.id ?? i),
              nama: String(r.fullname_users ?? "-"),
              role: "user_poli",
            }));
            return { ...poli, petugas };
          }),
        );
        setPoliList(poliWithPetugas);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [puskesmas.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {puskesmas.nama}
          </h1>
          <p className="text-sm text-muted-foreground">
            Statistik dan data pengguna
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Admin Puskesmas */}
          <SectionCard
            title="Admin Puskesmas"
            icon={<Building2 className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-100"
            empty={admins.length === 0}
            emptyText="Belum ada admin puskesmas"
          >
            {admins.map((u) => (
              <UserRowItem
                key={u.id}
                nama={u.nama}
                badge="Admin Puskesmas"
                badgeColor="blue"
                onClick={() => navigate("/app/pengguna")}
              />
            ))}
          </SectionCard>

          {/* Petugas DU */}
          <SectionCard
            title="Petugas Daftar Umum"
            icon={<Users className="h-4 w-4 text-green-600" />}
            iconBg="bg-green-100"
            empty={duUsers.length === 0}
            emptyText="Belum ada petugas DU"
          >
            {duUsers.map((u) => (
              <UserRowItem
                key={u.id}
                nama={u.nama}
                badge="Petugas DU"
                badgeColor="green"
                onClick={() => navigate("/app/pengguna")}
              />
            ))}
          </SectionCard>

          {/* Poli & Petugas */}
          <SectionCard
            title="Poli & Petugas"
            icon={<Layers className="h-4 w-4 text-purple-600" />}
            iconBg="bg-purple-100"
            empty={poliList.length === 0}
            emptyText="Belum ada poli"
          >
            {poliList.map((poli) => (
              <div
                key={poli.id}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <p className="text-sm font-semibold text-foreground">
                  {poli.nama}
                </p>
                {poli.petugas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Belum ada petugas
                  </p>
                ) : (
                  poli.petugas.map((p) => (
                    <UserRowItem
                      key={p.id}
                      nama={p.nama}
                      badge="Petugas Poli"
                      badgeColor="yellow"
                      onClick={() => navigate("/app/pengguna")}
                    />
                  ))
                )}
              </div>
            ))}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ── Admin Puskesmas: list poli → klik → detail ────────────────────────────────

function AdminPuskesmasView() {
  const { user } = useAuth();
  const [list, setList] = useState<Poli[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Poli | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchList = async () => {
    if (!user?.id_puskesmas) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("poli")
        .select("*")
        .eq("id_puskesmas", user.id_puskesmas)
        .order("nama_poli");
      setList(
        ((data ?? []) as Array<Record<string, unknown>>).map((r, i) => ({
          id: String(r.id ?? i),
          nama: String(r.nama_poli ?? r.nama ?? `Poli ${i + 1}`),
          idPuskesmas: String(r.id_puskesmas ?? ""),
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [user?.id_puskesmas]);

  if (selected) {
    return <PoliDetailView poli={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Poli</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Klik poli untuk melihat petugas dan riwayat KK
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Poli
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data poli...
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 py-10 text-center px-6">
          <Layers className="h-10 w-10 mx-auto text-amber-400 mb-3" />
          <p className="text-sm font-semibold text-amber-800">
            Belum ada data poli
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Tambahkan poli terlebih dahulu sebelum mendaftarkan petugas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Layers className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {p.nama}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {addOpen && (
        <AddPoliModal
          idPuskesmas={user?.id_puskesmas ?? ""}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            fetchList();
          }}
        />
      )}
    </div>
  );
}

// ── Poli Detail View (level 2 admin puskesmas) ────────────────────────────────

function PoliDetailView({ poli, onBack }: { poli: Poli; onBack: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [petugas, setPetugas] = useState<UserRow[]>([]);
  const [kakList, setKakList] = useState<KakRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [petugasRes, kakRes] = await Promise.all([
          (supabase as any)
            .from("users")
            .select("id, fullname_users, role_users")
            .eq("id_poli", poli.id)
            .eq("role_users", "user_poli"),
          (supabase as any)
            .from("kartu_asuhan_keperawatan")
            .select("id, id_keluarga, tanggal, nama_anggota")
            .eq("id_poli", poli.id)
            .order("tanggal", { ascending: false })
            .limit(50),
        ]);

        setPetugas(
          ((petugasRes.data ?? []) as Array<Record<string, unknown>>).map(
            (r, i) => ({
              id: String(r.id ?? i),
              nama: String(r.fullname_users ?? "-"),
              role: "user_poli",
            }),
          ),
        );

        // Fetch nama kepala keluarga
        const kakRows = (kakRes.data ?? []) as Array<Record<string, unknown>>;
        const keluargaIds = [
          ...new Set(kakRows.map((r) => r.id_keluarga).filter(Boolean)),
        ];
        let kkMap = new Map<string, string>();

        if (keluargaIds.length > 0) {
          const { data: kkData } = await (supabase as any)
            .from("keluarga")
            .select("id, nama_kepala_keluarga")
            .in("id", keluargaIds);
          kkMap = new Map(
            ((kkData ?? []) as Array<Record<string, unknown>>).map((r) => [
              String(r.id),
              String(r.nama_kepala_keluarga ?? "-"),
            ]),
          );
        }

        setKakList(
          kakRows.map((r, i) => ({
            id: String(r.id ?? i),
            namaKepala: kkMap.get(String(r.id_keluarga ?? "")) ?? "-",
            namaAnggota: String(r.nama_anggota ?? "-"),
            tanggal: String(r.tanggal ?? r.created_at ?? ""),
            idKak: String(r.id ?? i),
            idKeluarga: String(r.id_keluarga ?? ""),
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [poli.id]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{poli.nama}</h1>
          <p className="text-sm text-muted-foreground">
            Petugas dan riwayat kartu asuhan
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-muted-foreground">
          <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Memuat data...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Petugas */}
          <SectionCard
            title="Petugas Poli"
            icon={<Users className="h-4 w-4 text-yellow-600" />}
            iconBg="bg-yellow-100"
            empty={petugas.length === 0}
            emptyText="Belum ada petugas di poli ini"
          >
            {petugas.map((p) => (
              <UserRowItem
                key={p.id}
                nama={p.nama}
                badge="Petugas Poli"
                badgeColor="yellow"
                onClick={() => navigate("/app/pengguna")}
              />
            ))}
          </SectionCard>

          {/* Riwayat KK */}
          <SectionCard
            title="Riwayat Kartu Asuhan Keperawatan"
            icon={<FileText className="h-4 w-4 text-green-600" />}
            iconBg="bg-green-100"
            empty={kakList.length === 0}
            emptyText="Belum ada kartu asuhan di poli ini"
          >
            {kakList.map((kak) => (
              <button
                key={kak.id}
                type="button"
                onClick={() => navigate("/app/kartu")}
                className="w-full text-left flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-muted/60 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {kak.namaKepala}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Anggota: {kak.namaAnggota}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {kak.tanggal
                      ? new Date(kak.tanggal).toLocaleDateString("id-ID")
                      : "-"}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  iconBg,
  empty,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <div
          className={`h-7 w-7 rounded-md ${iconBg} flex items-center justify-center`}
        >
          {icon}
        </div>
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <div className="p-4 space-y-2">
        {empty ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
};

function UserRowItem({
  nama,
  badge,
  badgeColor,
  onClick,
}: {
  nama: string;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/60 transition-colors group"
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">
            {nama.charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">{nama}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BADGE_STYLES[badgeColor] ?? BADGE_STYLES.blue}`}
        >
          {badge}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
}

// ─── Add Puskesmas Modal ──────────────────────────────────────────────────────

function AddPuskesmasModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!nama.trim()) nextErrors.nama = "Nama puskesmas wajib diisi";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("puskesmas").insert({
        nama_puskesmas: nama.trim(),
        alamat_puskesmas: alamat.trim() || null,
      });

      if (error) throw error;

      toast.success("Puskesmas berhasil ditambahkan");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menambahkan puskesmas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Tambah Puskesmas
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="nama-puskesmas"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Nama Puskesmas*
              </label>
              <input
                id="nama-puskesmas"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Puskesmas Jenangan"
              />
              {errors.nama && (
                <p className="text-xs text-red-600 mt-1">{errors.nama}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="alamat-puskesmas"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Alamat{" "}
                <span className="text-muted-foreground/60">(opsional)</span>
              </label>
              <input
                id="alamat-puskesmas"
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Jl. Contoh..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70 transition-opacity"
            >
              {submitting && (
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Poli Modal ───────────────────────────────────────────────────────────

function AddPoliModal({
  idPuskesmas,
  onClose,
  onSuccess,
}: {
  idPuskesmas: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nama, setNama] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const nextErrors: Record<string, string> = {};
    if (!nama.trim()) nextErrors.nama = "Nama poli wajib diisi";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("poli").insert({
        nama_poli: nama.trim(),
        id_puskesmas: idPuskesmas,
      });

      if (error) throw error;

      toast.success("Poli berhasil ditambahkan");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal menambahkan poli");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Tambah Poli</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="nama-poli"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Nama Poli*
            </label>
            <input
              id="nama-poli"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Poli Gigi, Poli Umum, ..."
            />
            {errors.nama && (
              <p className="text-xs text-red-600 mt-1">{errors.nama}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70 transition-opacity"
            >
              {submitting && (
                <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              )}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
