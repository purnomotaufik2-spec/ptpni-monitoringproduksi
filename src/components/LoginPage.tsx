/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";
import { apiLogin } from "../api";
import { LoginSuccessResponse } from "../types";

interface LoginPageProps {
  onLoginSuccess: (authData: LoginSuccessResponse) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Silakan lengkapi username dan password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiLogin(username.trim(), password);

      if (response.ok) {
        onLoginSuccess(response);
      } else {
        if (response.code === "LOCKED") {
          setErrorMessage(response.message || "Akun terkunci karena percobaan login berulang.");
        } else {
          setErrorMessage("Username atau password tidak valid.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi server";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setErrorMessage("Gagal terhubung ke server backend Google Apps Script. Silakan periksa koneksi internet.");
      } else {
        setErrorMessage(message || "Username atau password tidak valid.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Container utama: mobile-first (360px–430px) dan terpusat di desktop */}
      <div className="w-full max-w-[420px] mx-auto relative z-10">
        {/* Header Identitas PTPN I Resmi */}
        <div className="text-center mb-6">
          {/* Logo PTPN I Resmi: tinggi 110-130px, di tengah, tanpa background/kotak */}
          <img
            src="/LOGO-PTPN-1.png"
            alt="Logo PTPN I"
            className="h-[120px] w-auto mx-auto object-contain block transition-transform hover:scale-105 duration-300"
          />

          {/* Teks Identitas Resmi */}
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-3.5 font-display">
            PT Perkebunan Nusantara I (Persero)
          </h1>
          <div className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0B6B35] uppercase mt-0.5">
            DASHBOARD OPERASIONAL
          </div>
          <p className="text-xs text-[#7F7F7F] mt-0.5 font-medium">
            Sistem Monitoring Produksi Komoditas
          </p>
        </div>

        {/* Card Form Login */}
        <div className="glass-card py-6 px-6 rounded-2xl border border-white/70 shadow-lg">
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Masuk ke Sistem</h2>
            <p className="text-xs text-[#7F7F7F] mt-0.5">
              Masukkan kredensial akun untuk mengakses data produksi
            </p>
          </div>

          {/* Alert Pesan Error */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7F7F7F]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B35] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Password dengan Tombol Mata */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7F7F7F]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6B35] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7F7F7F] hover:text-slate-800 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Tombol MASUK - Hijau tua #0B6B35 agar teks putih kontras */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#0B6B35] hover:bg-[#085429] active:bg-[#064220] disabled:bg-[#0B6B35]/70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B6B35] transition-colors shadow-sm cursor-pointer"
              >
                {isLoading ? "MEMVERIFIKASI..." : "MASUK"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info & Watermark */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] text-[#7F7F7F]">
            PT Perkebunan Nusantara I &bull; Monitoring Produksi
          </p>
          <p className="text-[11px] text-slate-400 font-normal select-none">
            Taufik Purnomo / DKTK
          </p>
        </div>
      </div>
    </div>
  );
};
