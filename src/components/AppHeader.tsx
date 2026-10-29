/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Cloud, Calendar, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { PeriodType, UserProfile } from "../types";
import { TabKey } from "./BottomNav";
import { formatIndonesianDate, formatShortDate } from "../utils/formatters";

interface AppHeaderProps {
  user: UserProfile;
  reportDate: string | null;
  period: PeriodType;
  activeTab: TabKey;
  onPeriodChange: (period: PeriodType) => void;
  onDateChange: (newDate: string) => Promise<void>;
  onRefresh: () => void;
  isUpdatingDate: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  reportDate,
  period,
  activeTab,
  onPeriodChange,
  onDateChange,
  onRefresh,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(reportDate || "");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || selectedDate === reportDate) {
      setShowDatePicker(false);
      return;
    }
    setShowDatePicker(false);
    await onDateChange(selectedDate);
  };

  const userInitials = (user.name || user.username || "P")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Halaman yang angkanya berubah sesuai periode: Beranda, Komoditas, Kebun, Grafik
  const isPeriodActive =
    activeTab === "beranda" ||
    activeTab === "komoditas" ||
    activeTab === "kebun" ||
    activeTab === "grafik";

  return (
    <>
      {/* Header Infografis Eksekutif: Sticky, Latar Navy 900 (#0B1F4B) dengan garis emas 3px di bawah (#F5B93E) */}
      <header
        className={`sticky top-0 z-40 text-white border-b-[3px] border-[#F5B93E] shadow-xl transition-all duration-300 ${
          isScrolled
            ? "bg-[#0B1F4B]/95 backdrop-blur-md py-2 sm:py-2.5 shadow-2xl"
            : "bg-[#0B1F4B] py-3.5 sm:py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
          {/* Baris Atas Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-2.5">
            {/* Bagian Kiri: Logo lingkaran putih + Judul & Subjudul (Title Case) */}
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full bg-white shadow-md flex items-center justify-center p-1.5 shrink-0 ring-2 ring-white/20 transition-all duration-300 ${
                  isScrolled ? "w-10 h-10" : "w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                }`}
              >
                <img
                  src="/LOGO-PTPN-1.png"
                  alt="Logo PTPN I"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1
                  className={`font-bold tracking-tight text-white leading-tight font-display transition-all duration-300 ${
                    isScrolled
                      ? "text-[18px] sm:text-[20px] md:text-[22px]"
                      : "text-[20px] sm:text-[24px] md:text-[26px]"
                  }`}
                >
                  PTPN I Monitoring Produksi
                </h1>
                <p
                  className={`font-medium text-white/80 leading-normal transition-all duration-300 ${
                    isScrolled ? "text-[11px] sm:text-[12px]" : "text-[13px] sm:text-[14px]"
                  }`}
                >
                  Laporan Produksi Harian &bull; {formatIndonesianDate(reportDate)}
                </p>
              </div>
            </div>

            {/* Bagian Kanan: Kartu Tanggal LHP Navy 700 + Badge Live + Refresh + Avatar */}
            <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 self-stretch md:self-auto justify-between md:justify-end">
              {/* Kartu kecil Navy 700 berikon kalender */}
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="bg-[#16306B] hover:bg-[#1E3E8A] active:scale-95 border border-white/15 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-left flex items-center gap-2 transition-all shadow-sm cursor-pointer group"
                title="Pilih tanggal laporan (LHP)"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#F5B93E]">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                    Tanggal LHP
                  </div>
                  <div className="text-xs font-bold text-white group-hover:text-[#F5B93E] transition-colors tabular-nums">
                    {formatShortDate(reportDate)}
                  </div>
                </div>
              </button>

              {/* Badge Data Live */}
              <div className="flex items-center gap-1.5 bg-[#16306B]/80 px-2.5 py-1.5 rounded-xl border border-white/10 text-[11px] text-emerald-300 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Data Terkini</span>
              </div>

              {/* Tombol Refresh */}
              <button
                type="button"
                onClick={onRefresh}
                title="Muat Ulang Data"
                className="p-1.5 sm:p-2 rounded-xl bg-[#16306B] hover:bg-[#1E3E8A] active:scale-90 border border-white/15 text-white transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Avatar User */}
              <div className="flex items-center gap-2 pl-1 border-l border-white/15">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#F5B93E] to-[#EF6C00] text-slate-950 font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white/30"
                  title={`${user.name} (${user.role})`}
                >
                  {userInitials}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-bold text-white truncate max-w-[120px]">{user.name}</div>
                  <div className="text-[10px] text-white/70 uppercase font-semibold">{user.role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Control Periode / Chip Statis di Bawah Header */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {isPeriodActive ? (
              /* Segmented control interaktif untuk halaman Beranda, Komoditas, Kebun, Grafik */
              <div className="bg-white/15 p-1 rounded-2xl flex items-center gap-1 border border-white/20 w-full sm:w-auto shadow-inner relative">
                {[
                  { key: "hari_ini", label: "Hari Ini" },
                  { key: "bulan", label: "Bulan s/d HI" },
                  { key: "kumulatif", label: "1 Jan s/d HI" },
                ].map((item) => {
                  const isActive = period === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onPeriodChange(item.key as PeriodType)}
                      className={`relative flex-1 sm:flex-initial py-1 px-3.5 sm:px-4 rounded-xl text-xs transition-all text-center cursor-pointer active:scale-95 ${
                        isActive
                          ? "font-bold text-[#0B1F4B]"
                          : "font-medium text-white/85 hover:bg-white/15"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="header-period-indicator"
                          className="absolute inset-0 bg-white rounded-xl shadow-md"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Chip statis kecil untuk halaman yang tidak terpengaruh periode (Unduh/PDF, Akun) */
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#16306B]/80 border border-white/15 text-xs text-white/90 select-none shadow-xs">
                <Calendar className="w-3.5 h-3.5 text-[#F5B93E]" />
                <span className="font-semibold">Periode: 1 Jan s/d HI</span>
              </div>
            )}

            <div className="text-[11px] font-medium text-white/70 self-end sm:self-auto">
              PT Perkebunan Nusantara I (Persero) &bull;{" "}
              <span className="text-[#F5B93E] font-semibold">{user.division || "Operasional"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Date Picker */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="glass-card rounded-[18px] p-5 max-w-sm w-full shadow-2xl border border-white/60">
            <h3 className="text-sm font-bold text-[#0B1F4B] mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1565C0]" />
              Pilih Tanggal LHP
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Pilih tanggal laporan untuk menampilkan data produksi komoditas.
            </p>

            <form onSubmit={handleDateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Tanggal LHP
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] bg-white rounded-xl focus:ring-2 focus:ring-[#0B1F4B] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#0B1F4B] hover:bg-[#16306B] text-white rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  Terapkan Tanggal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
