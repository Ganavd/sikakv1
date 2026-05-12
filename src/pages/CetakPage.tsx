import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { exportToPDF } from "@/utils/pdfExport";
import { FamilyCareCard, CareReportRow } from "@/types/careCard";

type KakData = {
  id: string;
  kode: string;
  namaPuskesmas: string;
  namaKepala: string;
  namaAnggota: string;
  telepon: string;
  alamat: string;
  masalahKesehatan: string;
  namaPoli: string;
  tanggal: string;
};

type KakRow = {
  id: string;
  tanggal: string;
  dataPengkajian: string;
  diagnosisKeperawatan: string;
  rencanaIntervensi: string;
  implementasi: string;
  petugasKesehatan: string;
};

export default function CetakPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [kak, setKak] = useState<KakData | null>(null);
  const [rows, setRows] = useState<KakRow[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeIdentitas, setIncludeIdentitas] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("kartu_asuhan_keperawatan")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Kartu asuhan tidak ditemukan");
        navigate("/");
        return;
      }

      const keluargaId = data.id_keluarga ?? data.keluarga_id;
      const anggotaId =
        data.id_anggota_keluarga ?? data.id_anggota ?? data.anggota_id;
      const poliId = data.id_poli ?? data.poli_id;
      const puskesmasId = data.id_puskesmas ?? data.puskesmas_id;

      const [keluargaRes, anggotaRes, poliRes, puskesmasRes] =
        await Promise.all([
          keluargaId
            ? (supabase as any)
                .from("keluarga")
                .select("*")
                .eq("id", keluargaId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          anggotaId
            ? (supabase as any)
                .from("anggota_keluarga")
                .select("nama")
                .eq("id", anggotaId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          poliId
            ? (supabase as any)
                .from("poli")
                .select("nama_poli")
                .eq("id", poliId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          puskesmasId
            ? (supabase as any)
                .from("puskesmas")
                .select("nama_puskesmas")
                .eq("id", puskesmasId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

      setKak({
        id: String(data.id),
        kode: String(keluargaRes.data?.kode ?? data.kode ?? "-"),
        namaPuskesmas: String(
          puskesmasRes.data?.nama_puskesmas ?? data.nama_puskesmas ?? "-",
        ),
        namaKepala: String(
          keluargaRes.data?.nama_kepala_keluarga ?? data.nama_kepala ?? "-",
        ),
        namaAnggota: String(anggotaRes.data?.nama ?? data.nama_anggota ?? "-"),
        telepon: String(keluargaRes.data?.telp_keluarga ?? data.telp ?? "-"),
        alamat: String(keluargaRes.data?.alamat_keluarga ?? data.alamat ?? "-"),
        masalahKesehatan: String(
          keluargaRes.data?.masalah_kesehatan ?? data.masalah_kesehatan ?? "-",
        ),
        namaPoli: String(poliRes.data?.nama_poli ?? data.nama_poli ?? "-"),
        tanggal: String(data.tanggal ?? data.created_at ?? ""),
      });

      // Fetch rows
      const { data: rowsData } = await (supabase as any)
        .from("kak_rows")
        .select("*")
        .eq("id_kak", id)
        .order("created_at", { ascending: true });

      const mapped: KakRow[] = (
        (rowsData ?? []) as Array<Record<string, unknown>>
      ).map((row, i) => ({
        id: String(row.id ?? i),
        tanggal: String(row.tanggal ?? row.created_at ?? ""),
        dataPengkajian: String(row.data_pengkajian ?? row.pengkajian ?? "-"),
        diagnosisKeperawatan: String(
          row.diagnosis_keperawatan ?? row.diagnosis ?? "-",
        ),
        rencanaIntervensi: String(
          row.rencana_intervensi ?? row.intervensi ?? "-",
        ),
        implementasi: String(row.implementasi ?? "-"),
        petugasKesehatan: String(row.petugas_kesehatan ?? row.petugas ?? "-"),
      }));
      setRows(mapped);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const generateFileName = () => {
    if (!kak) return "kartu_asuhan.pdf";
    const timestamp = new Date().toISOString().split("T")[0];
    return `SIKAK_${kak.namaKepala.replace(/\s+/g, "_")}_${timestamp}.pdf`;
  };

  const handleOpenPrintModal = () => {
    setShowPrintModal(true);
  };

  const handleGeneratePDF = () => {
    if (!kak) return;

    try {
      const familyCard: FamilyCareCard = {
        id: kak.id,
        kepala_keluarga: kak.namaKepala,
        alamat: kak.alamat,
        telp: kak.telepon,
        kode: kak.kode,
        puskesmas: kak.namaPuskesmas,
        masalah_kesehatan: kak.masalahKesehatan,
        poli: kak.namaPoli,
      };

      const careRows: CareReportRow[] = rows.map((row) => ({
        id: row.id,
        tanggal: row.tanggal,
        data_pengkajian: row.dataPengkajian,
        diagnosis: row.diagnosisKeperawatan,
        rencana_intervensi: row.rencanaIntervensi,
        implementasi: row.implementasi,
        evaluasi_s: "",
        evaluasi_o: "",
        evaluasi_a: "",
        evaluasi_p: "",
        petugas: row.petugasKesehatan,
      }));

      exportToPDF(familyCard, careRows, {
        includeHeader,
        includeIdentitas,
      });

      toast.success("PDF berhasil dibuat");
      setShowPrintModal(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal membuat PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!kak) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="text-center text-gray-500">Data tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex gap-2 print:hidden">
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button
          onClick={handleOpenPrintModal}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          <Printer className="mr-2 h-4 w-4" />
          Cetak PDF
        </Button>
      </div>

      <div className="mx-auto max-w-4xl bg-white p-8 print:p-0">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            KARTU ASUHAN KEPERAWATAN KELUARGA
          </h1>
        </div>

        {/* Info Section */}
        <div className="mb-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="mb-4">
              <span className="font-semibold text-slate-700">Puskesmas</span>
              <p className="text-slate-900">: {kak.namaPuskesmas}</p>
            </div>
            <div className="mb-4">
              <span className="font-semibold text-slate-700">
                Nama Kepala Keluarga
              </span>
              <p className="text-slate-900">: {kak.namaKepala}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Alamat</span>
              <p className="text-slate-900">: {kak.alamat}</p>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="font-semibold text-slate-700">Kode</span>
              <p className="text-slate-900">: {kak.kode}</p>
            </div>
            <div className="mb-4">
              <span className="font-semibold text-slate-700">Telp/Ponsel</span>
              <p className="text-slate-900">: {kak.telepon}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">
                Masalah Kesehatan
              </span>
              <p className="text-slate-900">: {kak.masalahKesehatan}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Tanggal
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Data Pengkajian
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Diagnosis Keperawatan
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Rencana Intervensi
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Implementasi
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left font-bold">
                  Petugas
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-slate-300 px-3 py-2 text-center text-slate-500"
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.tanggal}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.dataPengkajian}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.diagnosisKeperawatan}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.rencanaIntervensi}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.implementasi}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {row.petugasKesehatan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-600">
          <p>Dicetak pada: {new Date().toLocaleDateString("id-ID")}</p>
        </div>
      </div>

      {/* Print Preview Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilihan Cetak PDF</DialogTitle>
            <DialogDescription>
              Pilih bagian yang ingin disertakan dalam PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-header"
                checked={includeHeader}
                onCheckedChange={(checked) =>
                  setIncludeHeader(checked as boolean)
                }
              />
              <Label
                htmlFor="include-header"
                className="cursor-pointer font-medium"
              >
                Sertakan Header (Puskesmas & Tanggal Cetak)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-identitas"
                checked={includeIdentitas}
                onCheckedChange={(checked) =>
                  setIncludeIdentitas(checked as boolean)
                }
              />
              <Label
                htmlFor="include-identitas"
                className="cursor-pointer font-medium"
              >
                Sertakan Data Identitas Keluarga (Nama, Alamat, Kode, Telp)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintModal(false)}>
              Batal
            </Button>
            <Button
              onClick={handleGeneratePDF}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body {
            background-color: white;
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
