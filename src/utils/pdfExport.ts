import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FamilyCareCard, CareReportRow } from "@/types/careCard";

export interface PrintOptions {
  includeHeader?: boolean;    // Puskesmas & periode info
  includeIdentitas?: boolean; // Keluarga info (nama, alamat, telp, kode)
}

export function exportToPDF(
  card: FamilyCareCard,
  rows: CareReportRow[],
  options: PrintOptions = { includeHeader: true, includeIdentitas: true }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  let y = 15;

  // Title (always show)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("KARTU ASUHAN KEPERAWATAN KELUARGA", pageWidth / 2, y, {
    align: "center",
  });
  y += 10;

  // Header section (conditionally show)
  if (options.includeHeader) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Puskesmas: ${card.puskesmas}`, margin, y);
    y += 5;
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, margin, y);
    y += 8;
  }

  // Identitas section (conditionally show)
  if (options.includeIdentitas) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const leftColX = margin;
    const rightColX = pageWidth / 2 + 5;

    // Left column
    doc.text(`Puskesmas          : ${card.puskesmas}`, leftColX, y);
    doc.text(`Kode               : ${card.kode || "-"}`, rightColX, y);
    y += 6;
    doc.text(`Nama Kepala Keluarga : ${card.kepala_keluarga}`, leftColX, y);
    doc.text(`Telp/Ponsel        : ${card.telp || "-"}`, rightColX, y);
    y += 6;
    doc.text(`Alamat             : ${card.alamat}`, leftColX, y);
    doc.text(`Masalah Kesehatan  : ${card.masalah_kesehatan || "-"}`, rightColX, y);
    y += 10;
  } else if (!options.includeHeader) {
    // Jika tidak ada header/identitas, kurangi y sedikit untuk table mulai lebih awal
    y -= 3;
  }

  // Table
  const tableData = rows.map((row) => [
    row.tanggal,
    row.data_pengkajian || "",
    row.diagnosis || "",
    row.rencana_intervensi || "",
    row.implementasi || "",
    row.evaluasi_s || "",
    row.evaluasi_o || "",
    row.evaluasi_a || "",
    row.evaluasi_p || "",
    row.petugas || "",
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: "Tanggal", rowSpan: 2 },
        { content: "Data Pengkajian", rowSpan: 2 },
        { content: "Diagnosis Keperawatan", rowSpan: 2 },
        { content: "Rencana Intervensi", rowSpan: 2 },
        { content: "Implementasi", rowSpan: 2 },
        { content: "Evaluasi", colSpan: 4 },
        { content: "Petugas", rowSpan: 2 },
      ],
      ["S", "O", "A", "P"],
    ],
    body: tableData.length > 0 ? tableData : [["", "", "", "", "", "", "", "", "", ""]],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 12 },
      8: { cellWidth: 12 },
      9: { cellWidth: 18 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, margin, finalY);

  // Save
  const fileName = `Kartu_Keluarga_${card.kepala_keluarga.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}
