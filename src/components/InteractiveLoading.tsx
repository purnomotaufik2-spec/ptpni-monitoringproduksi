/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppBackground } from "./AppBackground";
import { CommodityIcon } from "./CommodityIcons";
import { CommodityKey } from "../types";
import { COMMODITIES_METADATA, ALL_COMMODITY_KEYS } from "../utils/formatters";

interface InteractiveLoadingProps {
  isOverlay?: boolean;
  isRetry?: boolean;
  retryAttempt?: number;
}

const LOADING_PHRASES = [
  "Menyiapkan laporan produksi…",
  "Membaca data Karet…",
  "Membaca data Teh…",
  "Membaca data Kopi…",
  "Membaca data Tembakau…",
  "Membaca data Kayu…",
  "Menghitung capaian RKAP…",
  "Hampir selesai…",
];

export const InteractiveLoading: React.FC<InteractiveLoadingProps> = ({
  isOverlay = false,
  isRetry = false,
  retryAttempt = 0,
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [activeCommodityIndex, setActiveCommodityIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  // Bergilir teks setiap 1.8 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  // Gelombang ikon komoditas menyala bergantian setiap 450ms
  useEffect(() => {
    const waveTimer = setInterval(() => {
      setActiveCommodityIndex((prev) => (prev + 1) % ALL_COMMODITY_KEYS.length);
    }, 450);
    return () => clearInterval(waveTimer);
  }, []);

  // Simulasi progress bar maju pelan
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          const step = Math.max(1, (90 - prev) * 0.08);
          return Math.min(92, prev + step);
        }
        return prev;
      });
    }, 300);
    return () => clearInterval(progressTimer);
  }, []);

  const currentText = isRetry
    ? `Sedikit lagi, sedang mencoba kembali… ${retryAttempt > 0 ? `(${retryAttempt}/3)` : ""}`
    : LOADING_PHRASES[phraseIndex];

  // TAMPILAN OVERLAY (saat ganti tanggal / muat ulang, data sudah ada di belakang)
  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4 transition-all">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/60 max-w-xs w-full text-center flex flex-col items-center gap-3.5 relative overflow-hidden"
        >
          {/* Logo dengan cincin berputar kecil */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, #22C232, #48A6DD, #F9B33F, #22C232)",
                padding: "3px",
              }}
            >
              <div className="w-full h-full bg-white rounded-full" />
            </div>
            <img
              src="/LOGO-PTPN-1.png"
              alt="Logo PTPN I"
              className="w-10 h-10 object-contain relative z-10 animate-[pulse_1.6s_ease-in-out_infinite]"
            />
          </div>

          <div className="space-y-1 w-full">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0B1F4B]">
              PTPN I Monitoring
            </h4>
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs font-semibold text-[#1565C0] truncate px-1"
                >
                  {currentText}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress bar tipis gradient */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#22C232] via-[#48A6DD] to-[#F9B33F] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN PENUH INTERAKTIF (Saat memuat data awal)
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <AppBackground />

      <div className="w-full max-w-sm space-y-7 text-center relative z-10 flex flex-col items-center">
        {/* 1. Logo PTPN I di tengah (110px) dengan animasi bernapas + cincin gradient berputar */}
        <div className="relative w-[130px] h-[130px] flex items-center justify-center">
          {/* Cincin gradient hijau–biru–emas berputar */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, #22C232, #48A6DD, #F9B33F, #22C232)",
              padding: "4px",
              filter: "drop-shadow(0 4px 12px rgba(34, 194, 50, 0.25))",
              animationDuration: "3.5s",
            }}
          >
            <div className="w-full h-full bg-white/95 rounded-full" />
          </div>

          {/* Logo PTPN I (110px) dengan animasi bernapas (scale 1 -> 1.06, 1.6s) */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{
              duration: 1.6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            className="relative z-10 w-[100px] h-[100px] flex items-center justify-center rounded-full bg-white shadow-lg p-2"
          >
            <img
              src="/LOGO-PTPN-1.png"
              alt="Logo PTPN I"
              className="w-full h-full object-contain"
            />
          </motion.div>
        </div>

        {/* 2. 6 Ikon komoditas menyala bergantian seperti gelombang */}
        <div className="glass-card px-4 py-3 rounded-2xl flex items-center justify-center gap-2.5 sm:gap-3 shadow-md border border-white/60">
          {ALL_COMMODITY_KEYS.map((key, idx) => {
            const meta = COMMODITIES_METADATA[key];
            const isActive = activeCommodityIndex === idx;

            return (
              <motion.div
                key={key}
                animate={
                  isActive
                    ? { scale: 1.22, y: -3 }
                    : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.3 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "shadow-md ring-2 ring-white"
                    : "opacity-45 grayscale-[30%]"
                }`}
                style={{
                  backgroundColor: isActive ? meta.color : meta.lightBg,
                }}
                title={meta.name}
              >
                <CommodityIcon
                  commodityKey={key}
                  size={19}
                  color={isActive ? "#FFFFFF" : meta.color}
                />
              </motion.div>
            );
          })}
        </div>

        {/* 3. Teks bergilir setiap 1,8 detik dengan efek fade */}
        <div className="space-y-3 w-full px-2">
          <div className="h-7 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className={`text-sm font-bold tracking-tight ${
                  isRetry ? "text-amber-700 font-extrabold" : "text-[#0B1F4B]"
                }`}
              >
                {currentText}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* 4. Progress bar tipis gradient */}
          <div className="w-full max-w-xs mx-auto bg-slate-200/80 h-1.5 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-[#22C232] via-[#48A6DD] to-[#F9B33F] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>

          <p className="text-[11px] text-[#64748B] font-medium">
            PT Perkebunan Nusantara I (Persero)
          </p>
        </div>
      </div>
    </div>
  );
};
