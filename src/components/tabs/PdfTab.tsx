/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Calendar,
  X,
  Sparkles,
  FileDown,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { exportPdf, exportXlsx } from "../../api";
import { formatIndonesianDate } from "../../utils/formatters";
import { CommodityIcon } from "../CommodityIcons";

interface CommodityOption {
  id: string;
  name: string;
  commodityKey: string;
  color: string;
  lightBg: string;
  borderColor: string;
  sheets: string[];
}

const COMMODITY_OPTIONS: CommodityOption[] = [
  {
    id: "karet",
    name: "Karet",
    commodityKey: "karet",
    color: "#2E7D32",
    lightBg: "#E8F5E9",
    borderColor: "#C8E6C9",
    sheets: ["Karet"],
  },
  {
    id: "teh",
    name: "Teh",
    commodityKey: "teh",
    color: "#00897B",
    lightBg: "#E0F2F1",
    borderColor: "#B2DFDB",
    sheets: ["Teh"],
  },
  {
    id: "kopi",
    name: "Kopi (Arabika & Robusta)",
    commodityKey: "kopi",
    color: "#6D4C41",
    lightBg: "#EFEBE9",
    borderColor: "#D7CCC8",
    sheets: ["Kopi"],
  },
  {
    id: "tembakau",
    name: "Tembakau",
    commodityKey: "tembakau",
    color: "#F9A825",
    lightBg: "#FFF8E1",
    borderColor: "#FFECB3",
    sheets: ["Tembakau"],
  },
  {
    id: "kayu",
    name: "Kayu",
    commodityKey: "kayu",
    color: "#8D6E63",
    lightBg: "#EFEBE9",
    borderColor: "#D7CCC8",
    sheets: ["Kayu"],
  },
];

type ExportFormat = "pdf" | "excel";

interface GeneratedPdfFile {
  commodityName: string;
  filename: string;
  blob: Blob;
  sizeKb: number;
}

interface GeneratedExcelFile {
  filename: string;
  blob: Blob;
  sizeKb: number;
  included: string[];
}

interface PdfTabProps {
  token: string | null;
  reportDate: string | null;
  onSessionExpired?: () => void;
}

export const PdfTab: React.FC<PdfTabProps> = ({ token, reportDate, onSessionExpired }) => {
  // Pilihan Format (PDF vs Excel)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");

  // Pilihan komoditas (semua terpilih secara default)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "karet",
    "teh",
    "kopi",
    "tembakau",
    "kayu",
  ]);

  // Opsi gabung PDF jadi 1 file (default false)
  const [mergeAllToOne, setMergeAllToOne] = useState<boolean>(false);

  // Status proses
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
  const [missingSheets, setMissingSheets] = useState<string[]>([]);

  // Hasil PDF
  const [generatedPdfFiles, setGeneratedPdfFiles] = useState<GeneratedPdfFile[]>([]);
  const [previewFile, setPreviewFile] = useState<GeneratedPdfFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Hasil Excel
  const [generatedExcel, setGeneratedExcel] = useState<GeneratedExcelFile | null>(null);

  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Format dd.MM dari reportDate
  const formatDdMm = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "29.09";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const day = parts[2].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      return `${day}.${month}`;
    }
    return "29.09";
  };

  // Helper konversi base64 ke Uint8Array
  const base64ToUint8Array = (base64Str: string): Uint8Array => {
    const cleanBase64 = base64Str.replace(/^data:[^;]+;base64,/, "");
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Helper membuat PDF Blob yang aman
  const createPdfBlob = (bytes: Uint8Array): Blob => {
    return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  };

  // Toggle pilihan komoditas
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(COMMODITY_OPTIONS.map((c) => c.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Helper unduh berkas Blob ke komputer user
  const handleDownloadPdfFile = (file: GeneratedPdfFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Unduh semua berkas PDF sekaligus
  const handleDownloadAllPdf = () => {
    generatedPdfFiles.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadPdfFile(file);
      }, index * 400);
    });
  };

  // Helper unduh file Excel
  const handleDownloadExcelFile = (file: GeneratedExcelFile) => {
    const url = URL.createObjectURL(file.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Helper preview file di dalam iframe modal (bebas window.open)
  const handleOpenPreview = (file: GeneratedPdfFile) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file.blob);
    setPreviewUrl(url);
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
  };

  // Eksekusi Pembuatan PDF
  const handleGeneratePdf = async () => {
    if (!token) {
      setErrorMsg("Sesi login tidak aktif. Silakan masuk kembali.");
      return;
    }

    if (selectedIds.length === 0) {
      setErrorMsg("Pilih minimal satu komoditas untuk diekspor.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setErrorDetails(null);
    setMissingSheets([]);
    setGeneratedPdfFiles([]);
    setShowConfetti(false);

    try {
      // Kumpulkan sheet yang valid: "Karet", "Teh", "Kopi", "Tembakau", "Kayu"
      const sheetsToFetch: string[] = [];
      selectedIds.forEach((id) => {
        const opt = COMMODITY_OPTIONS.find((c) => c.id === id);
        if (opt) {
          sheetsToFetch.push(...opt.sheets);
        }
      });

      // Request ke Google Apps Script: { action: "exportPdf", token, sheets }
      const res = await exportPdf(token, sheetsToFetch, onSessionExpired);

      if (!res.ok && (!res.files || res.files.length === 0)) {
        throw new Error(res.message || "Gagal membuat dokumen PDF dari server.");
      }

      const filesFromBackend = res.files || [];
      const missing = res.missing || [];
      setMissingSheets(missing);

      const effectiveDate = res.reportDate || reportDate;
      const ddMm = formatDdMm(effectiveDate);

      const readyFiles: GeneratedPdfFile[] = [];

      // 1. Karet
      if (selectedIds.includes("karet")) {
        const f = filesFromBackend.find((x) => x.sheet === "Karet");
        if (f && f.base64) {
          const bytes = base64ToUint8Array(f.base64);
          const blob = createPdfBlob(bytes);
          readyFiles.push({
            commodityName: "Karet",
            filename: `LHP_KARET_${ddMm}.pdf`,
            blob,
            sizeKb: Math.round(blob.size / 1024),
          });
        }
      }

      // 2. Teh
      if (selectedIds.includes("teh")) {
        const f = filesFromBackend.find((x) => x.sheet === "Teh");
        if (f && f.base64) {
          const bytes = base64ToUint8Array(f.base64);
          const blob = createPdfBlob(bytes);
          readyFiles.push({
            commodityName: "Teh",
            filename: `LHP_TEH_${ddMm}.pdf`,
            blob,
            sizeKb: Math.round(blob.size / 1024),
          });
        }
      }

      // 3. Kopi (Backend sudah menyediakan sheet "Kopi" 1 halaman Arabika + Robusta)
      if (selectedIds.includes("kopi")) {
        const f = filesFromBackend.find(
          (x) => x.sheet === "Kopi" || x.sheet === "Kopi Arabika"
        );
        if (f && f.base64) {
          const bytes = base64ToUint8Array(f.base64);
          const blob = createPdfBlob(bytes);
          readyFiles.push({
            commodityName: "Kopi (Arabika & Robusta)",
            filename: `LHP_KOPI_${ddMm}.pdf`,
            blob,
            sizeKb: Math.round(blob.size / 1024),
          });
        }
      }

      // 4. Tembakau
      if (selectedIds.includes("tembakau")) {
        const f = filesFromBackend.find((x) => x.sheet === "Tembakau");
        if (f && f.base64) {
          const bytes = base64ToUint8Array(f.base64);
          const blob = createPdfBlob(bytes);
          readyFiles.push({
            commodityName: "Tembakau",
            filename: `LHP_TEMBAKAU_${ddMm}.pdf`,
            blob,
            sizeKb: Math.round(blob.size / 1024),
          });
        }
      }

      // 5. Kayu
      if (selectedIds.includes("kayu")) {
        const f = filesFromBackend.find((x) => x.sheet === "Kayu");
        if (f && f.base64) {
          const bytes = base64ToUint8Array(f.base64);
          const blob = createPdfBlob(bytes);
          readyFiles.push({
            commodityName: "Kayu",
            filename: `LHP_KAYU_${ddMm}.pdf`,
            blob,
            sizeKb: Math.round(blob.size / 1024),
          });
        }
      }

      // OPSI GABUNG SEMUA JADI 1 FILE: Urutan Karet, Teh, Kopi, Tembakau, Kayu
      if (mergeAllToOne && readyFiles.length > 0) {
        const singleDoc = await PDFDocument.create();
        const orderedNames = ["Karet", "Teh", "Kopi (Arabika & Robusta)", "Tembakau", "Kayu"];
        const sortedFiles = [...readyFiles].sort(
          (a, b) => orderedNames.indexOf(a.commodityName) - orderedNames.indexOf(b.commodityName)
        );

        for (const rf of sortedFiles) {
          const arrayBuffer = await rf.blob.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer);
          const pageIndices = doc.getPageIndices();
          const copiedPages = await singleDoc.copyPages(doc, pageIndices);
          copiedPages.forEach((p) => singleDoc.addPage(p));
        }

        const mergedAllBytes = await singleDoc.save();
        const mergedAllBlob = createPdfBlob(mergedAllBytes);

        const singleMergedFile: GeneratedPdfFile = {
          commodityName: "Semua Komoditas (Gabungan)",
          filename: `LHP_PTPN1_${ddMm}.pdf`,
          blob: mergedAllBlob,
          sizeKb: Math.round(mergedAllBlob.size / 1024),
        };

        setGeneratedPdfFiles([singleMergedFile]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        handleDownloadPdfFile(singleMergedFile);
      } else {
        setGeneratedPdfFiles(readyFiles);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        if (readyFiles.length === 1) {
          handleDownloadPdfFile(readyFiles[0]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses PDF.";
      setErrorMsg(msg);
      setErrorDetails(err instanceof Error && err.stack ? err.stack : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Eksekusi Pembuatan Excel (.xlsx)
  const handleGenerateExcel = async () => {
    if (!token) {
      setErrorMsg("Sesi login tidak aktif. Silakan masuk kembali.");
      return;
    }

    if (selectedIds.length === 0) {
      setErrorMsg("Pilih minimal satu komoditas untuk diekspor.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setErrorDetails(null);
    setMissingSheets([]);
    setGeneratedExcel(null);
    setShowConfetti(false);

    try {
      // Nilai sheets sama seperti PDF: "Karet", "Teh", "Kopi", "Tembakau", "Kayu"
      const sheetsToFetch: string[] = [];
      selectedIds.forEach((id) => {
        const opt = COMMODITY_OPTIONS.find((c) => c.id === id);
        if (opt) {
          sheetsToFetch.push(...opt.sheets);
        }
      });

      // Request ke Google Apps Script: { action: "exportXlsx", token, sheets }
      const res = await exportXlsx(token, sheetsToFetch, onSessionExpired);

      if (!res.ok || !res.file || !res.file.base64) {
        throw new Error(res.message || "File gagal dibuat. Silakan coba lagi.");
      }

      // Konversi base64 ke Blob dengan type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
      const bytes = base64ToUint8Array(res.file.base64);
      const blob = new Blob([bytes.buffer as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const excelFile: GeneratedExcelFile = {
        filename: res.file.filename,
        blob,
        sizeKb: Number((blob.size / 1024).toFixed(1)),
        included: res.included || [],
      };

      setGeneratedExcel(excelFile);

      if (res.missing && res.missing.length > 0) {
        setMissingSheets(res.missing);
      }

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Unduh otomatis file Excel dengan nama file.filename
      handleDownloadExcelFile(excelFile);
    } catch (err: unknown) {
      const msg = "File gagal dibuat. Silakan coba lagi.";
      setErrorMsg(msg);
      setErrorDetails(err instanceof Error && err.message ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler utama klik tombol unduh
  const handleExecuteDownload = () => {
    if (selectedFormat === "excel") {
      handleGenerateExcel();
    } else {
      handleGeneratePdf();
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. KARTU IDENTITAS LAPORAN (Navy 900) */}
      <section className="bg-gradient-to-br from-[#0B1F4B] to-[#16306B] rounded-[18px] p-5 sm:p-6 text-white border border-white/20 shadow-xl relative overflow-hidden">
        {/* Hiasan radial di belakang */}
        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: selectedFormat === "excel" ? "#1D6F42" : "#F5B93E" }}
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center p-2 shrink-0 ring-2 ring-white/30">
              <img
                src="/LOGO-PTPN-1.png"
                alt="Logo PTPN I"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#F5B93E]">
                Laporan Resmi
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                Unduh Laporan Produksi Harian
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                {selectedFormat === "excel"
                  ? "File Excel dibuat langsung dari spreadsheet, angka murni tanpa rumus."
                  : "PDF dibuat langsung dari spreadsheet, format sama dengan LHP resmi."}
              </p>
            </div>
          </div>

          <div className="bg-[#0B1F4B]/80 border border-white/20 px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0 self-stretch md:self-auto">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#F5B93E]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                Tanggal Laporan Aktif
              </div>
              <div className="text-sm font-bold text-white tabular-nums">
                {formatIndonesianDate(reportDate)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PILIHAN FORMAT (2 KARTU BESAR BERDAMPINGAN, SAMA UKURAN) */}
      <section className="glass-card rounded-[18px] p-5 sm:p-6 space-y-3.5">
        <div>
          <h3 className="text-sm font-bold text-[#0B1F4B] flex items-center gap-2">
            <FileDown className="w-4 h-4 text-[#1565C0]" />
            Pilih Format Berkas
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pilih salah satu format laporan di bawah ini:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
          {/* Kartu [PDF] */}
          <div
            onClick={() => setSelectedFormat("pdf")}
            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex items-center gap-4 group active:scale-[0.98] ${
              selectedFormat === "pdf"
                ? "bg-red-50/70 border-2 border-[#D32F2F] shadow-md ring-2 ring-[#D32F2F]/20"
                : "bg-white/70 hover:bg-white border border-slate-200 opacity-75"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 text-[#D32F2F] flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#0B1F4B]">PDF</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    selectedFormat === "pdf"
                      ? "bg-[#D32F2F] text-white"
                      : "border-2 border-slate-300"
                  }`}
                >
                  {selectedFormat === "pdf" && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-1 leading-snug">
                Siap cetak, sama dengan LHP resmi
              </p>
            </div>
          </div>

          {/* Kartu [Excel] */}
          <div
            onClick={() => setSelectedFormat("excel")}
            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex items-center gap-4 group active:scale-[0.98] ${
              selectedFormat === "excel"
                ? "bg-emerald-50/70 border-2 border-[#1D6F42] shadow-md ring-2 ring-[#1D6F42]/20"
                : "bg-white/70 hover:bg-white border border-slate-200 opacity-75"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1D6F42] flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#0B1F4B]">Excel</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    selectedFormat === "excel"
                      ? "bg-[#1D6F42] text-white"
                      : "border-2 border-slate-300"
                  }`}
                >
                  {selectedFormat === "excel" && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-1 leading-snug">
                Bisa diolah, angka tanpa rumus
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KARTU PILIHAN KOMODITAS (5 KARTU BERIDENTITAS) */}
      <section className="glass-card rounded-[18px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-[#0B1F4B] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#1565C0]" />
              Pilih Komoditas yang Akan Diunduh
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {selectedFormat === "excel"
                ? "Satu file Excel akan memuat sheet untuk setiap komoditas terpilih."
                : "Pilih satu atau lebih komoditas untuk membuat dokumen PDF."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B1F4B] bg-[#EEF2FA] hover:bg-slate-200 transition-colors cursor-pointer active:scale-95"
            >
              Pilih Semua
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Grid 5 Komoditas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {COMMODITY_OPTIONS.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);

            return (
              <div
                key={opt.id}
                onClick={() => toggleSelect(opt.id)}
                className={`relative rounded-xl p-4 border transition-all duration-200 cursor-pointer flex items-center justify-between group active:scale-[0.98] ${
                  isSelected
                    ? "bg-white shadow-md"
                    : "bg-white/60 hover:bg-white border-slate-200 opacity-70"
                }`}
                style={{
                  borderColor: isSelected ? opt.color : "#E2E8F0",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: opt.lightBg }}
                  >
                    <CommodityIcon commodityKey={opt.commodityKey} size={22} color={opt.color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0B1F4B] group-hover:text-[#16306B]">
                      {opt.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                      <span>LHP format resmi</span>
                    </div>
                  </div>
                </div>

                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? opt.color : "#F1F5F9",
                    color: isSelected ? "#FFFFFF" : "#94A3B8",
                  }}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* OPSI GABUNG PDF JADI 1 FILE (Hanya aktif jika format PDF) */}
        {selectedFormat === "pdf" && (
          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mergeAllToOne}
                onChange={(e) => setMergeAllToOne(e.target.checked)}
                className="w-4 h-4 rounded text-[#0B1F4B] focus:ring-[#0B1F4B] border-slate-300"
              />
              <span className="text-xs font-semibold text-[#0B1F4B]">
                Gabung semua komoditas terpilih menjadi <b>SATU berkas PDF</b> (
                <span className="font-mono text-[11px]">LHP_PTPN1_{formatDdMm(reportDate)}.pdf</span>)
              </span>
            </label>
          </div>
        )}
      </section>

      {/* 4. TOMBOL EKSEKUSI BESAR & STATUS PROSES */}
      <section className="glass-card rounded-[18px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0B1F4B]">
            Siap mengunduh {selectedIds.length} komoditas dalam format {selectedFormat === "excel" ? "Excel (.xlsx)" : "PDF"}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {isLoading
              ? selectedFormat === "excel"
                ? "Menyiapkan file Excel... (bisa sampai 40 detik)"
                : "Menyiapkan PDF... (bisa sampai 40 detik)"
              : selectedFormat === "excel"
              ? "Klik tombol untuk mengunduh satu berkas Excel berisi sheet komoditas terpilih."
              : "Klik tombol untuk memulai pembuatan berkas PDF resmi siap cetak."}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExecuteDownload}
          disabled={isLoading || selectedIds.length === 0}
          className={`px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-md cursor-pointer active:scale-95 ${
            isLoading || selectedIds.length === 0
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : selectedFormat === "excel"
              ? "bg-[#1D6F42] hover:bg-[#14532D] text-white ring-2 ring-[#1D6F42]/20"
              : "bg-[#0B1F4B] hover:bg-[#16306B] text-white ring-2 ring-[#0B1F4B]/20"
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#F5B93E]" />
              <span>
                {selectedFormat === "excel" ? "Memproses Excel..." : "Memproses LHP..."}
              </span>
            </>
          ) : selectedFormat === "excel" ? (
            <>
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Unduh Excel</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-[#F5B93E]" />
              <span>Unduh PDF</span>
            </>
          )}
        </button>
      </section>

      {/* PESAN ERROR JIKA ADA */}
      {errorMsg && (
        <section className="bg-red-50 border border-red-200 rounded-[18px] p-4 sm:p-5 text-red-900 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800">
                {selectedFormat === "excel" ? "File gagal dibuat. Silakan coba lagi." : "Gagal Mengunduh Dokumen"}
              </h4>
              <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
            </div>
            {errorDetails && (
              <button
                type="button"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-xs font-semibold text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showErrorDetails ? "Sembunyikan detail" : "Lihat detail"}</span>
                {showErrorDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {showErrorDetails && errorDetails && (
            <pre className="text-[11px] bg-red-100/60 p-3 rounded-lg overflow-x-auto text-red-950 font-mono">
              {errorDetails}
            </pre>
          )}
        </section>
      )}

      {/* MISSING SHEETS NOTIFIKASI */}
      {missingSheets.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-[18px] p-4 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Laporan belum tersedia: <b>{missingSheets.join(", ")}</b>
          </span>
        </section>
      )}

      {/* 5. HASIL EXCEL (.xlsx) */}
      {generatedExcel && selectedFormat === "excel" && (
        <section className="glass-card rounded-[18px] p-5 sm:p-6 space-y-4 border-2 border-[#1D6F42] relative bg-white/95 shadow-md">
          {showConfetti && (
            <div className="absolute top-2 right-4 flex items-center gap-1.5 text-xs font-bold text-[#1D6F42] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B93E]" />
              <span>File Excel berhasil diunduh!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#1D6F42]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F4B]">
                  File Excel Berhasil Dibuat
                </h3>
                <p className="text-xs text-[#64748B]">
                  File telah otomatis diunduh ke perangkat Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-[#1D6F42] text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <div
                  className="text-sm font-bold text-[#0B1F4B] truncate font-mono"
                  title={generatedExcel.filename}
                >
                  {generatedExcel.filename}
                </div>
                <div className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                  <span className="font-semibold text-[#1D6F42]">Workbook Excel (.xlsx)</span>
                  <span>&bull;</span>
                  <span className="tabular-nums font-mono">{generatedExcel.sizeKb} KB</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleDownloadExcelFile(generatedExcel)}
                className="px-4 py-2 rounded-xl bg-[#1D6F42] hover:bg-[#14532D] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-[#F5B93E]" />
                <span>Unduh Ulang</span>
              </button>
            </div>
          </div>

          {/* Daftar sheet yang masuk (included) */}
          {generatedExcel.included && generatedExcel.included.length > 0 && (
            <div className="pt-1">
              <div className="text-xs font-bold text-[#0B1F4B] mb-2 flex items-center gap-1.5">
                <span>Daftar sheet yang masuk:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedExcel.included.map((sheetName, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-[#1D6F42] border border-emerald-300/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1D6F42]" />
                    {sheetName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. DAFTAR BERKAS HASIL GENERATE PDF */}
      {generatedPdfFiles.length > 0 && selectedFormat === "pdf" && (
        <section className="glass-card rounded-[18px] p-5 sm:p-6 space-y-4 border-2 border-emerald-500/40 relative">
          {showConfetti && (
            <div className="absolute top-2 right-4 flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B93E]" />
              <span>Berkas berhasil disiapkan!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F4B]">
                  Berkas PDF Siap ({generatedPdfFiles.length} berkas)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Klik tombol unduh pada setiap berkas atau buka pratinjau.
                </p>
              </div>
            </div>

            {generatedPdfFiles.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllPdf}
                className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua Berkas</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {generatedPdfFiles.map((file, idx) => (
              <div
                key={idx}
                className="bg-white/90 rounded-xl p-4 border border-[#E2E8F0] flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D32F2F] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#D32F2F]" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-[#0B1F4B] truncate" title={file.filename}>
                      {file.filename}
                    </div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                      <span>{file.commodityName}</span>
                      <span>&bull;</span>
                      <span className="tabular-nums">{file.sizeKb} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(file)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Pratinjau PDF"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfFile(file)}
                    className="px-3 py-2 rounded-lg bg-[#0B1F4B] hover:bg-[#16306B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                    title="Unduh Berkas Ini"
                  >
                    <Download className="w-3.5 h-3.5 text-[#F5B93E]" />
                    <span className="hidden sm:inline">Unduh</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. MODAL PRATINJAU DOKUMEN (Menggunakan iframe aman, tanpa window.open) */}
      {previewFile && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6">
          <div className="bg-white rounded-[18px] max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            {/* Header Modal */}
            <div className="bg-[#0B1F4B] text-white px-5 py-3 flex items-center justify-between border-b-[3px] border-[#F5B93E]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#F5B93E]" />
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {previewFile.filename}
                  </div>
                  <div className="text-[10px] text-white/70">
                    {previewFile.commodityName} &bull; {previewFile.sizeKb} KB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdfFile(previewFile)}
                  className="px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Konten Dokumen */}
            <div className="flex-1 w-full bg-slate-100 overflow-hidden">
              <iframe
                src={previewUrl}
                title="Pratinjau PDF"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
