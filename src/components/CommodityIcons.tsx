/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CommodityKey } from "../types";

export interface CommodityIconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/** 1. Karet: Daun karet tiga helai + tetes lateks */
export const KaretIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#2E7D32",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Daun tengah */}
    <path
      d="M16 3C16 3 20 8 19 14C18 18 16 20 16 20C16 20 14 18 13 14C12 8 16 3 16 3Z"
      fill={color}
    />
    {/* Daun kiri */}
    <path
      d="M15 17C15 17 8 15 5 10C3 6 5 4 6 5C10 7 14 12 15 17Z"
      fill={color}
      fillOpacity="0.88"
    />
    {/* Daun kanan */}
    <path
      d="M17 17C17 17 24 15 27 10C29 6 27 4 26 5C22 7 18 12 17 17Z"
      fill={color}
      fillOpacity="0.88"
    />
    {/* Tangkai daun */}
    <path
      d="M16 20V24"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Tetes lateks putih-hijau */}
    <path
      d="M16 24.5C16 24.5 18 26.5 18 28C18 29.1 17.1 30 16 30C14.9 30 14 29.1 14 28C14 26.5 16 24.5 16 24.5Z"
      fill="#FFFFFF"
      stroke={color}
      strokeWidth="1.5"
    />
  </svg>
);

/** 2. Teh: Pucuk daun teh dua helai */
export const TehIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#00897B",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Daun kiri (sedang mekar) */}
    <path
      d="M16 22C16 22 9 20 6 13C4 7 8 5 10 6C14 8 16 15 16 22Z"
      fill={color}
    />
    <path
      d="M9 10C12 12 14 16 16 22"
      stroke="#FFFFFF"
      strokeWidth="1"
      strokeOpacity="0.4"
      strokeLinecap="round"
    />
    {/* Daun kanan (pucuk muda runcing) */}
    <path
      d="M16 22C16 22 17 14 22 8C25 4 27 5 26 8C24 13 19 19 16 22Z"
      fill={color}
      fillOpacity="0.85"
    />
    <path
      d="M23 9C21 13 18 17 16 22"
      stroke="#FFFFFF"
      strokeWidth="1"
      strokeOpacity="0.4"
      strokeLinecap="round"
    />
    {/* Tangkai pucuk */}
    <path
      d="M16 22V28"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

/** 3. Kopi Arabika: Biji kopi coklat tua lekukan 'S' */
export const KopiArabikaIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#6D4C41",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Bentuk biji lonjong */}
    <ellipse
      cx="16"
      cy="16"
      rx="9"
      ry="12"
      transform="rotate(-15 16 16)"
      fill={color}
    />
    {/* Belahan khas lekukan 'S' arabika */}
    <path
      d="M13 6C15 10 18 12 16 16C14 20 17 22 19 26"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeOpacity="0.85"
    />
  </svg>
);

/** 4. Kopi Robusta: Biji kopi oranye-coklat agak membulat celah lurus */
export const KopiRobustaIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#EF6C00",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Bentuk biji lebih bulat */}
    <ellipse
      cx="16"
      cy="16"
      rx="10.5"
      ry="11.5"
      transform="rotate(15 16 16)"
      fill={color}
    />
    {/* Belahan lurus khas robusta */}
    <path
      d="M18 6.5C17.5 11 16 16 14 25.5"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeOpacity="0.85"
    />
  </svg>
);

/** Kopi Gabungan (Arabika & Robusta) */
export const KopiIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#6D4C41",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Biji 1 (Arabika di belakang) */}
    <ellipse
      cx="12"
      cy="17"
      rx="7"
      ry="10"
      transform="rotate(-25 12 17)"
      fill={color}
    />
    <path
      d="M10 9C12 12 13 16 11 21"
      stroke="#FFFFFF"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeOpacity="0.75"
    />
    {/* Biji 2 (Robusta di depan) */}
    <ellipse
      cx="20"
      cy="15"
      rx="7.5"
      ry="9.5"
      transform="rotate(25 20 15)"
      fill="#EF6C00"
    />
    <path
      d="M21 7.5C19 12 20 17 18 22"
      stroke="#FFFFFF"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeOpacity="0.85"
    />
  </svg>
);

/** 5. Tembakau: Daun tembakau lebar kuning keemasan */
export const TembakauIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#F9A825",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Daun lebar memanjang */}
    <path
      d="M16 4C19 7 24 12 24 19C24 24 20 26 16 27C12 26 8 24 8 19C8 12 13 7 16 4Z"
      fill={color}
    />
    {/* Tulang daun tengah */}
    <path
      d="M16 6V29"
      stroke="#8D6E63"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Urat-urat daun */}
    <path
      d="M16 12L20 10M16 16L21 14M16 20L20 19M16 12L12 10M16 16L11 14M16 20L12 19"
      stroke="#FFFFFF"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
  </svg>
);

/** 6. Kayu: Potongan batang kayu dengan lingkar tahun */
export const KayuIcon: React.FC<CommodityIconProps> = ({
  className = "",
  size = 24,
  color = "#8D6E63",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Kulit kayu luar */}
    <circle cx="16" cy="16" r="13" fill="#5D4037" />
    {/* Lapisan kambium */}
    <circle cx="16" cy="16" r="11.5" fill={color} />
    {/* Lingkar tahun luar */}
    <circle
      cx="16"
      cy="16"
      r="8.5"
      stroke="#4E342E"
      strokeWidth="1.2"
      strokeDasharray="14 2"
      fill="none"
    />
    {/* Lingkar tahun tengah */}
    <circle
      cx="16"
      cy="16"
      r="5.5"
      stroke="#4E342E"
      strokeWidth="1.2"
      fill="none"
    />
    {/* Hati kayu / pusat */}
    <circle cx="16" cy="16" r="2.5" fill="#3E2723" />
    {/* Retakan radial alami kayu */}
    <path
      d="M16 16L21 13"
      stroke="#3E2723"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/** Komponen pemilih ikon serbaguna */
export const CommodityIcon: React.FC<{
  commodityKey: CommodityKey | string;
  size?: number | string;
  className?: string;
  color?: string;
}> = ({ commodityKey, size = 20, className = "", color }) => {
  switch (commodityKey) {
    case "karet":
      return <KaretIcon size={size} className={className} color={color || "#2E7D32"} />;
    case "teh":
      return <TehIcon size={size} className={className} color={color || "#00897B"} />;
    case "kopi_arabika":
      return <KopiArabikaIcon size={size} className={className} color={color || "#6D4C41"} />;
    case "kopi_robusta":
      return <KopiRobustaIcon size={size} className={className} color={color || "#EF6C00"} />;
    case "kopi":
      return <KopiIcon size={size} className={className} color={color || "#6D4C41"} />;
    case "tembakau":
      return <TembakauIcon size={size} className={className} color={color || "#F9A825"} />;
    case "kayu":
      return <KayuIcon size={size} className={className} color={color || "#8D6E63"} />;
    default:
      return <KaretIcon size={size} className={className} color={color || "#2E7D32"} />;
  }
};

/**
 * Helper menghasilkan Data URI SVG untuk CSS Cursor 32x32
 */
export const getCommodityCursorStyle = (commodityKey: CommodityKey | string): string => {
  let svgContent = "";
  if (commodityKey === "karet") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 3C16 3 20 8 19 14C18 18 16 20 16 20C16 20 14 18 13 14C12 8 16 3 16 3Z" fill="%232E7D32"/><path d="M15 17C15 17 8 15 5 10C3 6 5 4 6 5C10 7 14 12 15 17Z" fill="%232E7D32" fill-opacity="0.88"/><path d="M17 17C17 17 24 15 27 10C29 6 27 4 26 5C22 7 18 12 17 17Z" fill="%232E7D32" fill-opacity="0.88"/><path d="M16 20V24" stroke="%232E7D32" stroke-width="2" stroke-linecap="round"/><path d="M16 24.5C16 24.5 18 26.5 18 28C18 29.1 17.1 30 16 30C14.9 30 14 29.1 14 28C14 26.5 16 24.5 16 24.5Z" fill="%23FFFFFF" stroke="%232E7D32" stroke-width="1.5"/></svg>`;
  } else if (commodityKey === "teh") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 22C16 22 9 20 6 13C4 7 8 5 10 6C14 8 16 15 16 22Z" fill="%2300897B"/><path d="M16 22C16 22 17 14 22 8C25 4 27 5 26 8C24 13 19 19 16 22Z" fill="%2300897B" fill-opacity="0.85"/><path d="M16 22V28" stroke="%2300897B" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  } else if (commodityKey === "kopi_arabika") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="9" ry="12" transform="rotate(-15 16 16)" fill="%236D4C41"/><path d="M13 6C15 10 18 12 16 16C14 20 17 22 19 26" stroke="%23FFFFFF" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  } else if (commodityKey === "kopi_robusta") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><ellipse cx="16" cy="16" rx="10.5" ry="11.5" transform="rotate(15 16 16)" fill="%23EF6C00"/><path d="M18 6.5C17.5 11 16 16 14 25.5" stroke="%23FFFFFF" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  } else if (commodityKey === "kopi") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><ellipse cx="12" cy="17" rx="7" ry="10" transform="rotate(-25 12 17)" fill="%236D4C41"/><ellipse cx="20" cy="15" rx="7.5" ry="9.5" transform="rotate(25 20 15)" fill="%23EF6C00"/></svg>`;
  } else if (commodityKey === "tembakau") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 4C19 7 24 12 24 19C24 24 20 26 16 27C12 26 8 24 8 19C8 12 13 7 16 4Z" fill="%23F9A825"/><path d="M16 6V29" stroke="%238D6E63" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  } else if (commodityKey === "kayu") {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="%235D4037"/><circle cx="16" cy="16" r="11.5" fill="%238D6E63"/><circle cx="16" cy="16" r="5.5" stroke="%234E342E" stroke-width="1.2" fill="none"/></svg>`;
  }

  if (!svgContent) return "auto";
  return `url("data:image/svg+xml;utf8,${svgContent}") 16 16, auto`;
};

/**
 * Watermark Komoditas Besar di Pojok Kanan Bawah
 */
export const CommodityWatermarkCorner: React.FC<{
  commodityKey?: CommodityKey | string | null;
}> = ({ commodityKey }) => {
  if (!commodityKey || commodityKey === "semua") return null;

  return (
    <div
      className="fixed -bottom-10 -right-10 pointer-events-none z-0 opacity-[0.06] select-none transition-all duration-700 transform scale-125"
      aria-hidden="true"
    >
      <CommodityIcon commodityKey={commodityKey} size={280} />
    </div>
  );
};
