/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DashboardResponse,
  LoginErrorResponse,
  LoginSuccessResponse,
  UserProfile,
  ExportPdfResponse,
  ExportXlsxResponse,
} from "./types";

// URL backend tetap Google Apps Script
export const API_URL = "https://script.google.com/macros/s/AKfycbxR9N1rcEKKHa3aBAtw0rS_NNpiiQO_Gy-7wV6H6YsqrivTldEwoby-nnrKgOLaxkP8/exec";

export const STORAGE_KEY_TOKEN = "ptpn_auth_token";
export const STORAGE_KEY_USER = "ptpn_user_profile";

/**
 * Helper untuk memeriksa apakah respons backend menandakan sesi berakhir / diputus
 * (misal karena token kedaluwarsa atau akun login dari perangkat lain).
 */
export function isSessionExpiredResponse(data: any): boolean {
  if (!data) return false;
  if (
    data.code === "SESSION_EXPIRED" ||
    data.code === "SESSION_KILLED" ||
    data.code === "SESSION_OVERWRITTEN" ||
    data.code === "INVALID_TOKEN" ||
    data.code === "TOKEN_EXPIRED"
  ) {
    return true;
  }
  if (typeof data.message === "string") {
    const msg = data.message.toLowerCase();
    if (
      msg.includes("perangkat lain") ||
      msg.includes("sesi ini telah diakhiri") ||
      msg.includes("sesi anda telah kedaluwarsa") ||
      msg.includes("sesi berakhir") ||
      msg.includes("token tidak valid") ||
      msg.includes("token kedaluwarsa")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Handler pemanggilan API Google Apps Script.
 * Menggunakan method POST dan Content-Type: text/plain;charset=utf-8
 * agar tidak memicu CORS preflight browser.
 */
async function callGasBackend<T>(payload: Record<string, unknown>, onSessionExpired?: (msg?: string) => void): Promise<T> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Koneksi server gagal (Status: ${response.status} ${response.statusText})`);
  }

  const data = await response.json();

  // Deteksi sesi kedaluwarsa atau akun login dari perangkat lain
  if (isSessionExpiredResponse(data)) {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    const expiredMsg =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "Sesi login telah kedaluwarsa. Silakan masuk kembali.";
    if (onSessionExpired) {
      onSessionExpired(expiredMsg);
    }
    throw new Error(expiredMsg);
  }

  return data as T;
}

/**
 * 1. Aksi Login
 * { action: "login", username, password }
 */
export async function apiLogin(
  username: string,
  password: string
): Promise<LoginSuccessResponse | LoginErrorResponse> {
  return await callGasBackend<LoginSuccessResponse | LoginErrorResponse>({
    action: "login",
    username,
    password,
  });
}

/**
 * 2. Aksi Dashboard
 * { action: "dashboard", token }
 * Retry otomatis sampai 3 kali jika gagal (error jaringan, timeout 90s, atau bukan JSON)
 * dengan jeda berturut-turut 2, 4, 6 detik.
 */
export async function apiGetDashboard(
  token: string,
  onSessionExpired?: (msg?: string) => void,
  onRetry?: (attempt: number) => void
): Promise<DashboardResponse> {
  const maxRetries = 3;
  const retryDelays = [2000, 4000, 6000];
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      if (onRetry) {
        onRetry(attempt);
      }
      const delay = retryDelays[attempt - 1] || 6000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "dashboard",
          token,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("INVALID_JSON_RESPONSE");
      }

      if (isSessionExpiredResponse(data)) {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_USER);
        const expiredMsg =
          typeof data.message === "string" && data.message.length > 0
            ? data.message
            : "Sesi berakhir, silakan masuk kembali.";
        if (onSessionExpired) {
          onSessionExpired(expiredMsg);
        }
        throw new Error(expiredMsg);
      }

      if (!data || !data.ok) {
        throw new Error(data?.message || "INVALID_DATA");
      }

      return data as DashboardResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      console.error(`Percobaan load data ke-${attempt + 1} gagal:`, err);

      const errMsg = err instanceof Error ? err.message : "";
      if (
        errMsg === "SESSION_EXPIRED" ||
        errMsg.toLowerCase().includes("perangkat lain") ||
        errMsg.toLowerCase().includes("sesi") ||
        errMsg.toLowerCase().includes("kedaluwarsa") ||
        errMsg.toLowerCase().includes("diakhiri")
      ) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error("Gagal memuat data setelah 3 kali percobaan");
}

/**
 * 3. Aksi setDate
 * { action: "setDate", token, date: "YYYY-MM-DD" }
 */
export async function apiSetDate(
  token: string,
  date: string,
  onSessionExpired?: (msg?: string) => void
): Promise<DashboardResponse> {
  const res = await callGasBackend<DashboardResponse | { ok: false; code?: string; message?: string }>(
    {
      action: "setDate",
      token,
      date,
    },
    onSessionExpired
  );

  if (!res.ok) {
    throw new Error(res.message || "Gagal mengubah tanggal laporan");
  }

  return res;
}

/**
 * 4. Aksi logout
 * { action: "logout", token }
 */
export async function apiLogout(token: string): Promise<void> {
  try {
    await callGasBackend({
      action: "logout",
      token,
    });
  } catch (err) {
    console.warn("Logout notice:", err);
  } finally {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
  }
}

/**
 * 5. Aksi exportPdf (Unduh LHP Resmi Spreadsheet)
 * { action: "exportPdf", token, sheets: string[] }
 * Timeout 120 detik
 */
export async function exportPdf(
  token: string,
  sheets: string[],
  onSessionExpired?: (msg?: string) => void
): Promise<ExportPdfResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "exportPdf",
        token,
        sheets,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Koneksi server gagal (Status: ${response.status} ${response.statusText})`);
    }

    const data = await response.json();

    if (isSessionExpiredResponse(data)) {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      const expiredMsg =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "Sesi login telah kedaluwarsa. Silakan masuk kembali.";
      if (onSessionExpired) {
        onSessionExpired(expiredMsg);
      }
      throw new Error(expiredMsg);
    }

    return data as ExportPdfResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Waktu penyiapan PDF habis (timeout 120 detik). Silakan coba lagi.");
    }
    throw err;
  }
}

/**
 * 6. Aksi exportXlsx (Unduh LHP Format Excel .xlsx)
 * { action: "exportXlsx", token, sheets: string[] }
 * Timeout 120 detik
 */
export async function exportXlsx(
  token: string,
  sheets: string[],
  onSessionExpired?: (msg?: string) => void
): Promise<ExportXlsxResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "exportXlsx",
        token,
        sheets,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Koneksi server gagal (Status: ${response.status} ${response.statusText})`);
    }

    const data = await response.json();

    if (isSessionExpiredResponse(data)) {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      const expiredMsg =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : "Sesi login telah kedaluwarsa. Silakan masuk kembali.";
      if (onSessionExpired) {
        onSessionExpired(expiredMsg);
      }
      throw new Error(expiredMsg);
    }

    return data as ExportXlsxResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Waktu penyiapan file Excel habis (timeout 120 detik). Silakan coba lagi.");
    }
    throw err;
  }
}


export function getStoredToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY_TOKEN);
}

export function getStoredUser(): UserProfile | null {
  const raw = sessionStorage.getItem(STORAGE_KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: UserProfile) {
  sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
  sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}
