/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  RefreshCw,
  LogOut,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ShieldAlert,
  Building2,
  Layers,
  FileCheck
} from "lucide-react";
import { DashboardResponse, PeriodType, CommodityKey, Row } from "../types";
import {
  getPeriodValues,
  formatProductionNumber,
  formatAchievementNumber,
  formatIndonesianDate,
  getDisplayUnit,
  formatCount,
} from "../utils/formatters";

interface DataCheckPageProps {
  data: DashboardResponse;
  token: string;
  onRefresh: () => Promise<void>;
  onDateChange: (newDate: string) => Promise<void>;
  onLogout: () => void;
  isLoading: boolean;
}

// 6 Komoditas Resmi PTPN I
const COMMODITY_KEYS: CommodityKey[] = [
  "karet",
  "teh",
  "kopi_arabika",
  "kopi_robusta",
  "tembakau",
  "kayu",
];

const COMMODITY_NAMES: Record<CommodityKey, string> = {
  karet: "Karet",
  teh: "Teh",
  kopi_arabika: "Kopi Arabika",
  kopi_robusta: "Kopi Robusta",
  tembakau: "Tembakau",
  kayu: "Kayu",
};

export const DataCheckPage: React.FC<DataCheckPageProps> = ({
  data,
  onRefresh,
  onDateChange,
  onLogout,
  isLoading,
}) => {
  // Global Period State: "hari_ini" | "bulan" | "kumulatif" (default: "bulan")
  const [period, setPeriod] = useState<PeriodType>("bulan");
  const [activeTab, setActiveTab] = useState<CommodityKey>("karet");
  const [selectedDate, setSelectedDate] = useState<string>(data.reportDate || "");
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const handleApplyDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    setDateError(null);
    setIsChangingDate(true);
    try {
      await onDateChange(selectedDate);
    } catch (err: unknown) {
      setDateError(err instanceof Error ? err.message : "Gagal mengubah tanggal");
    } finally {
      setIsChangingDate(false);
    }
  };

  const currentCommodity = data.commodities?.[activeTab];

  // Helper labels untuk periode
  const getPeriodLabel = () => {
    if (period === "hari_ini") return "Hari Ini";
    if (period === "bulan") return "Bulan s/d Hari Ini";
    return "Kumulatif (YTD)";
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-12">
      {/* Header Utama Aplikasi */}
      <header className="sticky top-0 z-30 bg-[#0B6B35] text-white shadow-md border-b border-[#085429]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Judul */}
          <div className="flex items-center gap-3">
            <img
              src="/LOGO-PTPN-1.png"
              alt="Logo PTPN I"
              className="h-[38px] w-auto object-contain shrink-0"
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200/90 font-semibold leading-tight">
                PT Perkebunan Nusantara I
              </div>
              <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight">
                Monitoring Produksi
              </h1>
            </div>
          </div>

          {/* Tombol Aksi: Muat Ulang & Keluar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Muat Ulang Data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#085429] hover:bg-[#064220] active:bg-[#042d15] text-white text-xs font-semibold rounded-lg ring-1 ring-white/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>

            <button
              onClick={onLogout}
              title="Keluar dari Akun"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 active:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Sub-bar Profil Pengguna & Tanggal */}
        <div className="bg-[#085429] px-4 sm:px-6 py-2 border-t border-emerald-800/40">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {/* User Info */}
            <div className="flex items-center gap-2 text-emerald-100 flex-wrap">
              <span className="font-semibold text-white">{data.user.name}</span>
              <span className="text-emerald-300">&bull;</span>
              <span className="bg-[#0B6B35] px-2 py-0.5 rounded text-[11px] font-medium text-emerald-100 border border-emerald-600/50">
                {data.user.role}
              </span>
              {data.user.division && (
                <>
                  <span className="text-emerald-300">&bull;</span>
                  <span className="text-emerald-200 text-[11px]">{data.user.division}</span>
                </>
              )}
            </div>

            {/* Tanggal Laporan */}
            <div className="flex items-center gap-2 text-emerald-100">
              <Calendar className="w-3.5 h-3.5 text-[#F9B33F] shrink-0" />
              <span>Tanggal Laporan:</span>
              <span className="font-bold text-white bg-[#064220] px-2 py-0.5 rounded border border-emerald-600/40">
                {formatIndonesianDate(data.reportDate)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 space-y-5">
        {/* Banner Tahap Cek Data */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg shrink-0 mt-0.5 border border-amber-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Halaman Cek Data (Verifikasi)</h2>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Mode Validasi
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Verifikasi integritas struktur backend: daftar kebun (units), subtotal regional, dan total PTPN I.
              </p>
            </div>
          </div>

          {/* Form Ubah Tanggal Laporan */}
          <form onSubmit={handleApplyDate} className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingDate || selectedDate === data.reportDate}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              {isChangingDate ? "Menerapkan..." : "Set Tanggal"}
            </button>
          </form>
        </div>

        {dateError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        {/* Global Period Selector */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pilih Periode Laporan
              </div>
              <div className="text-xs text-slate-700 mt-0.5">
                Nilai yang aktif: <span className="font-semibold text-emerald-800">{getPeriodLabel()}</span>
              </div>
            </div>

            {/* Tombol Tab Periode: Hari Ini | Bulan s/d HI | Kumulatif */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setPeriod("hari_ini")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  period === "hari_ini"
                    ? "bg-white text-emerald-900 font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriod("bulan")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  period === "bulan"
                    ? "bg-white text-emerald-900 font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bulan s/d HI
              </button>
              <button
                type="button"
                onClick={() => setPeriod("kumulatif")}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition-all ${
                  period === "kumulatif"
                    ? "bg-white text-emerald-900 font-bold shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Kumulatif (YTD)
              </button>
            </div>
          </div>
        </div>

        {/* TABEL 1: RINGKASAN VALIDASI PER KOMODITAS */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="px-4 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-800">
                1. Status Validasi Per Komoditas (6 Komoditas)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Hanya 6 Komoditas Resmi PTPN I
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Komoditas</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Tersedia?</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Satuan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Jml Regional</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Jml Kebun (Unit)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Konsisten?</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Jml Warning</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Target RKAP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {COMMODITY_KEYS.map((key) => {
                  const comm = data.commodities?.[key];
                  const isAvailable = Boolean(comm?.available);
                  const isConsistent = comm?.validation?.consistent ?? null;
                  const warningCount = comm?.validation?.warnings?.length ?? 0;
                  const unitCount = comm?.units?.length ?? (comm?.validation?.unitCount ?? 0);
                  const regionalCount = comm?.regionals?.length ?? (comm?.validation?.regionalCount ?? 0);
                  const unitDisplay = comm?.unit ? getDisplayUnit(comm.unit) : (key === "kayu" ? "M³" : "Ton");
                  const hasRkap = comm?.hasRkap ?? (key !== "kayu");

                  return (
                    <tr
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                        activeTab === key ? "bg-emerald-50/80 font-medium" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center justify-between">
                        <span>{COMMODITY_NAMES[key]}</span>
                        {activeTab === key && (
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-700 ml-1 shrink-0" />
                        )}
                      </td>

                      {/* Tersedia? */}
                      <td className="py-2.5 px-3 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Ya
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                            <XCircle className="w-3 h-3 text-slate-400" /> Tidak
                          </span>
                        )}
                      </td>

                      {/* Satuan */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {unitDisplay}
                        </span>
                      </td>

                      {/* Jumlah Regional */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatCount(regionalCount)}
                      </td>

                      {/* Jumlah Kebun */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {formatCount(unitCount)}
                      </td>

                      {/* Konsisten? */}
                      <td className="py-2.5 px-3 text-center">
                        {isConsistent === true ? (
                          <span className="text-emerald-700 font-semibold text-[11px]">Ya</span>
                        ) : isConsistent === false ? (
                          <span className="text-red-700 font-semibold text-[11px] bg-red-100 px-1.5 py-0.5 rounded">
                            Tidak
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Jml Warning */}
                      <td className="py-2.5 px-3 text-center">
                        {warningCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> {warningCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Target RKAP */}
                      <td className="py-2.5 px-3 text-center">
                        {hasRkap ? (
                          <span className="text-slate-700 text-[11px]">Ada RKAP</span>
                        ) : (
                          <span className="text-amber-700 text-[11px] font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                            Tanpa RKAP
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* TABEL 2: DETAIL PER KOMODITAS */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Tab Komoditas Selector */}
          <div className="border-b border-slate-200 bg-slate-50/90 px-3 pt-3">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-800">
                  2. Rincian Data Kebun (Units) & Subtotal
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Pilih komoditas di bawah untuk melihat detail:
              </span>
            </div>

            {/* Tab Buttons (Mobile horizontally scrollable) */}
            <div className="flex space-x-1 overflow-x-auto no-scrollbar pb-2">
              {COMMODITY_KEYS.map((key) => {
                const comm = data.commodities?.[key];
                const count = comm?.units?.length ?? 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === key
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{COMMODITY_NAMES[key]}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === key
                          ? "bg-emerald-800 text-emerald-100"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Konten Komoditas Terpilih */}
          <div className="p-4 space-y-4">
            {/* Header Status Komoditas Terpilih */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  Komoditas: {COMMODITY_NAMES[activeTab]}
                </span>
                <span className="font-mono bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-700 font-semibold">
                  Satuan: {currentCommodity?.unit === "KG" ? "Ton (KG / 1.000)" : "M³"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Periode Aktif:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                  {getPeriodLabel()}
                </span>
              </div>
            </div>

            {/* Peringatan jika komoditas tidak tersedia */}
            {(!currentCommodity || !currentCommodity.available) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  {currentCommodity?.reason ||
                    `Komoditas ${COMMODITY_NAMES[activeTab]} tidak tersedia pada tanggal laporan ${formatIndonesianDate(
                      data.reportDate
                    )}.`}
                </span>
              </div>
            )}

            {/* Warnings list jika ada */}
            {currentCommodity?.validation?.warnings && currentCommodity.validation.warnings.length > 0 && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Catatan Validasi Backend ({currentCommodity.validation.warnings.length}):</span>
                </div>
                <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-2 text-[11px]">
                  {currentCommodity.validation.warnings.map((warn, i) => (
                    <li key={i}>{typeof warn === "string" ? warn : JSON.stringify(warn)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* A. TABEL KEBUN (UNITS) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Daftar Kebun / Unit ({currentCommodity?.units?.length ?? 0} Kebun)
                </h3>
                <span className="text-[11px] text-slate-500">
                  *Hanya data level unit (bukan gabungan)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">No</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Kebun</th>
                      <th className="py-2.5 px-3 font-semibold">Regional</th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        Realisasi ({currentCommodity?.unit === "KG" ? "Ton" : "M³"})
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">
                        RKAP ({currentCommodity?.unit === "KG" ? "Ton" : "M³"})
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right">Capaian (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {!currentCommodity?.units || currentCommodity.units.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          Tidak ada data kebun (units) untuk komoditas ini.
                        </td>
                      </tr>
                    ) : (
                      currentCommodity.units.map((row: Row, idx: number) => {
                        const vals = getPeriodValues(row, period);
                        const hasRkap = currentCommodity.hasRkap;
                        const unitMeasure = currentCommodity.unit;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{row.name}</td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                                {row.regional || "—"}
                              </span>
                            </td>
                            {/* Realisasi */}
                            <td className="py-2 px-3 text-right font-mono text-slate-900 font-medium">
                              {formatProductionNumber(vals.actual, unitMeasure)}
                            </td>
                            {/* RKAP */}
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {hasRkap ? formatProductionNumber(vals.rkap, unitMeasure) : "—"}
                            </td>
                            {/* Capaian */}
                            <td className="py-2 px-3 text-right font-mono">
                              {hasRkap ? (
                                <span
                                  className={`font-semibold ${
                                    vals.achievement !== null && vals.achievement >= 100
                                      ? "text-emerald-700"
                                      : vals.achievement !== null && vals.achievement >= 90
                                      ? "text-blue-700"
                                      : "text-amber-700"
                                  }`}
                                >
                                  {formatAchievementNumber(vals.achievement, hasRkap)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* B. SUBTOTAL REGIONAL (dari commodity.regionals) */}
            {currentCommodity?.regionals && currentCommodity.regionals.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Subtotal Regional ({currentCommodity.regionals.length} Regional)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    *Diambil langsung dari commodity.regionals
                  </span>
                </div>

                <div className="overflow-x-auto border border-blue-200/80 rounded-xl bg-blue-50/20">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-blue-100/60 text-blue-900 uppercase text-[11px] tracking-wider border-b border-blue-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Nama Regional</th>
                        <th className="py-2.5 px-3 font-semibold text-right">
                          Realisasi ({currentCommodity?.unit === "KG" ? "Ton" : "M³"})
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right">
                          RKAP ({currentCommodity?.unit === "KG" ? "Ton" : "M³"})
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right">Capaian (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {currentCommodity.regionals.map((row: Row, idx: number) => {
                        const vals = getPeriodValues(row, period);
                        const hasRkap = currentCommodity.hasRkap;
                        const unitMeasure = currentCommodity.unit;

                        return (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{row.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatProductionNumber(vals.actual, unitMeasure)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {hasRkap ? formatProductionNumber(vals.rkap, unitMeasure) : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {hasRkap ? (
                                <span className="text-blue-800">
                                  {formatAchievementNumber(vals.achievement, hasRkap)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* C. TOTAL PTPN I (GRAND TOTAL) */}
            {currentCommodity && (
              <div className="pt-2">
                <div className="bg-emerald-800 text-white rounded-xl p-4 shadow-sm border border-emerald-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/60 pb-2 mb-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
                        Total PTPN I (Grand Total)
                      </div>
                      <div className="text-base font-bold">
                        {currentCommodity.grandTotal?.name || `Total ${COMMODITY_NAMES[activeTab]}`}
                      </div>
                    </div>
                    <div className="text-xs text-emerald-200">
                      *Diambil langsung dari <code className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded">grandTotal</code>, bukan dihitung ulang.
                    </div>
                  </div>

                  {currentCommodity.grandTotal ? (
                    (() => {
                      const grandVals = getPeriodValues(currentCommodity.grandTotal, period);
                      const unitMeasure = currentCommodity.unit;
                      const hasRkap = currentCommodity.hasRkap;
                      const unitLabel = unitMeasure === "KG" ? "Ton" : "M³";

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-emerald-900/60 rounded-lg p-3 border border-emerald-700/50">
                            <div className="text-[11px] text-emerald-200 uppercase">
                              Realisasi ({unitLabel})
                            </div>
                            <div className="text-xl font-bold font-mono text-white mt-1">
                              {formatProductionNumber(grandVals.actual, unitMeasure)}
                            </div>
                          </div>

                          <div className="bg-emerald-900/60 rounded-lg p-3 border border-emerald-700/50">
                            <div className="text-[11px] text-emerald-200 uppercase">
                              RKAP ({unitLabel})
                            </div>
                            <div className="text-xl font-bold font-mono text-emerald-100 mt-1">
                              {hasRkap ? formatProductionNumber(grandVals.rkap, unitMeasure) : "—"}
                            </div>
                          </div>

                          <div className="bg-emerald-900/60 rounded-lg p-3 border border-emerald-700/50">
                            <div className="text-[11px] text-emerald-200 uppercase">Capaian (%)</div>
                            <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                              {hasRkap ? formatAchievementNumber(grandVals.achievement, hasRkap) : "—"}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-xs text-emerald-200 italic py-2">
                      Grand total tidak tersedia pada respons backend untuk komoditas ini.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
