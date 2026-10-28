/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { LoginPage } from "./components/LoginPage";
import { AppHeader } from "./components/AppHeader";
import { BottomNav, TabKey, WatermarkFooter } from "./components/BottomNav";
import { BerandaTab } from "./components/tabs/BerandaTab";
import { KomoditasTab } from "./components/tabs/KomoditasTab";
import { KebunTab } from "./components/tabs/KebunTab";
import { GrafikTab } from "./components/tabs/GrafikTab";
import { PdfTab } from "./components/tabs/PdfTab";
import { AkunTab } from "./components/tabs/AkunTab";
import { AppBackground } from "./components/AppBackground";
import {
  apiGetDashboard,
  apiSetDate,
  apiLogout,
  getStoredToken,
  saveAuthSession,
} from "./api";
import { DashboardResponse, LoginSuccessResponse, PeriodType, CommodityKey } from "./types";
import { AlertCircle, RefreshCw, ArrowDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);
  const [isUpdatingDate, setIsUpdatingDate] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Default periode global: "kumulatif" (1 Jan s/d HI)
  const [period, setPeriod] = useState<PeriodType>("kumulatif");
  const [activeTab, setActiveTab] = useState<TabKey>("beranda");
  const [selectedCommodityKey, setSelectedCommodityKey] = useState<CommodityKey>("karet");

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // Bersihkan sesi jika token expired
  const handleSessionExpired = useCallback(() => {
    setToken(null);
    setDashboardData(null);
    setErrorNotice("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
  }, []);

  // Memuat data dashboard
  const fetchDashboard = useCallback(
    async (authToken: string) => {
      setIsLoading(true);
      setErrorNotice(null);
      try {
        const response = await apiGetDashboard(authToken, handleSessionExpired);
        setDashboardData(response);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal mengambil data dashboard";
        setErrorNotice(msg);
      } finally {
        setIsLoading(false);
        setInitLoading(false);
      }
    },
    [handleSessionExpired]
  );

  // Inisialisasi: Cek token tersimpan di sessionStorage saat refresh
  useEffect(() => {
    const existingToken = getStoredToken();
    if (existingToken) {
      setToken(existingToken);
      fetchDashboard(existingToken);
    } else {
      setInitLoading(false);
    }
  }, [fetchDashboard]);

  // Handler setelah berhasil login
  const handleLoginSuccess = async (authData: LoginSuccessResponse) => {
    saveAuthSession(authData.token, authData.user);
    setToken(authData.token);
    await fetchDashboard(authData.token);
  };

  // Handler ganti tanggal (setDate)
  const handleDateChange = async (newDate: string) => {
    if (!token) return;
    setIsUpdatingDate(true);
    setErrorNotice(null);
    try {
      const updatedData = await apiSetDate(token, newDate, handleSessionExpired);
      setDashboardData(updatedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui tanggal laporan";
      setErrorNotice(msg);
      throw err;
    } finally {
      setIsUpdatingDate(false);
    }
  };

  // Handler logout
  const handleLogout = async () => {
    if (token) {
      await apiLogout(token);
    }
    setToken(null);
    setDashboardData(null);
    setErrorNotice(null);
    setActiveTab("beranda");
  };

  // Pull-to-refresh gesture listeners (Mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 2) {
      touchStartYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartYRef.current;
    if (distance > 0 && window.scrollY <= 2) {
      // Damping resistance
      setPullDistance(Math.min(distance * 0.45, 90));
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 65 && token) {
      setPullDistance(50);
      try {
        await fetchDashboard(token);
      } finally {
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  // Screen saat memverifikasi sesi awal: Skeleton Shimmer + Logo PTPN I Berdenyut di Tengah
  if (initLoading) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
        <AppBackground />
        <div className="w-full max-w-sm space-y-5 text-center relative z-10">
          {/* Logo PTPN I Berdenyut Halus di Tengah */}
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full bg-[#22C232]/20 blur-xl animate-pulse" />
            <img
              src="/LOGO-PTPN-1.png"
              alt="Logo PTPN I"
              className="h-[90px] w-auto mx-auto object-contain relative z-10 animate-[pulse_2s_ease-in-out_infinite]"
            />
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            {/* Skeleton shimmer bars */}
            <div className="space-y-2.5">
              <div className="h-4 bg-emerald-200/50 rounded-full animate-pulse w-3/4 mx-auto" />
              <div className="h-3 bg-emerald-100/40 rounded-full animate-pulse w-1/2 mx-auto" />
              <div className="h-2.5 bg-slate-200/50 rounded-full animate-pulse w-2/3 mx-auto" />
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-[#0B6B35]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0B6B35]" />
              <span>Memuat data produksi...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Jika belum login atau token kosong
  if (!token) {
    return (
      <>
        <AppBackground />
        {errorNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-11/12 glass-card bg-amber-50/90 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1 font-medium">{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-1 text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Jika sudah login tapi data gagal dimuat (Empty / Error State Ramah)
  if (!dashboardData) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
        <AppBackground />
        <div className="max-w-md w-full glass-card p-7 rounded-3xl text-center space-y-4 relative z-10">
          <img
            src="/LOGO-PTPN-1.png"
            alt="Logo PTPN I"
            className="h-[70px] w-auto mx-auto object-contain mb-2"
          />
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-display">
              Koneksi Backend Terkendala
            </h2>
            <p className="text-xs text-[#7F7F7F] mt-1.5 leading-relaxed">
              {errorNotice || "Sistem belum dapat menyinkronkan data dari Google Apps Script. Silakan coba kembali."}
            </p>
          </div>
          <div className="flex gap-2 pt-2 justify-center">
            <button
              onClick={() => fetchDashboard(token)}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#0B6B35] hover:bg-[#085429] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Muat Ulang</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan LENGKAP Aplikasi
  return (
    <div
      className="min-h-screen relative flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 0. Latar Belakang Gradien Hidup, 3 Blob Melayang, Watermark Logo & Follower */}
      <AppBackground
        activeCommodityKey={
          activeTab === "komoditas" ? selectedCommodityKey : activeTab === "beranda" ? "karet" : null
        }
      />

      {/* Pull-to-refresh Indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-transform"
          style={{
            top: `${Math.max(pullDistance, 12)}px`,
            opacity: Math.min(pullDistance / 40, 1),
          }}
        >
          <div className="glass-card px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-[#0B1F4B] shadow-md">
            {pullDistance >= 65 || isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2E7D32]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#1565C0]" />
            )}
            <span>
              {pullDistance >= 65
                ? "Lepas untuk memuat ulang"
                : "Tarik untuk memuat ulang"}
            </span>
          </div>
        </div>
      )}

      <div>
        {/* Banner Notifikasi Error jika ada */}
        {errorNotice && (
          <div className="fixed top-20 right-4 z-50 max-w-sm glass-card bg-red-50/90 border border-red-200 text-red-800 px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="flex-1 font-medium">{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-red-700 font-bold ml-1 text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. Header Hero PTPN I (Sticky, mengecil saat scroll) */}
        <AppHeader
          user={dashboardData.user}
          reportDate={dashboardData.reportDate}
          period={period}
          onPeriodChange={setPeriod}
          onDateChange={handleDateChange}
          onRefresh={() => fetchDashboard(token)}
          isUpdatingDate={isUpdatingDate}
        />

        {/* 2. Konten Utama Berdasarkan Tab yang Aktif dengan Animasi Fade + Slide-Up 300ms */}
        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {activeTab === "beranda" && (
                <BerandaTab
                  data={dashboardData}
                  period={period}
                  onNavigateCommodity={(key) => {
                    setSelectedCommodityKey(key);
                    setActiveTab("komoditas");
                  }}
                  onNavigateToKebunWithFilter={(key) => {
                    setSelectedCommodityKey(key);
                    setActiveTab("kebun");
                  }}
                />
              )}

              {activeTab === "komoditas" && (
                <KomoditasTab
                  data={dashboardData}
                  period={period}
                  initialCommodityKey={selectedCommodityKey}
                />
              )}

              {activeTab === "kebun" && (
                <KebunTab
                  data={dashboardData}
                  period={period}
                />
              )}

              {activeTab === "grafik" && (
                <GrafikTab
                  data={dashboardData}
                  period={period}
                />
              )}

              {activeTab === "pdf" && (
                <PdfTab
                  token={token}
                  reportDate={dashboardData.reportDate}
                  onSessionExpired={handleSessionExpired}
                />
              )}

              {activeTab === "akun" && (
                <AkunTab
                  data={dashboardData}
                  onLogout={handleLogout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Watermark Bawah & Bottom Navigation */}
      <div>
        <WatermarkFooter />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
