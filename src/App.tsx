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
import { InteractiveLoading } from "./components/InteractiveLoading";
import {
  apiGetDashboard,
  apiSetDate,
  apiLogout,
  getStoredToken,
  saveAuthSession,
} from "./api";
import { DashboardResponse, LoginSuccessResponse, PeriodType, CommodityKey } from "./types";
import { AlertCircle, RefreshCw, ArrowDown, Cloud } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initLoading, setInitLoading] = useState<boolean>(true);
  const [isUpdatingDate, setIsUpdatingDate] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Status retry otomatis
  const [isRetry, setIsRetry] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  // Toast periode aktif
  const [periodToast, setPeriodToast] = useState<string | null>(null);
  const periodToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Default periode global: "kumulatif" (1 Jan s/d HI)
  const [period, setPeriod] = useState<PeriodType>("kumulatif");
  const [activeTab, setActiveTab] = useState<TabKey>("beranda");
  const [selectedCommodityKey, setSelectedCommodityKey] = useState<CommodityKey>("karet");

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);

  // Handler pergantian periode dengan toast ramah
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    const labelMap: Record<PeriodType, string> = {
      "hari_ini": "Menampilkan data Hari Ini",
      "bulan": "Menampilkan data Bulan s/d HI",
      "kumulatif": "Menampilkan data 1 Jan s/d HI",
    };
    setPeriodToast(labelMap[newPeriod] || "Menampilkan data periode");
    if (periodToastTimeoutRef.current) {
      clearTimeout(periodToastTimeoutRef.current);
    }
    periodToastTimeoutRef.current = setTimeout(() => {
      setPeriodToast(null);
    }, 2500);
  };

  // Bersihkan sesi jika token expired
  const handleSessionExpired = useCallback(() => {
    setToken(null);
    setDashboardData(null);
    setErrorNotice("Sesi berakhir, silakan masuk kembali.");
  }, []);

  // Memuat data dashboard dengan retry otomatis
  const fetchDashboard = useCallback(
    async (authToken: string) => {
      setIsLoading(true);
      setIsRetry(false);
      setRetryAttempt(0);
      setErrorNotice(null);
      try {
        const response = await apiGetDashboard(
          authToken,
          handleSessionExpired,
          (attempt: number) => {
            setIsRetry(true);
            setRetryAttempt(attempt);
          }
        );
        setDashboardData(response);
      } catch (err: unknown) {
        console.error("[Dashboard Fetch Error]:", err);
        setErrorNotice("Data belum dapat ditampilkan");
      } finally {
        setIsLoading(false);
        setInitLoading(false);
        setIsRetry(false);
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
      console.error("[Set Date Error]:", err);
      setErrorNotice("Tanggal belum dapat diperbarui");
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

  // 1. Screen saat memuat data awal (Interaktif penuh, bernapas, ikon 6 komoditas gelombang, teks bergilir)
  if (initLoading || (!dashboardData && isLoading)) {
    return (
      <InteractiveLoading
        isRetry={isRetry}
        retryAttempt={retryAttempt}
      />
    );
  }

  // 2. Jika belum login atau token kosong
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

  // 3. Jika sudah login tapi 3x percobaan tetap gagal (Kartu error ramah tanpa teks teknis)
  if (!dashboardData) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
        <AppBackground />
        <div className="max-w-md w-full glass-card p-8 rounded-3xl text-center space-y-5 relative z-10 shadow-2xl border border-white/60">
          <img
            src="/LOGO-PTPN-1.png"
            alt="Logo PTPN I"
            className="h-[76px] w-auto mx-auto object-contain mb-1"
          />

          {/* Ilustrasi awan beranimasi lembut */}
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-100/60 animate-ping opacity-30" />
            <div
              className="w-14 h-14 bg-gradient-to-br from-blue-50 to-slate-100 border border-blue-200/60 rounded-2xl flex items-center justify-center text-[#48A6DD] shadow-sm animate-bounce"
              style={{ animationDuration: "2.8s" }}
            >
              <Cloud className="w-7 h-7 text-[#48A6DD]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-800 font-display">
              Data belum dapat ditampilkan
            </h2>
            <p className="text-xs text-[#7F7F7F] leading-relaxed max-w-xs mx-auto">
              Periksa koneksi internet Anda, lalu coba lagi.
            </p>
          </div>

          <div className="flex gap-3 pt-2 justify-center">
            <button
              onClick={() => fetchDashboard(token)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#0B6B35] hover:bg-[#085429] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Coba Lagi</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Tampilan LENGKAP Aplikasi
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

      {/* Overlay loading saat refresh data atau ganti tanggal */}
      <AnimatePresence>
        {(isLoading || isUpdatingDate) && (
          <InteractiveLoading
            isOverlay
            isRetry={isRetry}
            retryAttempt={retryAttempt}
          />
        )}
      </AnimatePresence>

      {/* Floating Toast Pergantian Periode */}
      <AnimatePresence>
        {periodToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-[#0B1F4B]/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-white/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C232] animate-ping" />
              <span>{periodToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {/* Banner Notifikasi jika ada */}
        {errorNotice && (
          <div className="fixed top-20 right-4 z-50 max-w-sm glass-card bg-amber-50/95 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1 font-medium">{errorNotice}</span>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-amber-700 font-bold ml-1 text-sm cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* 1. Header Hero PTPN I (Sticky, responsive, segmented period indicator) */}
        <AppHeader
          user={dashboardData.user}
          reportDate={dashboardData.reportDate}
          period={period}
          activeTab={activeTab}
          onPeriodChange={handlePeriodChange}
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
