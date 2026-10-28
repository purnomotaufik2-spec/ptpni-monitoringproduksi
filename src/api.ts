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
 * Handler pemanggilan API Google Apps Script.
 * Menggunakan method POST dan Content-Type: text/plain;charset=utf-8
 * agar tidak memicu CORS preflight browser.
 */
async function callGasBackend<T>(payload: Record<string, unknown>, onSessionExpired?: () => void): Promise<T> {
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

  // Deteksi sesi kedaluwarsa
  if (data && data.code === "SESSION_EXPIRED") {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    if (onSessionExpired) {
      onSessionExpired();
    }
    throw new Error("Sesi login telah kedaluwarsa. Silakan masuk kembali.");
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
 */
export async function apiGetDashboard(
  token: string,
  onSessionExpired?: () => void
): Promise<DashboardResponse> {
  const res = await callGasBackend<DashboardResponse | { ok: false; code?: string; message?: string }>(
    {
      action: "dashboard",
      token,
    },
    onSessionExpired
  );

  if (!res.ok) {
    throw new Error(res.message || "Gagal memuat data dashboard");
  }

  return res;
}

/**
 * 3. Aksi setDate
 * { action: "setDate", token, date: "YYYY-MM-DD" }
 */
export async function apiSetDate(
  token: string,
  date: string,
  onSessionExpired?: () => void
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
  onSessionExpired?: () => void
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

    if (data && data.code === "SESSION_EXPIRED") {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      if (onSessionExpired) {
        onSessionExpired();
      }
      throw new Error("Sesi login telah kedaluwarsa. Silakan masuk kembali.");
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
  onSessionExpired?: () => void
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

    if (data && data.code === "SESSION_EXPIRED") {
      sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      sessionStorage.removeItem(STORAGE_KEY_USER);
      if (onSessionExpired) {
        onSessionExpired();
      }
      throw new Error("Sesi login telah kedaluwarsa. Silakan masuk kembali.");
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
