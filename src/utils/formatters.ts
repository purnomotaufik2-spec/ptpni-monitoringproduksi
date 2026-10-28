/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Row, PeriodType, CommodityKey } from "../types";

export interface PeriodValues {
  actual: number | null;
  rkap: number | null;
  achievement: number | null;
}

/**
 * Helper pemetaan periode tunggal di semua halaman & grafik:
 * 1 Jan s/d HI → real = productionActualYtd, RKAP = productionRkapYtd, capaian = achievementYtd
 * Bulan s/d HI → real = actualToDate,        RKAP = rkapToDate,        capaian = achievementToDate
 * Hari Ini     → real = actualToday,         RKAP = rkapToday,         capaian = achievementToday
 */
export function getPeriodValues(row: Row, period: PeriodType): PeriodValues {
  if (period === "hari_ini") {
    return {
      actual: row.actualToday,
      rkap: row.rkapToday,
      achievement: row.achievementToday,
    };
  }

  if (period === "bulan") {
    return {
      actual: row.actualToDate,
      rkap: row.rkapToDate,
      achievement: row.achievementToDate,
    };
  }

  // "kumulatif" (1 Jan s/d HI)
  return {
    actual: row.productionActualYtd,
    rkap: row.productionRkapYtd,
    achievement: row.achievementYtd,
  };
}

const idNumberFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const idIntegerFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/**
 * Format nilai produksi:
 * - KG untuk 5 komoditas dikonversi ke TON (value / 1000, 2 desimal)
 * - Kayu (M3) tetap M3 tanpa konversi (2 desimal)
 * - null => "—" (tidak boleh 0)
 */
export function formatProductionNumber(value: number | null, unitMeasure: "KG" | "M3" | string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  if (unitMeasure === "KG") {
    const inTon = value / 1000;
    return idNumberFormatter.format(inTon);
  }

  // Kayu (M3) atau satuan volume
  return idNumberFormatter.format(value);
}

/**
 * Format angka murni (tanpa konversi Ton): untuk KG/Ha, Protas, atau angka mentah
 */
export function formatRawNumber(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format capaian persentase:
 * - Jika komoditas tidak punya RKAP (misal Kayu), tampilkan "—"
 * - Jika null => "—"
 * - Angka sudah 0-100, format dengan 2 desimal + "%"
 */
export function formatAchievementNumber(value: number | null, hasRkap: boolean = true): string {
  if (!hasRkap || value === null || value === undefined || isNaN(value)) {
    return "—";
  }

  return `${idNumberFormatter.format(value)}%`;
}

/**
 * Helper format angka ringkas (compact format untuk chart/badge, misal 1,2 rb, 2,4 jt)
 */
export function formatCompactNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  }
  return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

export interface StatusCapaian {
  color: string;
  arrow: string;
  icon: string;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  formatted: string;
}

/**
 * HELPER STATUS CAPAIAN (thd RKAP) — dipakai di semua tempat:
 * null → abu "—" "Tidak ada data"
 * ≥100 → hijau #2E7D32 ▲ "Mencapai target" (tint #E8F5E9)
 * 95–<100 → kuning #F9A825 ▶ "Mendekati target" (tint #FFF8E1)
 * <95 → merah #D32F2F ▼ "Di bawah target" (tint #FFEBEE)
 */
export function getStatus(
  pct: number | null | undefined,
  hasRkap: boolean = true,
  rkapValue?: number | null
): StatusCapaian {
  const isRkapEmpty = !hasRkap || rkapValue === 0 || (rkapValue === null && rkapValue !== undefined);

  if (isRkapEmpty || pct === null || pct === undefined || isNaN(pct)) {
    return {
      color: "#94A3B8",
      arrow: "—",
      icon: "—",
      label: isRkapEmpty ? "Belum ada RKAP" : "Tidak ada data",
      bgColor: "#F1F5F9",
      borderColor: "#CBD5E1",
      textColor: "#64748B",
      formatted: "—",
    };
  }

  const formattedPct = `${idNumberFormatter.format(pct)}%`;

  if (pct >= 100) {
    return {
      color: "#2E7D32",
      arrow: "▲",
      icon: "▲",
      label: "Mencapai target",
      bgColor: "#E8F5E9",
      borderColor: "#C8E6C9",
      textColor: "#1B5E20",
      formatted: `▲ ${formattedPct}`,
    };
  }

  if (pct >= 95) {
    return {
      color: "#F9A825",
      arrow: "▶",
      icon: "▶",
      label: "Mendekati target",
      bgColor: "#FFF8E1",
      borderColor: "#FFECB3",
      textColor: "#F57F17",
      formatted: `▶ ${formattedPct}`,
    };
  }

  return {
    color: "#D32F2F",
    arrow: "▼",
    icon: "▼",
    label: "Di bawah target",
    bgColor: "#FFEBEE",
    borderColor: "#FFCDD2",
    textColor: "#C62828",
    formatted: `▼ ${formattedPct}`,
  };
}

export interface PreviousYearProgress {
  delta: number | null;
  arrow: string;
  icon: string;
  color: string;
  label: string;
  text: string;
  tooltip: string;
  hasData: boolean;
  bgColor: string;
}

/**
 * HELPER PANAH PROGRES (vs TAHUN LALU) — terpisah:
 * Sumber achievementVsPreviousYear; delta = nilai − 100.
 * delta > 1 → ▲ hijau #2E7D32 "Naik vs TL"
 * −1..1 → — abu #94A3B8 "Tetap"
 * < −1 → ▼ merah #D32F2F "Turun vs TL"
 * null / Tembakau / Kayu → — abu "Tidak ada data TL"
 */
export function getPreviousYearProgress(
  achievementVsPreviousYear: number | null | undefined,
  isEligible: boolean = true
): PreviousYearProgress {
  if (
    !isEligible ||
    achievementVsPreviousYear === null ||
    achievementVsPreviousYear === undefined ||
    isNaN(achievementVsPreviousYear)
  ) {
    return {
      delta: null,
      arrow: "—",
      icon: "—",
      color: "#94A3B8",
      label: "Tidak ada data tahun lalu",
      text: "— vs TL",
      tooltip: "Tidak ada data tahun lalu",
      hasData: false,
      bgColor: "#F1F5F9",
    };
  }

  const delta = achievementVsPreviousYear - 100;
  const formattedDelta = Math.abs(delta).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  if (delta > 1) {
    return {
      delta,
      arrow: "▲",
      icon: "▲",
      color: "#2E7D32",
      label: "Naik vs tahun lalu",
      text: `+${formattedDelta}% vs TL`,
      tooltip: `Real 1 Jan s.d HI dibanding tahun lalu: ${idNumberFormatter.format(achievementVsPreviousYear)}%`,
      hasData: true,
      bgColor: "#E8F5E9",
    };
  }

  if (delta < -1) {
    return {
      delta,
      arrow: "▼",
      icon: "▼",
      color: "#D32F2F",
      label: "Turun vs tahun lalu",
      text: `−${formattedDelta}% vs TL`,
      tooltip: `Real 1 Jan s.d HI dibanding tahun lalu: ${idNumberFormatter.format(achievementVsPreviousYear)}%`,
      hasData: true,
      bgColor: "#FFEBEE",
    };
  }

  return {
    delta,
    arrow: "—",
    icon: "—",
    color: "#94A3B8",
    label: "Tetap vs tahun lalu",
    text: `${delta >= 0 ? "+" : "−"}${formattedDelta}% vs TL`,
    tooltip: `Real 1 Jan s.d HI dibanding tahun lalu: ${idNumberFormatter.format(achievementVsPreviousYear)}%`,
    hasData: true,
    bgColor: "#F1F5F9",
  };
}

// Backward compatibility alias
export const getAchievementStatus = (val: number | null, hasRkap: boolean = true) => getStatus(val, hasRkap);

/**
 * Format luas area Ha
 */
export function formatAreaNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return `${idNumberFormatter.format(value)} Ha`;
}

/**
 * Format angka bulat umum (misal hitungan / count)
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  return idIntegerFormatter.format(value);
}

/**
 * Format tanggal Indonesia: contoh "29 September 2026"
 */
export function formatIndonesianDate(dateString: string | null): string {
  if (!dateString) return "—";

  try {
    const parts = dateString.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthsId = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const dayStr = String(day).padStart(2, "0");
      const monthStr = monthsId[month] || "";
      return `${dayStr} ${monthStr} ${year}`;
    }

    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
    }
  } catch {
    // fallback
  }

  return dateString;
}

/**
 * Format tanggal pendek: contoh "29 Sep 2026"
 */
export function formatShortDate(dateString: string | null): string {
  if (!dateString) return "—";
  try {
    const parts = dateString.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return `${day} ${monthsId[month]} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateString;
}

/**
 * Konversi nama satuan tampilan
 */
export function getDisplayUnit(unitMeasure: "KG" | "M3" | string): string {
  if (unitMeasure === "KG") return "Ton";
  if (unitMeasure === "M3") return "M³";
  return unitMeasure;
}

export interface CommodityMeta {
  key: CommodityKey;
  name: string;
  color: string;
  lightBg: string;
  borderColor: string;
  unit: "KG" | "M3";
}

export const COMMODITIES_METADATA: Record<CommodityKey, CommodityMeta> = {
  karet: {
    key: "karet",
    name: "Karet",
    color: "#2E7D32",
    lightBg: "#E8F5E9",
    borderColor: "#C8E6C9",
    unit: "KG",
  },
  teh: {
    key: "teh",
    name: "Teh",
    color: "#00897B",
    lightBg: "#E0F2F1",
    borderColor: "#B2DFDB",
    unit: "KG",
  },
  kopi_arabika: {
    key: "kopi_arabika",
    name: "Kopi Arabika",
    color: "#6D4C41",
    lightBg: "#EFEBE9",
    borderColor: "#D7CCC8",
    unit: "KG",
  },
  kopi_robusta: {
    key: "kopi_robusta",
    name: "Kopi Robusta",
    color: "#EF6C00",
    lightBg: "#FFF3E0",
    borderColor: "#FFE0B2",
    unit: "KG",
  },
  tembakau: {
    key: "tembakau",
    name: "Tembakau",
    color: "#F9A825",
    lightBg: "#FFF8E1",
    borderColor: "#FFECB3",
    unit: "KG",
  },
  kayu: {
    key: "kayu",
    name: "Kayu",
    color: "#8D6E63",
    lightBg: "#EFEBE9",
    borderColor: "#D7CCC8",
    unit: "M3",
  },
};

export const ALL_COMMODITY_KEYS: CommodityKey[] = [
  "karet",
  "teh",
  "kopi_arabika",
  "kopi_robusta",
  "tembakau",
  "kayu",
];
