/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  Sprout,
  Target,
  Gauge,
  Layers,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  ArrowUpRight,
  Hourglass,
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardResponse, PeriodType, CommodityKey } from "../../types";
import {
  COMMODITIES_METADATA,
  ALL_COMMODITY_KEYS,
  formatProductionNumber,
  formatRawNumber,
  formatAreaNumber,
  formatCompactNumber,
  getStatus,
  getPreviousYearProgress,
} from "../../utils/formatters";
import { CommodityIcon, getCommodityCursorStyle } from "../CommodityIcons";
import { AnimatedCounter } from "../AnimatedCounter";

interface BerandaTabProps {
  data: DashboardResponse;
  period: PeriodType;
  onNavigateCommodity: (key: CommodityKey) => void;
  onNavigateToKebunWithFilter?: (key: CommodityKey) => void;
}

export const BerandaTab: React.FC<BerandaTabProps> = ({
  data,
  onNavigateCommodity,
  onNavigateToKebunWithFilter,
}) => {
  // Selector komoditas: "semua" atau key komoditas spesifik
  const [selectedFilter, setSelectedFilter] = useState<"semua" | CommodityKey>("semua");

  const fmtDec = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  // Helper jika satu komoditas terpilih
  const currentComm = selectedFilter !== "semua" ? data.commodities?.[selectedFilter] : null;
  const currentMeta = selectedFilter !== "semua" ? COMMODITIES_METADATA[selectedFilter] : null;
  const isSelectedKayu = selectedFilter === "kayu";

  // Data Papan Indeks 6 Komoditas saat "semua"
  const indexBoardData = useMemo(() => {
    return ALL_COMMODITY_KEYS.map((key) => {
      const comm = data.commodities?.[key];
      const meta = COMMODITIES_METADATA[key];
      const grand = comm?.grandTotal;
      const isKayu = key === "kayu";

      // 1 Jan s.d HI metrics
      const rawReal = grand?.productionActualYtd ?? null;
      const rawRkap = grand?.productionRkapYtd ?? null;
      const capaian = grand?.achievementYtd ?? null;
      const achVsTL = grand?.achievementVsPreviousYear ?? null;
      const rawProtas = grand?.productivityActual ?? null;

      // Aturan data baru:
      // Realisasi null atau 0
      const isRealEmpty = rawReal === null || rawReal === 0;
      // RKAP null atau 0
      const isRkapEmpty = !isKayu && (rawRkap === null || rawRkap === 0);

      // Status capaian & progres
      const status = isRkapEmpty
        ? {
            color: "#94A3B8",
            arrow: "—",
            icon: "—",
            label: "Belum ada RKAP",
            bgColor: "#F1F5F9",
            borderColor: "#CBD5E1",
            textColor: "#64748B",
            formatted: "—",
          }
        : getStatus(capaian, !isKayu, rawRkap);

      // Panah progres vs TL: jika realisasi null/0, progres = "—"
      const progress = isRealEmpty
        ? {
            delta: null,
            arrow: "—",
            icon: "—",
            color: "#94A3B8",
            label: "Belum ada data",
            text: "—",
            tooltip: "Belum ada data realisasi",
            hasData: false,
            bgColor: "#F1F5F9",
          }
        : getPreviousYearProgress(achVsTL, !isKayu && key !== "tembakau");

      // Protas 0 / null -> "—"
      const protasText = rawProtas === null || rawProtas === 0 ? "—" : `${formatRawNumber(rawProtas)} KG/Ha`;

      // Perhitungan khusus kayu
      let activeSpeciesCount = 0;
      let topSpeciesName = "—";
      let topSpeciesVol = 0;

      if (isKayu && grand?.species) {
        grand.species.forEach((s) => {
          const val = s.ytd || 0;
          if (val > 0) activeSpeciesCount++;
          if (val > topSpeciesVol) {
            topSpeciesVol = val;
            topSpeciesName = s.label;
          }
        });
      }

      return {
        key,
        name: meta.name,
        color: meta.color,
        lightBg: meta.lightBg,
        borderColor: meta.borderColor,
        unit: meta.unit,
        unitLabel: isKayu ? "M³" : "Ton",
        real: rawReal,
        rkap: rawRkap,
        capaian,
        protas: rawProtas,
        protasText,
        status,
        progress,
        isKayu,
        isRealEmpty,
        isRkapEmpty,
        activeSpeciesCount,
        topSpeciesName,
        topSpeciesVol,
        available: comm?.available ?? false,
      };
    });
  }, [data]);

  // Chart Semua Komoditas: Capaian thd RKAP per Komoditas (horizontal bar)
  const optionChartSemuaKomoditas = useMemo(() => {
    const validComms = indexBoardData.filter((c) => !c.isKayu && !c.isRkapEmpty && c.capaian !== null);
    const names = validComms.map((c) => c.name);
    const values = validComms.map((c) => ({
      value: c.capaian,
      itemStyle: {
        color: c.status.color,
        borderRadius: [0, 6, 6, 0],
      },
    }));

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (params: any[]) => {
          const p = params[0];
          const st = getStatus(p.value);
          return `<div class="font-bold text-amber-300 mb-1">${p.name}</div>
                  <div>Capaian 1 Jan s.d HI: <b style="color:${st.color}">${st.arrow} ${fmtDec(p.value)}%</b> (${st.label})</div>`;
        },
      },
      grid: { top: 20, left: "3%", right: "12%", bottom: 25, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: { formatter: "{value}%", color: "#64748B", fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#0B1F4B", fontWeight: 700, fontSize: 12 },
      },
      series: [
        {
          name: "Capaian thd RKAP",
          type: "bar",
          data: values,
          barMaxWidth: 26,
          label: {
            show: true,
            position: "right",
            formatter: (p: any) => `${fmtDec(p.value)}%`,
            fontWeight: "bold",
            fontSize: 11,
            color: "#0B1F4B",
          },
          markLine: {
            symbol: "none",
            data: [
              {
                xAxis: 100,
                lineStyle: { color: "#F5B93E", width: 2, type: "solid" },
                label: {
                  formatter: "RKAP 100%",
                  position: "end",
                  color: "#B45309",
                  fontWeight: "bold",
                  fontSize: 10,
                },
              },
            ],
          },
          markArea: {
            silent: true,
            data: [
              [
                {
                  xAxis: 0,
                  itemStyle: { color: "rgba(220, 38, 38, 0.04)" },
                },
                { xAxis: 95 },
              ],
              [
                {
                  xAxis: 95,
                  itemStyle: { color: "rgba(245, 158, 11, 0.04)" },
                },
                { xAxis: 100 },
              ],
              [
                {
                  xAxis: 100,
                  itemStyle: { color: "rgba(22, 163, 74, 0.05)" },
                },
                { xAxis: 200 },
              ],
            ],
          },
        },
      ],
    };
  }, [indexBoardData]);

  // Ranking data saat 1 komoditas dipilih
  const singleCommRanking = useMemo(() => {
    if (!currentComm?.units) {
      return { top5: [], bottom5: [], nullCount: 0, totalUnits: 0 };
    }

    const units = currentComm.units;
    const totalUnits = units.length;

    if (isSelectedKayu) {
      const valid = units
        .filter((u) => u.productionActualYtd !== null && !isNaN(u.productionActualYtd))
        .sort((a, b) => (b.productionActualYtd || 0) - (a.productionActualYtd || 0));

      return {
        top5: valid.slice(0, 5),
        bottom5: [...valid].reverse().slice(0, 5),
        nullCount: totalUnits - valid.length,
        totalUnits,
      };
    }

    const valid = units
      .filter((u) => u.achievementYtd !== null && !isNaN(u.achievementYtd))
      .sort((a, b) => (b.achievementYtd || 0) - (a.achievementYtd || 0));

    return {
      top5: valid.slice(0, 5),
      bottom5: [...valid].reverse().slice(0, 5),
      nullCount: totalUnits - valid.length,
      totalUnits,
    };
  }, [currentComm, isSelectedKayu]);

  // Insight otomatis (CATATAN) saat 1 komoditas dipilih
  const autoNote = useMemo(() => {
    if (!currentComm) return "";
    const name = currentMeta?.name || "Komoditas";
    const grand = currentComm.grandTotal;

    if (isSelectedKayu) {
      const vol = grand?.productionActualYtd ? formatProductionNumber(grand.productionActualYtd, "M3") : "—";
      return `Total produksi Kayu 1 Jan s.d BI mencapai ${vol} M³. Unit penghasil terbesar adalah ${singleCommRanking.top5[0]?.name || "—"}.`;
    }

    const ach = grand?.achievementYtd;
    const achText = ach !== null && ach !== undefined ? `${fmtDec(ach)}%` : "—";
    const stLabel = getStatus(ach).label.toLowerCase();

    const sortedReg = [...(currentComm.regionals || [])]
      .filter((r) => r.achievementYtd !== null)
      .sort((a, b) => (a.achievementYtd || 0) - (b.achievementYtd || 0));

    const lowestReg = sortedReg[0];
    const lowestRegText = lowestReg
      ? `Regional terendah: ${lowestReg.name} (${fmtDec(lowestReg.achievementYtd)}%).`
      : "";

    const focusUnits = singleCommRanking.bottom5
      .slice(0, 3)
      .map((u) => u.name)
      .join(", ");

    const focusText = focusUnits ? `Fokus perhatian: ${focusUnits}.` : "";

    return `Capaian ${name} 1 Jan s.d HI ${achText} (${stLabel}). ${lowestRegText} ${focusText}`;
  }, [currentComm, currentMeta, isSelectedKayu, singleCommRanking]);

  // Chart Donut Kontribusi Regional saat 1 komoditas dipilih
  const optionDonutRegional = useMemo(() => {
    if (!currentComm?.regionals) return null;

    const list = currentComm.regionals
      .map((r) => {
        const val = r.productionActualYtd;
        return {
          name: r.name,
          value: val !== null ? (isSelectedKayu ? val : val / 1000) : 0,
        };
      })
      .filter((r) => r.value > 0);

    const total = list.reduce((a, b) => a + b.value, 0);

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "item",
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any) => `${p.name}: <b>${fmtDec(p.value)} ${isSelectedKayu ? "M³" : "Ton"}</b> (${p.percent}%)`,
      },
      legend: { show: false },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "43%",
          style: {
            text: `TOTAL\n${formatCompactNumber(total)}\n${isSelectedKayu ? "M³" : "Ton"}`,
            textAlign: "center",
            fill: "#0B1F4B",
            fontSize: 13,
            fontWeight: "bold",
          },
        },
      ],
      series: [
        {
          name: "Kontribusi",
          type: "pie",
          radius: ["58%", "80%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#FFFFFF", borderWidth: 2 },
          label: {
            show: true,
            position: "inside",
            formatter: "{d}%",
            fontSize: 10,
            fontWeight: "bold",
            color: "#FFFFFF",
          },
          data: list,
        },
      ],
    };
  }, [currentComm, isSelectedKayu]);

  // Chart Grouped Bar Real vs RKAP per Kebun saat 1 komoditas dipilih
  const optionGroupedBarKebun = useMemo(() => {
    if (!currentComm?.units || currentComm.units.length === 0) return null;

    const sortedUnits = [...currentComm.units]
      .filter((u) => u.productionActualYtd !== null)
      .sort((a, b) => (b.productionActualYtd || 0) - (a.productionActualYtd || 0))
      .slice(0, 16);

    const categories = sortedUnits.map((u) => u.name);
    const realVals = sortedUnits.map((u) => {
      const v = u.productionActualYtd;
      return v !== null ? (isSelectedKayu ? v : v / 1000) : 0;
    });
    const rkapVals = sortedUnits.map((u) => {
      const v = u.productionRkapYtd;
      return v !== null ? (isSelectedKayu ? 0 : v / 1000) : 0;
    });

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (params: any[]) => {
          let str = `<div class="font-bold text-amber-300 mb-1">${params[0].name}</div>`;
          params.forEach((p) => {
            str += `<div>${p.seriesName}: <b>${fmtDec(p.value)} ${isSelectedKayu ? "M³" : "Ton"}</b></div>`;
          });
          return str;
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: "#0B1F4B", fontWeight: 700, fontSize: 11 },
      },
      grid: { top: 35, left: "3%", right: "3%", bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: 35,
          color: "#0F172A",
          fontSize: 10,
          fontWeight: 600,
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: isSelectedKayu ? "M³" : "Ton",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: { color: "#64748B", fontSize: 11 },
      },
      series: [
        {
          name: "Realisasi",
          type: "bar",
          data: realVals,
          barMaxWidth: 18,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#16A34A" },
                { offset: 1, color: "#2E7D32" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        ...(!isSelectedKayu
          ? [
              {
                name: "RKAP",
                type: "bar",
                data: rkapVals,
                barMaxWidth: 18,
                itemStyle: {
                  color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: "#FBBF24" },
                      { offset: 1, color: "#F59E0B" },
                    ],
                  },
                  borderRadius: [4, 4, 0, 0],
                },
              },
            ]
          : []),
      ],
    };
  }, [currentComm, isSelectedKayu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-12"
    >
      {/* 1. Bar Pemilih Komoditas (Chip Berwarna Identitas) */}
      <section className="glass-card rounded-[18px] p-3 sm:p-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Tombol "Semua" */}
          <button
            type="button"
            onClick={() => setSelectedFilter("semua")}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              selectedFilter === "semua"
                ? "bg-[#0B1F4B] text-white shadow-md ring-2 ring-[#0B1F4B]/20"
                : "bg-white/90 text-[#0B1F4B] hover:bg-white"
            }`}
          >
            Semua Komoditas
          </button>

          {/* 6 Komoditas dengan Ikon SVG Flat */}
          {ALL_COMMODITY_KEYS.map((key) => {
            const m = COMMODITIES_METADATA[key];
            const isActive = selectedFilter === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFilter(key)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                  isActive
                    ? "text-white shadow-md ring-2 ring-black/10 scale-102"
                    : "bg-white/80 text-[#0F172A] hover:bg-white border border-white/60"
                }`}
                style={isActive ? { backgroundColor: m.color } : undefined}
              >
                <CommodityIcon
                  commodityKey={key}
                  size={16}
                  color={isActive ? "#FFFFFF" : m.color}
                />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. JIKA "SEMUA" DIPILIH — PAPAN INDEKS 6 KOMODITAS */}
      {selectedFilter === "semua" && (
        <div className="space-y-6">
          {/* Grid 6 Kartu Simetris Sama Ukuran */}
          <section
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ gridAutoRows: "1fr" }}
          >
            {indexBoardData.map((item, idx) => {
              const isPulsing = item.status.arrow === "▲";

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  onClick={() => onNavigateCommodity(item.key)}
                  className={`glass-card interactive-card rounded-[18px] flex flex-col justify-between overflow-hidden cursor-pointer group relative ${
                    item.isRealEmpty ? "opacity-85" : ""
                  }`}
                  style={{
                    cursor: getCommodityCursorStyle(item.key),
                  }}
                >
                  {/* Strip Atas 4px Warna Komoditas */}
                  <div
                    className="h-1 w-full transition-all duration-300 group-hover:h-1.5"
                    style={{ backgroundColor: item.color }}
                  />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    {/* Header Kartu: Ikon Flat SVG + Nama Komoditas + Detail */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                          style={{ backgroundColor: item.lightBg }}
                        >
                          <CommodityIcon
                            commodityKey={item.key}
                            size={20}
                            color={item.color}
                          />
                        </div>
                        <h3 className="text-sm font-bold text-[#0B1F4B]">
                          {item.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-[#64748B] group-hover:text-[#0B1F4B] flex items-center gap-0.5 transition-colors">
                        Detail <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Metrik Realisasi 1 Jan s.d HI */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-0.5">
                        {item.isKayu ? "Real 1 Jan s.d BI" : "Real 1 Jan s.d HI"}
                      </span>

                      {item.isRealEmpty ? (
                        <div className="flex items-center gap-2 text-slate-500 py-1">
                          <Hourglass className="w-5 h-5 text-slate-400 animate-pulse" />
                          <span className="text-sm font-bold">
                            {item.isKayu ? "Belum ada produksi" : "Belum ada data"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-[28px] sm:text-[32px] font-bold text-[#0B1F4B] tabular-nums tracking-tight font-display">
                            <AnimatedCounter
                              value={
                                item.unit === "KG" && item.real !== null
                                  ? item.real / 1000
                                  : item.real
                              }
                              decimals={2}
                            />
                          </span>
                          <span className="text-sm font-bold text-[#64748B]">
                            {item.unitLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chip Capaian thd RKAP & Panah Progres vs TL */}
                    {!item.isKayu ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {/* Chip Capaian RKAP */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isPulsing ? "status-chip-green-pulse" : ""
                            }`}
                            style={{
                              backgroundColor: item.status.bgColor,
                              color: item.status.textColor,
                              border: `1px solid ${item.status.borderColor}`,
                            }}
                          >
                            <span>{item.status.arrow}</span>
                            <span>
                              {item.isRkapEmpty
                                ? "Belum ada RKAP"
                                : item.capaian !== null
                                ? `${fmtDec(item.capaian)}%`
                                : "—"}
                            </span>
                          </div>

                          {/* Panah Progres vs TL */}
                          <div
                            className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: item.progress.color }}
                            title={item.progress.tooltip}
                          >
                            <span>{item.progress.arrow}</span>
                            <span>{item.progress.text}</span>
                          </div>
                        </div>

                        {/* Progress Bar Capaian */}
                        <div className="w-full bg-[#EEF2FA] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                item.isRkapEmpty ? 0 : Math.min(item.capaian || 0, 100)
                              }%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: item.status.color,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Khusus Kayu */
                      <div className="space-y-1.5 bg-[#EEF2FA]/70 p-2.5 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-[#0B1F4B]">
                          Jenis aktif: <span className="text-[#2E7D32]">{item.activeSpeciesCount}</span> dari 9
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          Dominan: <b className="text-[#0B1F4B]">{item.topSpeciesName}</b> ({fmtDec(item.topSpeciesVol)} M³)
                        </div>
                      </div>
                    )}

                    {/* Baris Bawah: RKAP Ton | Protas KG/Ha */}
                    {!item.isKayu && (
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                        <div>
                          RKAP:{" "}
                          <b className="text-[#0B1F4B]">
                            {item.isRkapEmpty
                              ? "—"
                              : `${formatProductionNumber(item.rkap, item.unit)} Ton`}
                          </b>
                        </div>
                        <div className="border-l border-[#E2E8F0] pl-2">
                          Protas: <b className="text-[#0B1F4B]">{item.protasText}</b>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </section>

          {/* Grafik Horizontal Bar Capaian thd RKAP per Komoditas */}
          <section className="glass-card rounded-[18px] p-4 sm:p-5 space-y-2">
            <div>
              <h2 className="text-sm sm:text-[15px] font-bold text-[#0B1F4B] font-display">
                Capaian thd RKAP per Komoditas (1 Jan s.d HI)
              </h2>
              <p className="text-xs text-[#64748B]">
                Garis target emas 100% &bull; Pita status merah (&lt;95%), kuning (95-100%), hijau (&ge;100%)
              </p>
            </div>
            <div className="h-[280px] sm:h-[320px] w-full">
              <ReactECharts
                option={optionChartSemuaKomoditas}
                style={{ height: "100%", width: "100%" }}
                opts={{ renderer: "svg" }}
              />
            </div>
          </section>
        </div>
      )}

      {/* 3. JIKA SATU KOMODITAS DIPILIH — LAYOUT INFOGRAFIS LENGKAP */}
      {selectedFilter !== "semua" && currentComm && (
        <motion.div
          key={selectedFilter}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* BARIS 1: 4 KARTU SIMETRIS */}
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            style={{ gridAutoRows: "1fr" }}
          >
            {/* Kartu 1: REALISASI 1 JAN S.D HI */}
            <div className="glass-card interactive-card rounded-[18px] p-4 sm:p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center shrink-0">
                <Sprout className="w-7 h-7 text-[#2E7D32]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32] block">
                  Realisasi 1 Jan s.d HI
                </span>
                <div className="text-[24px] sm:text-[28px] font-bold text-[#0B1F4B] tabular-nums leading-tight font-display">
                  <AnimatedCounter
                    value={
                      currentComm.unit === "KG" && currentComm.grandTotal?.productionActualYtd !== null
                        ? (currentComm.grandTotal?.productionActualYtd || 0) / 1000
                        : currentComm.grandTotal?.productionActualYtd
                    }
                    decimals={2}
                  />
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                  {!isSelectedKayu
                    ? `${fmtDec(currentComm.grandTotal?.achievementYtd ?? null)}% dari RKAP`
                    : "Volume kumulatif M³"}
                </div>
              </div>
            </div>

            {/* Kartu 2: RKAP 1 JAN S.D HI */}
            <div className="glass-card interactive-card rounded-[18px] p-4 sm:p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E3F2FD] flex items-center justify-center shrink-0">
                <Target className="w-7 h-7 text-[#1565C0]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0] block">
                  RKAP 1 Jan s.d HI
                </span>
                <div className="text-[24px] sm:text-[28px] font-bold text-[#0B1F4B] tabular-nums leading-tight font-display">
                  <AnimatedCounter
                    value={
                      currentComm.unit === "KG" && currentComm.grandTotal?.productionRkapYtd !== null
                        ? (currentComm.grandTotal?.productionRkapYtd || 0) / 1000
                        : currentComm.grandTotal?.productionRkapYtd
                    }
                    decimals={2}
                  />
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                  {!isSelectedKayu ? "Target 1 Jan s.d Hari Ini" : "Tanpa Target RKAP"}
                </div>
              </div>
            </div>

            {/* Kartu 3: CAPAIAN THD RKAP */}
            <div className="glass-card interactive-card rounded-[18px] p-4 sm:p-5 flex items-center gap-4">
              {(() => {
                const ach = currentComm.grandTotal?.achievementYtd ?? null;
                const rkap = currentComm.grandTotal?.productionRkapYtd ?? null;
                const st = getStatus(ach, !isSelectedKayu, rkap);
                const prog = getPreviousYearProgress(
                  currentComm.grandTotal?.achievementVsPreviousYear,
                  !isSelectedKayu && selectedFilter !== "tembakau"
                );

                return (
                  <>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: st.bgColor }}
                    >
                      <Gauge className="w-7 h-7" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider block"
                        style={{ color: st.color }}
                      >
                        Capaian thd RKAP
                      </span>
                      <div
                        className="text-[24px] sm:text-[28px] font-bold tabular-nums leading-tight font-display"
                        style={{ color: st.color }}
                      >
                        {ach !== null && !isSelectedKayu ? `${st.arrow} ${fmtDec(ach)}%` : "—"}
                      </div>
                      <div
                        className="text-[11px] mt-0.5 font-semibold flex items-center gap-1.5"
                        style={{ color: prog.color }}
                      >
                        <span>{prog.arrow}</span>
                        <span>{prog.text}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Kartu 4: KARTU TOTAL NAVY */}
            <div className="bg-[#0B1F4B] text-white rounded-[18px] p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
              <Layers className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 pointer-events-none" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5B93E] block mb-1">
                  Luas TM / Areal
                </span>
                <div className="text-[26px] sm:text-[30px] font-bold text-white tabular-nums leading-tight font-display">
                  <AnimatedCounter
                    value={currentComm.grandTotal?.areaHa ?? null}
                    decimals={2}
                    suffix=" Ha"
                  />
                </div>
              </div>
              <div className="text-xs text-white/80 font-medium pt-2 border-t border-white/15">
                {currentComm.regionals?.length || 0} Regional &bull; {currentComm.units?.length || 0} Kebun
              </div>
            </div>
          </section>

          {/* BARIS 2: REALISASI VS RKAP PER KEBUN (2/3) + KONTRIBUSI & TOP 5 (1/3) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kiri (2/3): Realisasi vs RKAP per Kebun */}
            <div className="lg:col-span-2 glass-card rounded-[18px] p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-[15px] font-bold text-[#0B1F4B] font-display">
                    Realisasi vs RKAP per Kebun (1 Jan s.d HI)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Kebun teratas berdasarkan volume produksi {isSelectedKayu ? "M³" : "Ton"}
                  </p>
                </div>
                {onNavigateToKebunWithFilter && (
                  <button
                    type="button"
                    onClick={() => onNavigateToKebunWithFilter(selectedFilter)}
                    className="text-xs font-bold text-[#1565C0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Semua Kebun <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="h-[340px] w-full">
                {optionGroupedBarKebun && (
                  <ReactECharts
                    option={optionGroupedBarKebun}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: "svg" }}
                  />
                )}
              </div>
            </div>

            {/* Kanan (1/3): Donut Kontribusi + Top 5 */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Donut Kontribusi Regional */}
              <div className="glass-card rounded-[18px] p-4 space-y-2">
                <h4 className="text-xs font-bold text-[#0B1F4B] font-display">
                  Kontribusi per Regional
                </h4>
                <div className="h-[180px] w-full">
                  {optionDonutRegional && (
                    <ReactECharts
                      option={optionDonutRegional}
                      style={{ height: "100%", width: "100%" }}
                      opts={{ renderer: "svg" }}
                    />
                  )}
                </div>
              </div>

              {/* Tabel Ranking Top 5 */}
              <div className="glass-card rounded-[18px] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0B1F4B] font-display">
                    Top 5 Capaian Tertinggi
                  </h4>
                  <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    Terbaik
                  </span>
                </div>

                <div className="space-y-1.5">
                  {singleCommRanking.top5.map((u, idx) => {
                    const ach = isSelectedKayu ? u.productionActualYtd : u.achievementYtd;
                    const st = getStatus(ach, !isSelectedKayu);
                    const prog = getPreviousYearProgress(
                      u.achievementVsPreviousYear,
                      !isSelectedKayu && selectedFilter !== "tembakau"
                    );

                    return (
                      <div
                        key={u.name}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/70 text-xs hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#2E7D32] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-[#0B1F4B] leading-tight">{u.name}</div>
                            <div className="text-[10px] text-[#64748B]">{u.regional}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className="font-bold text-xs tabular-nums"
                            style={{ color: isSelectedKayu ? "#0B1F4B" : st.color }}
                          >
                            {isSelectedKayu ? `${fmtDec(u.productionActualYtd)} M³` : `${st.arrow} ${fmtDec(ach)}%`}
                          </div>
                          {!isSelectedKayu && prog.hasData && (
                            <div className="text-[10px] font-semibold" style={{ color: prog.color }}>
                              {prog.text}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* BARIS 3: PERLU PERHATIAN – 5 CAPAIAN TERENDAH */}
          <section className="glass-card rounded-[18px] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] flex items-center justify-center text-[#EF6C00]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F4B] font-display">
                    Perlu Perhatian &bull; 5 Capaian Terendah
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Kebun dengan capaian di bawah target atau volume paling rendah
                  </p>
                </div>
              </div>

              {singleCommRanking.nullCount > 0 && (
                <span className="text-xs font-semibold text-[#64748B] bg-[#EEF2FA] px-2.5 py-1 rounded-lg">
                  {singleCommRanking.nullCount} kebun belum ada data
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {singleCommRanking.bottom5.map((u, idx) => {
                const ach = isSelectedKayu ? u.productionActualYtd : u.achievementYtd;
                const st = getStatus(ach, !isSelectedKayu);
                const prog = getPreviousYearProgress(
                  u.achievementVsPreviousYear,
                  !isSelectedKayu && selectedFilter !== "tembakau"
                );

                return (
                  <div
                    key={u.name}
                    className="p-3 rounded-xl border border-white/80 bg-white/70 hover:bg-white hover:border-[#EF6C00]/40 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-md bg-[#EF6C00] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-[#64748B]">{u.regional}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#0B1F4B] truncate">{u.name}</h4>
                      <div className="text-[10px] text-[#64748B]">
                        Real: <b>{formatProductionNumber(u.productionActualYtd, currentComm.unit)}</b>{" "}
                        {currentComm.unit === "M3" ? "M³" : "Ton"}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                      <div
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                        style={{
                          backgroundColor: isSelectedKayu ? "#EEF2FA" : st.bgColor,
                          color: isSelectedKayu ? "#0B1F4B" : st.textColor,
                        }}
                      >
                        {isSelectedKayu ? `${fmtDec(u.productionActualYtd)} M³` : `${st.arrow} ${fmtDec(ach)}%`}
                      </div>

                      {!isSelectedKayu && prog.hasData && (
                        <span className="text-[10px] font-bold" style={{ color: prog.color }}>
                          {prog.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BARIS 4: STRIP RINGKASAN BAWAH */}
          <section
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            style={{ gridAutoRows: "1fr" }}
          >
            {/* Kartu CATATAN (Insight Otomatis) */}
            <div className="md:col-span-2 bg-[#FFF8E1]/90 rounded-[18px] p-4 sm:p-5 border border-[#FFE082] shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F9A825] text-white flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#B78103] mb-1 font-display">
                  Catatan Insight Operasional
                </h4>
                <p className="text-xs font-medium text-[#795548] leading-relaxed">
                  {autoNote}
                </p>
              </div>
            </div>

            {/* Kartu Regional Terbanyak */}
            <div className="bg-[#E8F5E9]/90 rounded-[18px] p-4 sm:p-5 border border-[#C8E6C9] shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E7D32]">
                Regional Aktif
              </span>
              <div className="text-[26px] font-bold text-[#1B5E20] tabular-nums font-display">
                {currentComm.regionals?.length || 0}
              </div>
              <div className="text-[11px] text-[#2E7D32] font-semibold">
                Total {currentComm.units?.length || 0} Unit Kebun Berproduksi
              </div>
            </div>

            {/* Kartu Total Navy 900 */}
            <div className="bg-[#0B1F4B] text-white rounded-[18px] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5B93E]">
                Total PTPN I (1 Jan s.d HI)
              </span>
              <div className="text-[24px] font-bold text-white tabular-nums font-display">
                {formatProductionNumber(
                  currentComm.grandTotal?.productionActualYtd ?? null,
                  currentComm.unit
                )}{" "}
                <span className="text-xs font-bold text-white/70">
                  {isSelectedKayu ? "M³" : "Ton"}
                </span>
              </div>
              <div className="text-[11px] text-white/80 font-medium">
                {!isSelectedKayu
                  ? `Capaian: ${fmtDec(currentComm.grandTotal?.achievementYtd ?? null)}% thd RKAP`
                  : "Produksi kayu terakumulasi"}
              </div>
            </div>
          </section>
        </motion.div>
      )}
    </motion.div>
  );
};
