import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, Download, Filter } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToPDF } from "@/utils/pdfExport";
import { FamilyCareCard, CareReportRow } from "@/types/careCard";

type KakRowDisplay = {
  id: string;
  tanggal: string;
  dataPengkajian: string;
  diagnosisKeperawatan: string;
  rencanaIntervensi: string;
  implementasi: string;
  petugasKesehatan: string;
  namaAnggota: string;
};

type KeluargaData = {
  id: string;
  nama_kepala_keluarga: string;
  alamat: string;
  telp_keluarga: string;
  kode: string;
  masalah_kesehatan: string;
  nama_puskesmas: string;
};

type AnggotaInfo = {
  id: string;
  nama: string;
};

export default function Flow2Page() {
  const { id_keluarga } = useParams<{ id_keluarga: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [keluarga, setKeluarga] = useState<KeluargaData | null>(null);
  const [kakRows, setKakRows] = useState<KakRowDisplay[]>([]);
  const [anggotaList, setAnggotaList] = useState<AnggotaInfo[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filterAnggota, setFilterAnggota] = useState<string>("all");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeIdentitas, setIncludeIdentitas] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id_keluarga) {
        toast.error("ID Keluarga tidak ditemukan");
        navigate("/app/kartu");
        return;
      }

      setIsLoading(true);
      try {
        // Fetch keluarga data
        const { data: keluargaData, error: keluargaError } = await (
          supabase as any
        )
          .from("keluarga")
          .select(
            "id, nama_kepala_keluarga, alamat_keluarga, telp_keluarga, kode, masalah_kesehatan, id_puskesmas",
          )
          .eq("id", id_keluarga)
          .maybeSingle();

        if (keluargaError) throw keluargaError;
        if (!keluargaData) {
          toast.error("Keluarga tidak ditemukan");
          navigate("/app/kartu");
          return;
        }

        // Fetch puskesmas
        const puskesmasId = keluargaData.id_puskesmas;
        let puskesmasName = "-";
        if (puskesmasId) {
          const { data: puskesmasData } = await (supabase as any)
            .from("puskesmas")
            .select("nama_puskesmas")
            .eq("id", puskesmasId)
            .maybeSingle();
          if (puskesmasData) {
            puskesmasName = puskesmasData.nama_puskesmas;
          }
        }

        setKeluarga({
          id: keluargaData.id,
          nama_kepala_keluarga: keluargaData.nama_kepala_keluarga || "-",
          alamat: keluargaData.alamat_keluarga || "-",
          telp_keluarga: keluargaData.telp_keluarga || "-",
          kode: keluargaData.kode || "-",
          masalah_kesehatan: keluargaData.masalah_kesehatan || "-",
          nama_puskesmas: puskesmasName,
        });

        // Fetch anggota keluarga
        const { data: anggotaData, error: anggotaError } = await (
          supabase as any
        )
          .from("anggota_keluarga")
          .select("id, nama")
          .eq("id_keluarga", id_keluarga)
          .order("urutan", { ascending: true });

        if (anggotaError) throw anggotaError;
        setAnggotaList(anggotaData || []);

        // Fetch KAK data
        const { data: kakData, error: kakError } = await (supabase as any)
          .from("kartu_asuhan_keperawatan")
          .select("id, id_anggota_keluarga")
          .eq("id_keluarga", id_keluarga);

        if (kakError) throw kakError;

        // Fetch all kak_rows for this family
        const kakIds = (kakData || []).map((k) => k.id);
        if (kakIds.length === 0) {
          setKakRows([]);
          return;
        }

        const { data: rowsData, error: rowsError } = await (supabase as any)
          .from("kak_rows")
          .select("*")
          .in("id_kak", kakIds)
          .order("created_at", { ascending: true });

        if (rowsError) throw rowsError;

        // Build anggota map
        const anggotaMap = new Map(
          anggotaData?.map((a) => [a.id, a.nama]) || [],
        );

        // Map kak_rows to display format
        const kakMap = new Map(
          kakData?.map((k) => [k.id, k.id_anggota_keluarga]) || [],
        );
        const mappedRows: KakRowDisplay[] = (rowsData || []).map(
          (row, idx) => ({
            id: String(row.id ?? idx),
            tanggal: String(row.tanggal ?? row.created_at ?? ""),
            dataPengkajian: String(
              row.data_pengkajian ?? row.pengkajian ?? "-",
            ),
            diagnosisKeperawatan: String(
              row.diagnosis_keperawatan ?? row.diagnosis ?? "-",
            ),
            rencanaIntervensi: String(
              row.rencana_intervensi ?? row.intervensi ?? "-",
            ),
            implementasi: String(row.implementasi ?? "-"),
            petugasKesehatan: String(
              row.petugas_kesehatan ?? row.petugas ?? "-",
            ),
            namaAnggota:
              anggotaMap.get(String(kakMap.get(String(row.id_kak)) || "")) ||
              "Anggota",
          }),
        );

        setKakRows(mappedRows);
      } catch (err: any) {
        toast.error(err?.message ?? "Gagal memuat data keluarga");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id_keluarga, navigate]);

  const filteredRows =
    filterAnggota === "all"
      ? kakRows
      : kakRows.filter((row) => row.namaAnggota === filterAnggota);

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((row) => row.id)));
    }
  };

  const handleGeneratePDF = () => {
    if (!keluarga) return;

    try {
      // Determine rows to print
      const rowsToPrint =
        selectedRows.size > 0
          ? kakRows.filter((row) => selectedRows.has(row.id))
          : filteredRows;

      if (rowsToPrint.length === 0) {
        toast.error("Tidak ada data yang dipilih untuk dicetak");
        return;
      }

      const familyCard: FamilyCareCard = {
        id: keluarga.id,
        kepala_keluarga: keluarga.nama_kepala_keluarga,
        alamat: keluarga.alamat,
        telp: keluarga.telp_keluarga,
        kode: keluarga.kode,
        puskesmas: keluarga.nama_puskesmas,
        masalah_kesehatan: keluarga.masalah_kesehatan,
      };

      const careRows: CareReportRow[] = rowsToPrint.map((row) => ({
        id: row.id,
        card_id: keluarga.id,
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
        created_at: new Date().toISOString(),
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

  if (!keluarga) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button
          onClick={() => navigate("/app/kartu")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="text-center text-gray-500">
          Data keluarga tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => navigate("/app/kartu")}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Kartu Asuhan Keluarga: {keluarga.nama_kepala_keluarga}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Alamat: {keluarga.alamat} | Telp: {keluarga.telp_keluarga}
          </p>
        </div>
        <Button
          onClick={() => setShowPrintModal(true)}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          <Printer className="mr-2 h-4 w-4" />
          Cetak PDF
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Puskesmas</p>
          <p className="text-lg font-semibold text-foreground">
            {keluarga.nama_puskesmas}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Masalah Kesehatan</p>
          <p className="text-lg font-semibold text-foreground">
            {keluarga.masalah_kesehatan}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={filterAnggota} onValueChange={setFilterAnggota}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter berdasarkan anggota..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Anggota</SelectItem>
            {anggotaList.map((anggota) => (
              <SelectItem key={anggota.id} value={anggota.nama}>
                {anggota.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Counter */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>
          Total: <strong className="text-foreground">{kakRows.length}</strong>
        </span>
        <span>
          Hasil:{" "}
          <strong className="text-foreground">{filteredRows.length}</strong>
        </span>
        {selectedRows.size > 0 && (
          <span>
            Dipilih:{" "}
            <strong className="text-foreground">{selectedRows.size}</strong>
          </span>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Tidak ada data kartu asuhan
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua baris"
                      checked={
                        filteredRows.length > 0 &&
                        selectedRows.size === filteredRows.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Anggota
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Data Pengkajian
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Diagnosis
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Rencana Intervensi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Implementasi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Petugas
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${row.namaAnggota}`}
                        checked={selectedRows.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {row.tanggal
                        ? new Date(row.tanggal).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {row.namaAnggota}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {row.dataPengkajian}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {row.diagnosisKeperawatan}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {row.rencanaIntervensi}
                    </td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">
                      {row.implementasi}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {row.petugasKesehatan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilihan Cetak PDF</DialogTitle>
            <DialogDescription>
              Pilih bagian yang ingin disertakan dalam PDF
              {selectedRows.size > 0
                ? ` (${selectedRows.size} baris dipilih)`
                : ` (${filteredRows.length} baris akan dicetak)`}
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
    </div>
  );
}
