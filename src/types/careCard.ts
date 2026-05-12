export interface FamilyCareCard {
  id: string;
  puskesmas: string;
  kepala_keluarga: string;
  alamat: string;
  kode: string | null;
  telp: string | null;
  masalah_kesehatan: string | null;
  poli?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CareReportRow {
  id: string;
  card_id: string;
  tanggal: string;
  data_pengkajian: string | null;
  diagnosis: string | null;
  rencana_intervensi: string | null;
  implementasi: string | null;
  evaluasi_s: string | null;
  evaluasi_o: string | null;
  evaluasi_a: string | null;
  evaluasi_p: string | null;
  petugas: string | null;
  created_at: string;
}

export interface NewCareReportRow {
  card_id: string;
  tanggal: string;
  data_pengkajian: string;
  diagnosis: string;
  rencana_intervensi: string;
  implementasi: string;
  evaluasi_s: string;
  evaluasi_o: string;
  evaluasi_a: string;
  evaluasi_p: string;
  petugas: string;
}

export interface CardFormData {
  puskesmas: string;
  kepala_keluarga: string;
  alamat: string;
  kode: string;
  telp: string;
  masalah_kesehatan: string;
}
