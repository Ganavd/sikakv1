import { useState } from "react";
import { CareReportRow, NewCareReportRow } from "@/types/careCard";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportTableProps {
  rows: CareReportRow[];
  cardId: string;
  onAddRow: (row: NewCareReportRow) => Promise<CareReportRow>;
  onUpdateRow: (row: Partial<CareReportRow> & { id: string }) => Promise<CareReportRow>;
  onDeleteRow: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
}

const emptyRow: Omit<NewCareReportRow, "card_id"> = {
  tanggal: new Date().toISOString().split("T")[0],
  data_pengkajian: "",
  diagnosis: "",
  rencana_intervensi: "",
  implementasi: "",
  evaluasi_s: "",
  evaluasi_o: "",
  evaluasi_a: "",
  evaluasi_p: "",
  petugas: "",
};

export function ReportTable({
  rows,
  cardId,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  isCreating,
  isUpdating,
}: ReportTableProps) {
  const [newRow, setNewRow] = useState<Omit<NewCareReportRow, "card_id">>(emptyRow);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CareReportRow>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddRow = async () => {
    if (!newRow.tanggal) return;
    await onAddRow({ ...newRow, card_id: cardId });
    setNewRow(emptyRow);
    setShowAddForm(false);
  };

  const handleStartEdit = (row: CareReportRow) => {
    setEditingId(row.id);
    setEditData(row);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await onUpdateRow({ id: editingId, ...editData });
    setEditingId(null);
    setEditData({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="document-table">
          <thead>
            <tr>
              <th rowSpan={2} className="w-24">Tanggal</th>
              <th rowSpan={2} className="min-w-[120px]">Data Pengkajian</th>
              <th rowSpan={2} className="min-w-[120px]">Diagnosis Keperawatan</th>
              <th rowSpan={2} className="min-w-[120px]">Rencana Intervensi</th>
              <th rowSpan={2} className="min-w-[120px]">Implementasi</th>
              <th colSpan={4} className="text-center">Evaluasi</th>
              <th rowSpan={2} className="min-w-[80px]">Petugas</th>
              <th rowSpan={2} className="w-20 no-print">Aksi</th>
            </tr>
            <tr>
              <th className="w-12">S</th>
              <th className="w-12">O</th>
              <th className="w-12">A</th>
              <th className="w-12">P</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {editingId === row.id ? (
                  <>
                    <td>
                      <input
                        type="date"
                        value={editData.tanggal || ""}
                        onChange={(e) => setEditData({ ...editData, tanggal: e.target.value })}
                        className="input-field text-xs"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editData.data_pengkajian || ""}
                        onChange={(e) => setEditData({ ...editData, data_pengkajian: e.target.value })}
                        className="input-field text-xs min-h-[60px]"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editData.diagnosis || ""}
                        onChange={(e) => setEditData({ ...editData, diagnosis: e.target.value })}
                        className="input-field text-xs min-h-[60px]"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editData.rencana_intervensi || ""}
                        onChange={(e) => setEditData({ ...editData, rencana_intervensi: e.target.value })}
                        className="input-field text-xs min-h-[60px]"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editData.implementasi || ""}
                        onChange={(e) => setEditData({ ...editData, implementasi: e.target.value })}
                        className="input-field text-xs min-h-[60px]"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.evaluasi_s || ""}
                        onChange={(e) => setEditData({ ...editData, evaluasi_s: e.target.value })}
                        className="input-field text-xs w-full"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.evaluasi_o || ""}
                        onChange={(e) => setEditData({ ...editData, evaluasi_o: e.target.value })}
                        className="input-field text-xs w-full"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.evaluasi_a || ""}
                        onChange={(e) => setEditData({ ...editData, evaluasi_a: e.target.value })}
                        className="input-field text-xs w-full"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.evaluasi_p || ""}
                        onChange={(e) => setEditData({ ...editData, evaluasi_p: e.target.value })}
                        className="input-field text-xs w-full"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editData.petugas || ""}
                        onChange={(e) => setEditData({ ...editData, petugas: e.target.value })}
                        className="input-field text-xs"
                      />
                    </td>
                    <td className="no-print">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-xs">{row.tanggal}</td>
                    <td className="text-xs whitespace-pre-wrap">{row.data_pengkajian}</td>
                    <td className="text-xs whitespace-pre-wrap">{row.diagnosis}</td>
                    <td className="text-xs whitespace-pre-wrap">{row.rencana_intervensi}</td>
                    <td className="text-xs whitespace-pre-wrap">{row.implementasi}</td>
                    <td className="text-xs">{row.evaluasi_s}</td>
                    <td className="text-xs">{row.evaluasi_o}</td>
                    <td className="text-xs">{row.evaluasi_a}</td>
                    <td className="text-xs">{row.evaluasi_p}</td>
                    <td className="text-xs">{row.petugas}</td>
                    <td className="no-print">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(row)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteRow(row.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            
            {/* Add New Row Form */}
            {showAddForm && (
              <tr className="bg-accent/50">
                <td>
                  <input
                    type="date"
                    value={newRow.tanggal}
                    onChange={(e) => setNewRow({ ...newRow, tanggal: e.target.value })}
                    className="input-field text-xs"
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.data_pengkajian}
                    onChange={(e) => setNewRow({ ...newRow, data_pengkajian: e.target.value })}
                    className="input-field text-xs min-h-[60px]"
                    placeholder="Data pengkajian..."
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.diagnosis}
                    onChange={(e) => setNewRow({ ...newRow, diagnosis: e.target.value })}
                    className="input-field text-xs min-h-[60px]"
                    placeholder="Diagnosis..."
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.rencana_intervensi}
                    onChange={(e) => setNewRow({ ...newRow, rencana_intervensi: e.target.value })}
                    className="input-field text-xs min-h-[60px]"
                    placeholder="Rencana..."
                  />
                </td>
                <td>
                  <textarea
                    value={newRow.implementasi}
                    onChange={(e) => setNewRow({ ...newRow, implementasi: e.target.value })}
                    className="input-field text-xs min-h-[60px]"
                    placeholder="Implementasi..."
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newRow.evaluasi_s}
                    onChange={(e) => setNewRow({ ...newRow, evaluasi_s: e.target.value })}
                    className="input-field text-xs w-full"
                    placeholder="S"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newRow.evaluasi_o}
                    onChange={(e) => setNewRow({ ...newRow, evaluasi_o: e.target.value })}
                    className="input-field text-xs w-full"
                    placeholder="O"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newRow.evaluasi_a}
                    onChange={(e) => setNewRow({ ...newRow, evaluasi_a: e.target.value })}
                    className="input-field text-xs w-full"
                    placeholder="A"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newRow.evaluasi_p}
                    onChange={(e) => setNewRow({ ...newRow, evaluasi_p: e.target.value })}
                    className="input-field text-xs w-full"
                    placeholder="P"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newRow.petugas}
                    onChange={(e) => setNewRow({ ...newRow, petugas: e.target.value })}
                    className="input-field text-xs"
                    placeholder="Nama"
                  />
                </td>
                <td className="no-print">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAddRow}
                      disabled={isCreating}
                      className="h-7 w-7 p-0"
                    >
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewRow(emptyRow);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {!showAddForm && (
        <div className="mt-4 no-print">
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Baris
          </Button>
        </div>
      )}
    </div>
  );
}
