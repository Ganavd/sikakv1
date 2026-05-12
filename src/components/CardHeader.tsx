import { CardFormData } from "@/types/careCard";

interface CardHeaderProps {
  formData: CardFormData;
  onChange: (field: keyof CardFormData, value: string) => void;
  isEditing?: boolean;
}

export function CardHeader({ formData, onChange, isEditing = true }: CardHeaderProps) {
  return (
    <div className="card-document">
      {/* Title */}
      <div className="header-document">
        KARTU ASUHAN KEPERAWATAN KELUARGA
      </div>
      
      {/* Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left Column */}
        <div className="border-r-0 md:border-r-2 border-document-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Puskesmas</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.puskesmas}
                onChange={(e) => onChange("puskesmas", e.target.value)}
                className="input-field flex-1"
                placeholder="Nama Puskesmas"
                required
              />
            ) : (
              <span className="flex-1">{formData.puskesmas}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Nama Kepala Keluarga</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.kepala_keluarga}
                onChange={(e) => onChange("kepala_keluarga", e.target.value)}
                className="input-field flex-1"
                placeholder="Nama Kepala Keluarga"
                required
              />
            ) : (
              <span className="flex-1">{formData.kepala_keluarga}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Alamat</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => onChange("alamat", e.target.value)}
                className="input-field flex-1"
                placeholder="Alamat Lengkap"
                required
              />
            ) : (
              <span className="flex-1">{formData.alamat}</span>
            )}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Kode</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.kode}
                onChange={(e) => onChange("kode", e.target.value)}
                className="input-field flex-1"
                placeholder="Kode"
              />
            ) : (
              <span className="flex-1">{formData.kode || "-"}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Telp/Ponsel</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.telp}
                onChange={(e) => onChange("telp", e.target.value)}
                className="input-field flex-1"
                placeholder="Nomor Telepon"
              />
            ) : (
              <span className="flex-1">{formData.telp || "-"}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="w-32 font-medium text-sm">Masalah Kesehatan</label>
            <span>:</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.masalah_kesehatan}
                onChange={(e) => onChange("masalah_kesehatan", e.target.value)}
                className="input-field flex-1"
                placeholder="Masalah Kesehatan"
              />
            ) : (
              <span className="flex-1">{formData.masalah_kesehatan || "-"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
