import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PublicHeader from "@/components/PublicHeader";
import sikakLogo from "@/assets/sikak-logo.png";
import ponorogoLogo from "@/assets/ponorogo-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Database,
  FileText,
  HeartPulse,
  Link,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCircle,
  Users,
  Zap,
  Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const notices = [
  "SIKAK mendukung pencatatan asuhan keperawatan keluarga yang rapi, terukur, dan mudah ditelusuri.",
  "Setiap data keluarga, anggota, poli, dan catatan asuhan dikelola dalam satu alur pelayanan.",
  "Digitalisasi membantu Puskesmas mempercepat dokumentasi dan meningkatkan kualitas layanan.",
];

const services = [
  {
    icon: Database,
    title: "Data Terintegrasi",
    desc: "Keluarga, anggota, puskesmas, poli, dan kartu asuhan tersimpan dalam satu sistem.",
  },
  {
    icon: FileText,
    title: "Kartu Asuhan",
    desc: "Petugas dapat mencatat pengkajian, diagnosis, rencana, dan implementasi keperawatan.",
  },
  {
    icon: Activity,
    title: "Statistik Layanan",
    desc: "Dashboard membantu memantau jumlah keluarga, poli, kartu terbaru, dan petugas aktif.",
  },
  {
    icon: ShieldCheck,
    title: "Akses Bertingkat",
    desc: "Hak akses dipisahkan untuk Dinkes, admin puskesmas, DU, dan petugas poli.",
  },
];

const updates = [
  {
    version: "SIKAK v1.0",
    title: "Rilis Dashboard Publik",
    desc: "Landing, login, dashboard, kartu keluarga, dan kartu asuhan diperbarui dengan UI baru.",
  },
  {
    version: "SIKAK v1.0",
    title: "Mode Grid dan List",
    desc: "Kartu keluarga dan kartu asuhan kini mendukung tampilan grid serta list.",
  },
  {
    version: "SIKAK v1.0",
    title: "Detail KAK Per Kasus",
    desc: "Detail kartu asuhan menampilkan informasi anggota, poli, petugas, tanggal, dan catatan asuhan.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [puskesmas, setPuskesmas] = useState<
    Array<{ id: string; nama: string }>
  >([]);
  const [activeImageSlide, setActiveImageSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImageSlide((prev) => (prev + 1) % 2);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    window.setTimeout(() => {
      document
        .getElementById(location.hash.replace("#", ""))
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [location.hash]);

  useEffect(() => {
    const fetchPuskesmas = async () => {
      const { data } = await (supabase as any)
        .from("puskesmas")
        .select("id, nama_puskesmas")
        .order("nama_puskesmas", { ascending: true })
        .limit(8);
      setPuskesmas(
        ((data ?? []) as Array<Record<string, unknown>>).map((row, idx) => ({
          id: String(row.id ?? idx),
          nama: String(row.nama_puskesmas ?? `Puskesmas ${idx + 1}`),
        })),
      );
    };
    fetchPuskesmas();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <main id="dashboard">
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-cyan-500 px-4 py-14 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
                <img
                  src={ponorogoLogo}
                  alt="Ponorogo"
                  className="h-6 w-6 object-contain"
                />
                Pemerintah Kabupaten Ponorogo
              </div>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
                Digitalisasi Asuhan Keperawatan Keluarga
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50 md:text-lg">
                SIKAK hadir sebagai sistem informasi untuk menghubungkan data
                keluarga, poli, petugas, dan catatan asuhan keperawatan di
                Puskesmas secara akurat dan kolaboratif.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  Login ke Sistem
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("layanan")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="border-white/60 bg-white/10 text-white hover:bg-white/20"
                >
                  Lihat Layanan
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-emerald-950 py-3">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...notices, ...notices].map((notice, index) => (
              <span
                key={`${notice}-${index}`}
                className="mx-8 text-sm font-medium text-emerald-50"
              >
                {notice}
              </span>
            ))}
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-lg">
              <div className="relative h-96 w-full">
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${activeImageSlide * 100}%)`,
                  }}
                >
                  <div className="w-full shrink-0 flex items-center justify-center">
                    <img
                      src="/gambar1.jpeg"
                      alt="SIKAK Konsep 1"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="w-full shrink-0 flex items-center justify-center">
                    <img
                      src="/gambar2.jpeg"
                      alt="SIKAK Konsep 2"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-2 pb-4">
                {[0, 1].map((item) => (
                  <span
                    key={item}
                    className={`h-2 rounded-full transition-all ${activeImageSlide === item ? "w-8 bg-emerald-700" : "w-2 bg-slate-300"}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6 md:pl-6">
              <div>
                <h3 className="text-3xl font-extrabold text-emerald-950">
                  FAQ :
                </h3>
              </div>

              <div className="space-y-3">
                <div className="border-l-4 border-yellow-400 bg-white p-4 rounded">
                  <h4 className="font-bold text-emerald-950 mb-2">
                    Apa pengertian SIKAK?
                  </h4>
                  <p className="text-sm text-slate-700">
                    SIKAK adalah Sistem Informasi Kartu Asuhan Keperawatan -
                    sistem informasi digital untuk mencatat dan mengelola asuhan
                    keperawatan di Puskesmas secara terintegrasi, terstruktur,
                    akurat, dan terlayani.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-400 bg-white p-4 rounded">
                  <h4 className="font-bold text-emerald-950 mb-2">
                    Bagaimana pendekatan SIKAK?
                  </h4>
                  <p className="text-sm text-slate-700">
                    Pendekatan SIKAK dilambangkan melalui logo: fungsi jepit
                    kertas melambangkan nilai satu alat yang menjadi penghubung,
                    menunjukkan keeratan dan tidak saling lepas. Logo berbentuk
                    S dari inisial SIKAK, sedangkan icon ketupat di tengah
                    melambangkan nilai kekuatan dalam menjaga data di dalamnya.
                    Yang paling menonjol adalah icon manusia yang menjadi
                    lambang keluarga yang harmonis karena adanya SIKAK. Semua
                    elemen terintegrasi dalam satu sistem yang kokoh dan
                    terpercaya.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-400 bg-white p-4 rounded">
                  <h4 className="font-bold text-emerald-950 mb-2">
                    Mengapa SIKAK dibutuhkan?
                  </h4>
                  <p className="text-sm text-slate-700">
                    Dokumentasi manual yang tersebar, pencarian data lambat, dan
                    rekap manual dapat menghambat pemantauan pelayanan. SIKAK
                    hadir untuk memperkuat tata kelola data kesehatan keluarga.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-400 bg-white p-4 rounded">
                  <h4 className="font-bold text-emerald-950 mb-2">
                    Apa keunggulan SIKAK?
                  </h4>
                  <p className="text-sm text-slate-700">
                    Terintegrasi, terhubung, efisien, akurat, dan mendukung
                    kolaborasi untuk pelayanan kesehatan yang lebih baik di
                    Puskesmas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="layanan" className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              title="Memperkenalkan Layanan SIKAK"
              desc="Satu alur digital untuk dokumentasi asuhan keperawatan keluarga di Puskesmas."
            />
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {services.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              title="Puskesmas Terdaftar"
              desc="Unit layanan yang terhubung dalam ekosistem SIKAK."
            />
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {puskesmas.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Belum ada data puskesmas yang ditampilkan.
                </div>
              ) : (
                puskesmas.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Building2 className="h-5 w-5 text-emerald-700" />
                    <span className="text-sm font-semibold text-slate-700">
                      {item.nama}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="riwayat" className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              title="Riwayat Pembaruan"
              desc="Catatan versi dan peningkatan layanan SIKAK."
            />
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {updates.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {item.version}
                  </span>
                  <h3 className="mt-4 font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="latar-belakang"
          className="bg-emerald-950 px-4 py-16 text-white"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Latar Belakang
              </p>
              <h2 className="mt-3 text-3xl font-extrabold">
                Mengapa SIKAK Hadir?
              </h2>
              <p className="mt-5 leading-relaxed text-emerald-50">
                Dokumentasi asuhan keperawatan keluarga yang tersebar, pencarian
                data yang lambat, dan rekap manual dapat menghambat pemantauan
                pelayanan. SIKAK hadir untuk membantu Pemerintah Kabupaten
                Ponorogo memperkuat tata kelola data kesehatan keluarga di
                Puskesmas.
              </p>
            </div>
            <div className="grid gap-4">
              <ProblemCard
                icon={FileText}
                title="Permasalahan"
                desc="Pencatatan manual sulit ditelusuri, rawan duplikasi, dan membutuhkan waktu saat rekap."
              />
              <ProblemCard
                icon={Link}
                title="Solusi SIKAK"
                desc="Data keluarga, poli, petugas, dan kartu asuhan disatukan dalam alur digital."
              />
              <ProblemCard
                icon={Zap}
                title="Manfaat Pemerintahan"
                desc="Monitoring layanan lebih cepat, laporan lebih siap, dan keputusan berbasis data lebih mudah dilakukan."
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-3xl font-extrabold text-emerald-950">
              TimDoubleA
            </h2>
            <div className="mt-10 grid grid-cols-1 items-end gap-8 md:grid-cols-2">
              <TeamMember name="Bagus Argana" role="Frontend" side="left" />
              <TeamMember
                name="Aurina Putri Alifa Haryanto"
                role="Backend"
                side="right"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={sikakLogo}
                alt="SIKAK"
                className="h-10 w-10 object-contain"
              />
              <div>
                <p className="font-bold">SIKAK v1.0</p>
                <p className="text-sm text-slate-300">
                  Sistem Informasi Kartu Asuhan Keperawatan
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-300">
              Didukung oleh TimDoubleA, SMKN 1 Jenangan, dan Dinas Kesehatan
              Ponorogo. Dipersembahkan oleh Layanan Hubungan Masyarakat.
            </p>
          </div>

          <div>
            <p className="font-bold">Kontak</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> humas@sikak-ponorogo.id
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Dinas Kesehatan Ponorogo
              </p>
              <p className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" /> Portfolio TimDoubleA
              </p>
            </div>
          </div>

          <div>
            <p className="font-bold">Kolaborasi</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>TimDoubleA</p>
              <p>SMKN 1 Jenangan</p>
              <p>Dinas Kesehatan Ponorogo</p>
              <p>Layanan Hubungan Masyarakat</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-5 text-center text-xs text-slate-400">
          Copyright © 2026 Pemerintah Kabupaten Ponorogo
        </div>
      </footer>
    </div>
  );
}

function HeroCarousel({ activeSlide }: { activeSlide: number }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white/95 p-5 shadow-2xl">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        <CarouselSlide>
          <div className="grid grid-cols-2 gap-3">
            <VisualTile
              className="col-span-2 min-h-44"
              title="SIKAK"
              subtitle="Terintegrasi, akurat, kolaboratif"
            >
              <img
                src={sikakLogo}
                alt="SIKAK"
                className="h-28 w-28 object-contain"
              />
            </VisualTile>
            <VisualTile title="Data Keluarga" subtitle="Kartu keluarga digital">
              <Users className="h-10 w-10 text-emerald-700" />
            </VisualTile>
            <VisualTile title="Asuhan" subtitle="Catatan per kasus">
              <Stethoscope className="h-10 w-10 text-cyan-600" />
            </VisualTile>
            <VisualTile
              className="col-span-2"
              title="Puskesmas Terhubung"
              subtitle="Monitoring pelayanan lintas unit"
            >
              <Building2 className="h-10 w-10 text-emerald-700" />
            </VisualTile>
          </div>
        </CarouselSlide>

        <CarouselSlide>
          <div className="flex min-h-[560px] flex-col justify-between rounded-3xl bg-slate-50 p-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={ponorogoLogo}
                  alt="Ponorogo"
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    Dinas Kesehatan
                  </p>
                  <p className="text-xl font-bold text-slate-700">
                    Kabupaten Ponorogo
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-emerald-800">
                <span># Bangga Melayani Bangsa</span>
                <span>Ponorogo Hebat</span>
              </div>
            </div>
            <div className="text-center">
              <img
                src={sikakLogo}
                alt="SIKAK"
                className="mx-auto h-28 w-28 object-contain"
              />
              <p className="mt-5 text-3xl font-extrabold tracking-[0.3em] text-emerald-950">
                SIKAK
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Untuk Puskesmas, untuk pelayanan yang lebih baik.
              </p>
            </div>
          </div>
        </CarouselSlide>

        <CarouselSlide>
          <div className="min-h-[560px] rounded-3xl bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-7">
            <div className="flex h-full flex-col justify-center">
              <img
                src={sikakLogo}
                alt="SIKAK"
                className="mx-auto h-32 w-32 object-contain"
              />
              <h3 className="mt-6 text-center text-2xl font-extrabold text-emerald-950">
                Digitalisasi Asuhan Keperawatan yang Efisien
              </h3>
              <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-slate-600">
                Menghubungkan data keluarga, petugas, poli, dan catatan asuhan
                dalam sistem yang mudah dipantau dan siap mendukung pelayanan.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["Terintegrasi", "Terhubung", "Efisien", "Akurat"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-white p-4 text-center text-sm font-bold text-emerald-800 shadow-sm"
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </CarouselSlide>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className={`h-2 rounded-full transition-all ${activeSlide === item ? "w-8 bg-emerald-700" : "w-2 bg-slate-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselSlide({ children }: { children: React.ReactNode }) {
  return <div className="w-full shrink-0">{children}</div>;
}

function VisualTile({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-36 flex-col items-center justify-center rounded-2xl bg-slate-50 p-5 text-center ${className}`}
    >
      {children}
      <p className="mt-3 font-bold text-emerald-950">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-extrabold text-slate-900">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        {desc}
      </p>
    </div>
  );
}

function ProblemCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof FileText;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-emerald-300" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-emerald-50">{desc}</p>
    </div>
  );
}

function TeamMember({
  name,
  role,
  side,
}: {
  name: string;
  role: string;
  side: "left" | "right";
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-36 w-36 items-center justify-center rounded-full shadow-lg ${
          side === "right"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-emerald-950 text-white"
        }`}
      >
        <UserCircle className="h-28 w-28" />
      </div>
      <p className="mt-4 text-lg font-bold text-slate-900">{name}</p>
      <p className="text-sm font-semibold text-emerald-700">{role}</p>
    </div>
  );
}
