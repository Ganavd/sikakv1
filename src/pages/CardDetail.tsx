import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Printer,
  Loader2,
  CalendarDays,
  Building2,
  Stethoscope,
  UserRound,
  Download,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { exportToPDF } from "@/utils/pdfExport";
import { FamilyCareCard, CareReportRow } from "@/types/careCard";

type KakHeader = {
  id: string;
  kode: string;
  alamat: string;
  telepon: string;
  masalahKesehatan: string;
  namaPuskesmas: string;
  namaKepala: string;
  namaAnggota: string;
  namaPoli: string;
  tanggal: string;
  status: string;
};

type KakRow = {
  id: string;
  tanggal: string;
  dataPengkajian: string;
  diagnosisKeperawatan: string;
  rencanaIntervensi: string;
  implementasi: string;
  petugasKesehatan: string;
  createdAt: string;
};

type KakRowForm = {
  data_pengkajian: string;
  diagnosis_keperawatan: string;
  rencana_intervensi: string;
  implementasi: string;
  petugas_kesehatan: string;
};

const EMPTY_FORM: KakRowForm = {
  data_pengkajian: "",
  diagnosis_keperawatan: "",
  rencana_intervensi: "",
  implementasi: "",
  petugas_kesehatan: "",
};

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [kak, setKak] = useState<KakHeader | null>(null);
  const [rows, setRows] = useState<KakRow[]>([]);
  const [isRowsLoading, setIsRowsLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [form, setForm] = useState<KakRowForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeIdentitas, setIncludeIdentitas] = useState(true);

  const fetchKak = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("kartu_asuhan_keperawatan")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

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
        alamat: String(keluargaRes.data?.alamat_keluarga ?? data.alamat ?? "-"),
        telepon: String(keluargaRes.data?.telp_keluarga ?? data.telp ?? "-"),
        masalahKesehatan: String(
          keluargaRes.data?.masalah_kesehatan ?? data.masalah_kesehatan ?? "-",
        ),
        namaPuskesmas: String(
          puskesmasRes.data?.nama_puskesmas ??
            data.nama_puskesmas ??
            keluargaRes.data?.nama_puskesmas ??
            "-",
        ),
        namaKepala: String(
          keluargaRes.data?.nama_kepala_keluarga ??
            data.nama_kepala_keluarga ??
            data.nama_kepala ??
            "-",
        ),
        namaAnggota: String(
          anggotaRes.data?.nama ?? data.nama_anggota ?? data.nama_pasien ?? "-",
        ),
        namaPoli: String(
          poliRes.data?.nama_poli ?? data.nama_poli ?? data.poli ?? "-",
        ),
        tanggal: String(
          data.tanggal ?? data.tanggal_kunjungan ?? data.created_at ?? "",
        ),
        status: String(data.status ?? "pending"),
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Gagal memuat kartu asuhan");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRows = async () => {
    if (!id) return;
    setIsRowsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("kak_rows")
        .select("*")
        .eq("id_kak", id)
        .order("created_at", { ascending: true });

      const mapped: KakRow[] = (
        (data ?? []) as Array<Record<string, unknown>>
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
        createdAt: String(row.created_at ?? ""),
      }));
      setRows(mapped);
    } finally {
      setIsRowsLoading(false);
    }
  };

  useEffect(() => {
    fetchKak();
    fetchRows();
  }, [id]);

  const openAddForm = () => {
    setEditingRowId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (row: KakRow) => {
    setEditingRowId(row.id);
    setForm({
      data_pengkajian: row.dataPengkajian === "-" ? "" : row.dataPengkajian,
      diagnosis_keperawatan:
        row.diagnosisKeperawatan === "-" ? "" : row.diagnosisKeperawatan,
      rencana_intervensi:
        row.rencanaIntervensi === "-" ? "" : row.rencanaIntervensi,
      implementasi: row.implementasi === "-" ? "" : row.implementasi,
      petugas_kesehatan:
        row.petugasKesehatan === "-" ? "" : row.petugasKesehatan,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingRowId) {
        await (supabase as any)
          .from("kak_rows")
          .update(form)
          .eq("id", editingRowId);
        toast.success("Baris berhasil diperbarui");
      } else {
        await (supabase as any)
          .from("kak_rows")
          .insert({ ...form, id_kak: id });
        toast.success("Baris berhasil ditambahkan");
      }
      setShowForm(false);
      setEditingRowId(null);
      setForm(EMPTY_FORM);
      await fetchRows();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (rowId: string) => {
    if (!window.confirm("Hapus baris ini?")) return;
    try {
      await (supabase as any).from("kak_rows").delete().eq("id", rowId);
      toast.success("Baris dihapus");
      await fetchRows();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const handleGeneratePDF = () => {
    if (!kak || rows.length === 0) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }

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
        card_id: kak.id,
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!kak) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Kartu tidak ditemukan</p>
        <button
          type="button"
          onClick={() => navigate("/app/kartu")}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground -ml-1 no-print"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          {kak?.namaAnggota} - {kak?.namaKepala}
        </h1>
        <button
          type="button"
          onClick={() => setShowPrintModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white no-print"
        >
          <Printer className="h-4 w-4" />
          Cetak PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <CaseInfo icon={UserRound} label="Anggota" value={kak.namaAnggota} />
        <CaseInfo icon={Stethoscope} label="Poli" value={kak.namaPoli} />
        <CaseInfo
          icon={CalendarDays}
          label="Tanggal"
          value={
            kak.tanggal
              ? new Date(kak.tanggal).toLocaleDateString("id-ID")
              : "-"
          }
        />
        <CaseInfo
          icon={Building2}
          label="Puskesmas"
          value={kak.namaPuskesmas}
        />
        <CaseInfo label="Kepala Keluarga" value={kak.namaKepala} />
        <CaseInfo label="Petugas" value={rows[0]?.petugasKesehatan ?? "-"} />
        <CaseInfo
          label="Status"
          value={kak.status === "selesai" ? "Selesai" : "Pending"}
        />
        <CaseInfo label="Kode KK" value={kak.kode} />
      </div>

      {/* Rows Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between no-print">
          <h2 className="text-lg font-semibold text-foreground">
            Catatan Asuhan Keperawatan
          </h2>
          {!showForm && (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Catatan
            </button>
          )}
        </div>

        {/* Inline form */}
        {showForm && (
          <form
            onSubmit={handleSave}
            className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 no-print"
          >
            <p className="text-sm font-semibold text-foreground">
              {editingRowId ? "Edit Catatan" : "Tambah Catatan Baru"}
            </p>
            {[
              { key: "data_pengkajian", label: "Data Pengkajian" },
              { key: "diagnosis_keperawatan", label: "Diagnosis Keperawatan" },
              { key: "rencana_intervensi", label: "Rencana Intervensi" },
              { key: "implementasi", label: "Implementasi" },
              { key: "petugas_kesehatan", label: "Petugas Kesehatan" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {label}
                </label>
                <textarea
                  rows={2}
                  aria-label={label}
                  value={form[key as keyof KakRowForm]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRowId(null);
                }}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving && (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                )}
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Rows list */}
        {isRowsLoading ? (
          <div className="text-sm text-muted-foreground py-4">
            Memuat catatan...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
            Belum ada catatan asuhan. Klik "Tambah Catatan" untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border border-foreground text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-foreground px-3 py-4">
                    Tanggal
                  </th>
                  <th className="border border-foreground px-3 py-4">
                    Data Pengkajian
                  </th>
                  <th className="border border-foreground px-3 py-4">
                    Diagnosis Keperawatan
                  </th>
                  <th className="border border-foreground px-3 py-4">
                    Rencana Intervensi
                  </th>
                  <th className="border border-foreground px-3 py-4">
                    Implementasi
                  </th>
                  <th className="border border-foreground px-3 py-4">
                    Petugas
                  </th>
                  <th className="border border-foreground px-3 py-4 no-print">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-foreground px-3 py-3 align-top">
                      {row.tanggal
                        ? new Date(row.tanggal).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <TableCell value={row.dataPengkajian} />
                    <TableCell value={row.diagnosisKeperawatan} />
                    <TableCell value={row.rencanaIntervensi} />
                    <TableCell value={row.implementasi} />
                    <TableCell value={row.petugasKesehatan} />
                    <td className="border border-foreground px-3 py-3 align-top no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

function TableCell({ value }: { value: string }) {
  return (
    <td className="border border-foreground px-3 py-3 align-top whitespace-pre-wrap">
      {value || "-"}
    </td>
  );
}
