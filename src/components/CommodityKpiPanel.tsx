/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  MapPin,
  TrendingUp,
  Target,
  Award,
  Layers,
  Trees,
  PieChart as PieIcon,
  Sprout,
  Activity,
  Calendar,
} from "lucide-react";
import { Row, Commodity, PeriodType } from "../types";
import {
  formatProductionNumber,
  formatAreaNumber,
  formatRawNumber,
  formatAchievementNumber,
  getStatus,
  getPreviousYearProgress,
  formatCompactNumber,
  getPeriodValues,
} from "../utils/formatters";
import ReactECharts from "echarts-for-react";

interface CommodityKpiPanelProps {
  commodity: Commodity;
  selectedRow: Row | null;
  title?: string;
  regionalCount?: number;
  unitCount?: number;
  period?: PeriodType;
}

export const CommodityKpiPanel: React.FC<CommodityKpiPanelProps> = ({
  commodity,
  selectedRow,
  title,
  regionalCount,
  unitCount,
  period = "kumulatif",
}) => {
  const isKayu = commodity.key === "kayu";
  const isTembakau = commodity.key === "tembakau";
  const row = selectedRow || commodity.grandTotal;

  if (!row) {
    return (
      <div className="bg-white rounded-[14px] p-6 text-center border border-[#E2E8F0] shadow-sm">
        <p className="text-xs text-[#64748B]">Data komoditas {commodity.name} belum diinput.</p>
      </div>
    );
  }

  const uCount = unitCount !== undefined ? unitCount : (commodity.units?.length || 0);
  const rCount = regionalCount !== undefined ? regionalCount : (commodity.regionals?.length || 0);

  const periodLabel = period === "hari_ini" ? "Hari Ini" : period === "bulan" ? "Bulan s/d HI" : "1 Jan s/d HI";
  const realLabel = period === "hari_ini" ? "Real Hari Ini" : period === "bulan" ? "Real Bulan s/d HI" : "Real 1 Jan s/d HI";
  const rkapLabel = period === "hari_ini" ? "RKAP Hari Ini" : period === "bulan" ? "RKAP Bulan s/d HI" : "RKAP 1 Jan s/d HI";
  const showVsTl = period === "kumulatif";

  const periodVals = getPeriodValues(row, period);
  const statusActive = getStatus(periodVals.achievement, commodity.hasRkap, periodVals.rkap);

  // Status Capaian Kumulatif 1 Jan s.d HI
  const statusYtd = getStatus(row.achievementYtd, commodity.hasRkap);
  const statusToday = getStatus(row.achievementToday, commodity.hasRkap);
  const statusMonth = getStatus(row.achievementToDate, commodity.hasRkap);

  // Progres vs Tahun Lalu (Kumulatif)
  const progressVsTL = getPreviousYearProgress(
    row.achievementVsPreviousYear,
    !isKayu && !isTembakau
  );

  // Selisih Realisasi vs RKAP (dalam KG lalu dikonversi atau satuan langsung)
  const calcDiff = (real: number | null, rkap: number | null) => {
    if (real === null || rkap === null) return null;
    return real - rkap;
  };

  const diffToday = calcDiff(row.actualToday, row.rkapToday);
  const diffMonth = calcDiff(row.actualToDate, row.rkapToDate);
  const diffYtd = calcDiff(row.productionActualYtd, row.productionRkapYtd);

  const fmtDec = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  // Helper tampilan selisih
  const renderDiff = (diffVal: number | null) => {
    if (diffVal === null) return <span className="text-[#94A3B8]">—</span>;
    const isPositive = diffVal >= 0;
    const sign = isPositive ? "+" : "";
    const inUnit = isKayu ? diffVal : diffVal / 1000;
    return (
      <span className={`font-black text-xs ${isPositive ? "text-[#2E7D32]" : "text-[#D32F2F]"}`}>
        {sign}{fmtDec(inUnit)} {isKayu ? "M³" : "Ton"}
      </span>
    );
  };

  // -------------------------------------------------------------
  // PANEL KHUSUS KOMODITAS KAYU (M3)
  // -------------------------------------------------------------
  if (isKayu) {
    const speciesList = [
      { key: "sengon", label: "Sengon" },
      { key: "jabon", label: "Jabon" },
      { key: "balsa", label: "Balsa" },
      { key: "gmelina", label: "Gmelina" },
      { key: "mahoni", label: "Mahoni" },
      { key: "mindi", label: "Mindi" },
      { key: "jati", label: "Jati" },
      { key: "suren", label: "Suren" },
      { key: "lainnya", label: "Kayu Lainnya" },
    ];

    const grandSpecies = row.species || [];
    const totalProdYtd = row.productionActualYtd || 0;

    const donutSpeciesData = speciesList
      .map((sp) => {
        const found = grandSpecies.find((s) => s.key === sp.key || s.label.toLowerCase() === sp.label.toLowerCase());
        const val = period === "hari_ini" ? found?.today : period === "bulan" ? found?.toDate : found?.ytd;
        return { name: sp.label, value: val || 0 };
      })
      .filter((s) => s.value > 0);

    const optionKayuDonut = {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "item",
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any) => `${p.name}: <b>${fmtDec(p.value)} M³</b> (${p.percent}%)`,
      },
      legend: { show: false },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "42%",
          style: {
            text: `TOTAL\n${formatCompactNumber(totalProdYtd)}\nM³`,
            textAlign: "center",
            fill: "#0B1F4B",
            fontSize: 13,
            fontWeight: "bold",
          },
        },
      ],
      series: [
        {
          name: "Jenis Kayu",
          type: "pie",
          radius: ["58%", "80%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#FFFFFF", borderWidth: 2 },
          data: donutSpeciesData,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* BARIS 1 (KAYU): 4 KARTU SIMETRIS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridAutoRows: "1fr" }}>
          {/* 1. Luas TP */}
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              LUAS TP (TOTAL TANAMAN)
            </span>
            <div className="text-[28px] sm:text-[34px] font-black text-[#0B1F4B] tabular-nums my-1">
              {formatAreaNumber(row.areaHa)}
            </div>
            <div className="text-xs text-[#64748B]">
              {rCount} Regional &bull; {uCount} Kebun
            </div>
          </div>

          {/* 2. Produksi Hari Ini */}
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              PRODUKSI HARI INI
            </span>
            <div className="text-[28px] sm:text-[34px] font-black text-[#0B1F4B] tabular-nums my-1">
              {formatProductionNumber(row.actualToday, "M3")} <span className="text-sm font-bold text-[#64748B]">M³</span>
            </div>
            <div className="text-xs text-[#64748B]">Volume harian</div>
          </div>

          {/* 3. Produksi s.d HI (Bulan Ini) */}
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              PRODUKSI S.D HI (BULAN)
            </span>
            <div className="text-[28px] sm:text-[34px] font-black text-[#0B1F4B] tabular-nums my-1">
              {formatProductionNumber(row.actualToDate, "M3")} <span className="text-sm font-bold text-[#64748B]">M³</span>
            </div>
            <div className="text-xs text-[#64748B]">Bulan berjalan</div>
          </div>

          {/* 4. Produksi s.d BI (Kumulatif 1 Jan s.d BI) - KARTU TOTAL NAVY */}
          <div className="bg-[#0B1F4B] text-white rounded-[14px] p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <Trees className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 pointer-events-none" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5B93E] block mb-1">
                PRODUKSI 1 JAN S.D BI
              </span>
              <div className="text-[28px] sm:text-[34px] font-black text-white tabular-nums">
                {formatProductionNumber(row.productionActualYtd, "M3")} <span className="text-sm font-bold text-white/80">M³</span>
              </div>
            </div>
            <div className="text-xs text-white/80 font-medium pt-2 border-t border-white/15">
              Total volume kayu ditebang
            </div>
          </div>
        </section>

        {/* BARIS 2 (KAYU): GRID 3x3 KARTU 9 JENIS KAYU */}
        <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-4">
          <div>
            <h3 className="text-sm sm:text-[15px] font-extrabold uppercase tracking-wider text-[#0B1F4B]">
              PRODUKSI 9 SPESIES KAYU (M³)
            </h3>
            <p className="text-xs text-[#64748B]">
              Nilai periode aktif ({period === "hari_ini" ? "Hari Ini" : period === "bulan" ? "Bulan s.d HI" : "1 Jan s.d BI"}) &bull; Rincian H.INI / S.D HI / S.D BI
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" style={{ gridAutoRows: "1fr" }}>
            {speciesList.map((sp) => {
              const found = grandSpecies.find(
                (s) => s.key === sp.key || s.label.toLowerCase() === sp.label.toLowerCase()
              );
              const valActive = period === "hari_ini" ? found?.today : period === "bulan" ? found?.toDate : found?.ytd;
              const hasProduction = (valActive || 0) > 0;
              const porsi = totalProdYtd > 0 ? ((found?.ytd || 0) / totalProdYtd) * 100 : 0;

              return (
                <div
                  key={sp.key}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    hasProduction
                      ? "bg-white border-[#E2E8F0] shadow-2xs"
                      : "bg-[#F3F5F9]/60 border-dashed border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#0B1F4B] uppercase tracking-wide">
                      {sp.label}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] bg-[#EEF2FA] px-2 py-0.5 rounded-md">
                      {fmtDec(porsi)}% dari total
                    </span>
                  </div>

                  {/* Nilai Periode Aktif Besar */}
                  <div>
                    <div className="text-[22px] sm:text-[26px] font-black text-[#0B1F4B] tabular-nums leading-tight">
                      {valActive !== null && valActive !== undefined ? fmtDec(valActive) : "—"}
                      <span className="text-xs font-bold text-[#64748B] ml-1">M³</span>
                    </div>
                  </div>

                  {/* Progress bar porsi */}
                  <div className="w-full bg-[#EEF2FA] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8D6E63] rounded-full"
                      style={{ width: `${Math.min(porsi, 100)}%` }}
                    />
                  </div>

                  {/* 3 Angka Kecil H.INI / S.D HI / S.D BI */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#E2E8F0] text-[10px] text-center">
                    <div>
                      <div className="text-[#64748B] font-semibold">H.INI</div>
                      <div className="font-bold text-[#0B1F4B] tabular-nums">{fmtDec(found?.today ?? null)}</div>
                    </div>
                    <div className="border-x border-[#E2E8F0]">
                      <div className="text-[#64748B] font-semibold">S.D HI</div>
                      <div className="font-bold text-[#0B1F4B] tabular-nums">{fmtDec(found?.toDate ?? null)}</div>
                    </div>
                    <div>
                      <div className="text-[#64748B] font-semibold">S.D BI</div>
                      <div className="font-bold text-[#0B1F4B] tabular-nums">{fmtDec(found?.ytd ?? null)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BARIS 3 (KAYU): DONUT KOMPOSISI JENIS KAYU */}
        <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-3">
          <h3 className="text-sm sm:text-[15px] font-extrabold uppercase tracking-wider text-[#0B1F4B]">
            KOMPOSISI SPESIES KAYU (PTPN I)
          </h3>
          <div className="h-[280px] w-full">
            <ReactECharts option={optionKayuDonut} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PANEL 5 KOMODITAS DENGAN RKAP (Karet, Teh, Kopi Arabika, Kopi Robusta, Tembakau)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* BARIS 1: 4 KARTU SIMETRIS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ gridAutoRows: "1fr" }}>
        {/* 1. Luas TM (Ha) */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            LUAS TM (AREAL)
          </span>
          <div className="text-[28px] sm:text-[34px] font-black text-[#0B1F4B] tabular-nums my-1">
            {formatAreaNumber(row.areaHa)}
          </div>
          <div className="text-xs text-[#64748B]">
            {rCount} Regional &bull; {uCount} Kebun
          </div>
        </div>

        {/* 2. Realisasi Sesuai Periode Aktif + panah vs TL */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32]">
            {realLabel.toUpperCase()}
          </span>
          <div className="text-[28px] sm:text-[34px] font-black text-[#0B1F4B] tabular-nums my-1">
            {formatProductionNumber(periodVals.actual, commodity.unit)}{" "}
            <span className="text-sm font-bold text-[#64748B]">Ton</span>
          </div>
          {showVsTl && (
            <div className="text-xs font-semibold flex items-center gap-1.5 transition-opacity duration-200" style={{ color: progressVsTL.color }}>
              <span>{progressVsTL.arrow}</span>
              <span>{progressVsTL.text}</span>
            </div>
          )}
        </div>

        {/* 3. % Capaian Sesuai Periode Aktif thd RKAP (Chip Besar) */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            % CAPAIAN {periodLabel.toUpperCase()}
          </span>
          <div className="my-1">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[20px] sm:text-[24px] font-black tabular-nums shadow-2xs"
              style={{
                backgroundColor: statusActive.bgColor,
                color: statusActive.textColor,
                border: `1px solid ${statusActive.borderColor}`,
              }}
            >
              <span>{statusActive.arrow}</span>
              <span>{periodVals.achievement !== null ? `${fmtDec(periodVals.achievement)}%` : "—"}</span>
            </span>
          </div>
          <div className="text-xs font-medium" style={{ color: statusActive.textColor }}>
            {statusActive.label}
          </div>
        </div>

        {/* 4. KARTU TOTAL NAVY: Protas Real 1 Jan s.d HI KG/Ha + RKAP */}
        <div className="bg-[#0B1F4B] text-white rounded-[14px] p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <Activity className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 pointer-events-none" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5B93E] block mb-1">
              PROTAS REAL (KG/HA)
            </span>
            <div className="text-[28px] sm:text-[34px] font-black text-white tabular-nums leading-tight">
              {formatRawNumber(row.productivityActual)}{" "}
              <span className="text-xs font-bold text-white/70">KG/Ha</span>
            </div>
          </div>
          <div className="text-xs text-white/80 font-medium pt-2 border-t border-white/15">
            RKAP: <b className="text-[#F5B93E]">{formatRawNumber(row.productivityRkap)} KG/Ha</b>
          </div>
        </div>
      </section>

      {/* BARIS 2: KARTU "MATRIKS PERIODE" LEBAR PENUH */}
      <section className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] overflow-hidden">
        <div className="p-4 sm:p-5 pb-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-[15px] font-extrabold uppercase tracking-wider text-[#0B1F4B]">
              MATRIKS PERIODE PRODUKSI
            </h3>
            <p className="text-xs text-[#64748B]">
              Perbandingan Realisasi, RKAP, % Capaian, dan Selisih antar periode
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-[#EEF2FA] text-[#0B1F4B] px-3 py-1 rounded-full border border-slate-200">
            Periode aktif: <b className="uppercase">{period === "hari_ini" ? "Hari Ini" : period === "bulan" ? "Bulan s.d HI" : "1 Jan s.d HI"}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#0B1F4B] text-white">
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-1/4">INDIKATOR</th>
                <th
                  className={`py-3 px-4 font-extrabold uppercase tracking-wider text-right w-1/4 ${
                    period === "hari_ini" ? "bg-[#16306B] ring-2 ring-[#F5B93E]/50" : ""
                  }`}
                >
                  HARI INI
                </th>
                <th
                  className={`py-3 px-4 font-extrabold uppercase tracking-wider text-right w-1/4 ${
                    period === "bulan" ? "bg-[#16306B] ring-2 ring-[#F5B93E]/50" : ""
                  }`}
                >
                  S.D HARI INI (BULAN)
                </th>
                <th
                  className={`py-3 px-4 font-extrabold uppercase tracking-wider text-right w-1/4 ${
                    period === "kumulatif" ? "bg-[#16306B] ring-2 ring-[#F5B93E]/50" : ""
                  }`}
                >
                  1 JAN S.D HARI INI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-medium">
              {/* Baris Realisasi */}
              <tr className="hover:bg-[#F3F5F9]/60">
                <td className="py-3 px-4 font-bold text-[#0B1F4B]">Realisasi (Ton)</td>
                <td className={`py-3 px-4 text-right font-black tabular-nums ${period === "hari_ini" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.actualToday, commodity.unit)}
                </td>
                <td className={`py-3 px-4 text-right font-black tabular-nums ${period === "bulan" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.actualToDate, commodity.unit)}
                </td>
                <td className={`py-3 px-4 text-right font-black tabular-nums ${period === "kumulatif" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.productionActualYtd, commodity.unit)}
                </td>
              </tr>

              {/* Baris RKAP */}
              <tr className="hover:bg-[#F3F5F9]/60">
                <td className="py-3 px-4 font-bold text-[#64748B]">RKAP (Ton)</td>
                <td className={`py-3 px-4 text-right tabular-nums text-[#64748B] ${period === "hari_ini" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.rkapToday, commodity.unit)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums text-[#64748B] ${period === "bulan" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.rkapToDate, commodity.unit)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums text-[#64748B] ${period === "kumulatif" ? "bg-[#EEF2FA]" : ""}`}>
                  {formatProductionNumber(row.productionRkapYtd, commodity.unit)}
                </td>
              </tr>

              {/* Baris % Capaian */}
              <tr className="hover:bg-[#F3F5F9]/60">
                <td className="py-3 px-4 font-bold text-[#0B1F4B]">% Capaian thd RKAP</td>
                <td className={`py-3 px-4 text-right ${period === "hari_ini" ? "bg-[#EEF2FA]" : ""}`}>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black tabular-nums"
                    style={{ backgroundColor: statusToday.bgColor, color: statusToday.textColor }}
                  >
                    {statusToday.arrow} {row.achievementToday !== null ? `${fmtDec(row.achievementToday)}%` : "—"}
                  </span>
                </td>
                <td className={`py-3 px-4 text-right ${period === "bulan" ? "bg-[#EEF2FA]" : ""}`}>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black tabular-nums"
                    style={{ backgroundColor: statusMonth.bgColor, color: statusMonth.textColor }}
                  >
                    {statusMonth.arrow} {row.achievementToDate !== null ? `${fmtDec(row.achievementToDate)}%` : "—"}
                  </span>
                </td>
                <td className={`py-3 px-4 text-right ${period === "kumulatif" ? "bg-[#EEF2FA]" : ""}`}>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black tabular-nums"
                    style={{ backgroundColor: statusYtd.bgColor, color: statusYtd.textColor }}
                  >
                    {statusYtd.arrow} {row.achievementYtd !== null ? `${fmtDec(row.achievementYtd)}%` : "—"}
                  </span>
                </td>
              </tr>

              {/* Baris Selisih (+/- Ton) */}
              <tr className="hover:bg-[#F3F5F9]/60">
                <td className="py-3 px-4 font-bold text-[#0B1F4B]">Selisih (Real − RKAP)</td>
                <td className={`py-3 px-4 text-right tabular-nums ${period === "hari_ini" ? "bg-[#EEF2FA]" : ""}`}>
                  {renderDiff(diffToday)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums ${period === "bulan" ? "bg-[#EEF2FA]" : ""}`}>
                  {renderDiff(diffMonth)}
                </td>
                <td className={`py-3 px-4 text-right tabular-nums ${period === "kumulatif" ? "bg-[#EEF2FA]" : ""}`}>
                  {renderDiff(diffYtd)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* BARIS 3: 3 KARTU SIMETRIS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridAutoRows: "1fr" }}>
        {/* 1. RKAP Tahun Ini + Capaian RKAP Setahun */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              RKAP TAHUN INI
            </span>
            <Target className="w-4 h-4 text-[#1565C0]" />
          </div>

          <div>
            <div className="text-[26px] sm:text-[30px] font-black text-[#0B1F4B] tabular-nums leading-tight">
              {formatProductionNumber(row.annualRkap, commodity.unit)}{" "}
              <span className="text-sm font-bold text-[#64748B]">Ton</span>
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Target produksi satu tahun penuh
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#64748B]">Capaian RKAP Setahun</span>
              <span className="font-black text-[#0B1F4B]">
                {row.achievementAnnual !== null ? `${fmtDec(row.achievementAnnual)}%` : "—"}
              </span>
            </div>
            <div className="w-full bg-[#EEF2FA] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1565C0] rounded-full"
                style={{ width: `${Math.min(row.achievementAnnual || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Protas Tahun Lalu */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              PROTAS TAHUN LALU
            </span>
            <Award className="w-4 h-4 text-[#64748B]" />
          </div>

          <div>
            <div className="text-[26px] sm:text-[30px] font-black text-[#0B1F4B] tabular-nums leading-tight">
              {!isTembakau ? (
                <>
                  {formatRawNumber(row.previousYearActual)}{" "}
                  <span className="text-sm font-bold text-[#64748B]">KG/Ha</span>
                </>
              ) : (
                <span className="text-base text-[#94A3B8]">Tidak tersedia</span>
              )}
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              {!isTembakau ? "Realisasi produktivitas tahun sebelumnya" : "Data historis tahun lalu tidak dicatat"}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            Indikator efisiensi agronomi kebun
          </div>
        </div>

        {/* 3. Progres vs Tahun Lalu (% Capaian thd Real TL) */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              PROGRES VS TAHUN LALU
            </span>
            <TrendingUp className="w-4 h-4" style={{ color: showVsTl ? progressVsTL.color : "#94A3B8" }} />
          </div>

          {showVsTl ? (
            <div className="transition-opacity duration-200">
              {!isTembakau && row.achievementVsPreviousYear !== null ? (
                <div className="text-[26px] sm:text-[30px] font-black tabular-nums leading-tight" style={{ color: progressVsTL.color }}>
                  {progressVsTL.arrow} {fmtDec(row.achievementVsPreviousYear)}%
                </div>
              ) : (
                <div className="text-base text-[#94A3B8] font-bold">
                  {isTembakau ? "Tidak tersedia" : "—"}
                </div>
              )}
              <div className="text-xs mt-1 font-semibold" style={{ color: progressVsTL.color }}>
                {progressVsTL.label}
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-[#94A3B8] font-medium leading-relaxed transition-opacity duration-200">
              Perbandingan tahun lalu tersedia pada periode 1 Jan s/d HI
            </div>
          )}

          <div className="pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            {showVsTl ? `${progressVsTL.text} thd produksi real tahun lalu` : "Tersedia pada periode 1 Jan s/d HI"}
          </div>
        </div>
      </section>
    </div>
  );
};
