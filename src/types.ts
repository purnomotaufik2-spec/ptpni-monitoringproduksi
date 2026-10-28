/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CommodityKey = "karet" | "teh" | "kopi_arabika" | "kopi_robusta" | "tembakau" | "kayu";

export type Row = {
  name: string;
  regional: string | null;
  level: "unit" | "regional" | "grand";
  commodity: string;
  commodityKey: string;
  unitMeasure: "KG" | "M3";
  areaHa: number | null;
  rkapToday: number | null;
  rkapToDate: number | null;
  actualToday: number | null;
  actualToDate: number | null;
  protas: number | null;
  achievementToday: number | null;
  achievementToDate: number | null;
  productionRkapYtd: number | null;
  productionActualYtd: number | null;
  achievementYtd: number | null;
  productivityRkap: number | null;
  productivityActual: number | null;
  previousYearActual: number | null;
  achievementVsPreviousYear: number | null;
  achievementAnnual: number | null;
  annualRkap: number | null;
  unitCount?: number;
  species?: { key: string; label: string; today: number | null; toDate: number | null; ytd: number | null }[];
};

export type Commodity = {
  key: "karet" | "teh" | "kopi_arabika" | "kopi_robusta" | "tembakau" | "kayu";
  name: string;
  unit: "KG" | "M3";
  available: boolean;
  hasRkap: boolean;
  reason?: string;
  units: Row[];
  regionals: Row[];
  grandTotal: Row | null;
  validation: {
    unitCount: number;
    regionalCount: number;
    hasGrandTotal: boolean;
    orphanUnits: number;
    emptyUnitRows: number;
    consistent: boolean;
    warnings: any[];
  } | null;
};

export type UserProfile = {
  username: string;
  name: string;
  role: string;
  division: string;
};

export type DashboardResponse = {
  ok: true;
  user: UserProfile;
  reportDate: string | null;
  generatedAt: string;
  commodityOrder: string[];
  availableCommodities: string[];
  commodities: Record<string, Commodity>;
};

export type LoginSuccessResponse = {
  ok: true;
  token: string;
  user: UserProfile;
};

export type LoginErrorResponse = {
  ok: false;
  code: "INVALID_LOGIN" | "LOCKED" | "SESSION_EXPIRED" | string;
  message?: string;
};

export type PeriodType = "hari_ini" | "bulan" | "kumulatif";

export type ExportPdfFile = {
  sheet: string;
  filename: string;
  base64: string;
};

export type ExportPdfResponse = {
  ok: boolean;
  reportDate?: string;
  files?: ExportPdfFile[];
  missing?: string[];
  message?: string;
  code?: string;
};

export type ExportXlsxFile = {
  filename: string;
  base64: string;
};

export type ExportXlsxResponse = {
  ok: boolean;
  reportDate?: string;
  file?: ExportXlsxFile;
  included?: string[];
  missing?: string[];
  message?: string;
  code?: string;
};

