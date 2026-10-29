/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { Download, Filter, BarChart3, TrendingUp, Info } from "lucide-react";
import { DashboardResponse, PeriodType, CommodityKey, Row } from "../../types";
import {
  COMMODITIES_METADATA,
  ALL_COMMODITY_KEYS,
  formatProductionNumber,
  formatCompactNumber,
  formatRawNumber,
  getStatus,
  getPeriodValues,
} from "../../utils/formatters";
import { CommodityIcon } from "../CommodityIcons";

interface GrafikTabProps {
  data: DashboardResponse;
  period: PeriodType;
}

// Design Token Gradients
const REALISASI_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#43A047" },
    { offset: 1, color: "#2E7D32" },
  ],
};

const RKAP_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#42A5F5" },
    { offset: 1, color: "#1565C0" },
  ],
};

const PROTAS_TL_COLOR = "#94A3B8";

export const GrafikTab: React.FC<GrafikTabProps> = ({ data, period }) => {
  const [activeKey, setActiveKey] = useState<CommodityKey>("karet");
  const [selectedRegionalFilter, setSelectedRegionalFilter] = useState<string>("all");

  const comm = data.commodities?.[activeKey];
  const meta = COMMODITIES_METADATA[activeKey];
  const isKayu = activeKey === "kayu";
  const isTembakau = activeKey === "tembakau";
  const unitLabel = isKayu ? "M³" : "Ton";
  const showVsTl = period === "kumulatif";

  // Regional options
  const regionalOptions = useMemo(() => {
    if (!comm?.regionals) return [];
    return comm.regionals.map((r) => r.name);
  }, [comm]);

  // Data regional terfilter
  const regionalsData = useMemo(() => {
    if (!comm?.regionals) return [];
    if (selectedRegionalFilter === "all") return comm.regionals;
    return comm.regionals.filter((r) => r.name === selectedRegionalFilter);
  }, [comm, selectedRegionalFilter]);

  // Data kebun terfilter
  const unitsData = useMemo(() => {
    if (!comm?.units) return [];
    if (selectedRegionalFilter === "all") return comm.units;
    return comm.units.filter((u) => u.regional === selectedRegionalFilter);
  }, [comm, selectedRegionalFilter]);

  const fmtDec = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  const getPeriodTitle = () => {
    if (period === "hari_ini") return "Hari Ini";
    if (period === "bulan") return "Bulan s/d HI";
    return "1 Jan s/d HI";
  };

  // Helper download chart
  const downloadChart = (chartRef: React.RefObject<any>, fileName: string) => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      const url = echartsInstance.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}_${activeKey}_${period}.png`;
      a.click();
    }
  };

  const refChart1 = useRef<any>(null);
  const refChart2 = useRef<any>(null);
  const refChart3 = useRef<any>(null);
  const refChart4 = useRef<any>(null);
  const refChart5 = useRef<any>(null);
  const refChart6 = useRef<any>(null);
  const refChart7 = useRef<any>(null);

  // 1. Chart 1: Realisasi vs RKAP per Regional (Grouped Bar Hijau vs Biru)
  // Untuk Kayu: Donut Komposisi Jenis Kayu
  const optionChart1 = useMemo(() => {
    if (isKayu) {
      const grandSpecies = comm?.grandTotal?.species || [];
      const speciesList = grandSpecies
        .map((s) => {
          const val = period === "hari_ini" ? s.today : period === "bulan" ? s.toDate : s.ytd;
          return { name: s.label, value: val || 0 };
        })
        .filter((s) => s.value > 0);

      const totalVal = speciesList.reduce((acc, curr) => acc + curr.value, 0);

      return {
        textStyle: { fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "item",
          backgroundColor: "#0B1F4B",
          borderColor: "#16306B",
          textStyle: { color: "#fff", fontSize: 12 },
          formatter: (p: any) => `${p.name}: <b>${fmtDec(p.value)} M³</b> (${p.percent}%)`,
        },
        legend: { top: "bottom", textStyle: { fontSize: 11, color: "#64748B" } },
        graphic: [
          {
            type: "text",
            left: "center",
            top: "43%",
            style: {
              text: `TOTAL\n${formatCompactNumber(totalVal)}\nM³`,
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
            center: ["50%", "47%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: "#FFFFFF", borderWidth: 2 },
            label: { show: false },
            data: speciesList,
          },
        ],
      };
    }

    const categories = regionalsData.map((r) => r.name);
    const realVals = regionalsData.map((r) => {
      const v = getPeriodValues(r, period).actual;
      return v !== null ? v / 1000 : 0;
    });
    const rkapVals = regionalsData.map((r) => {
      const v = getPeriodValues(r, period).rkap;
      return v !== null ? v / 1000 : 0;
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
            str += `<div class="flex items-center justify-between gap-4"><span>${p.marker} ${p.seriesName}</span><b>${fmtDec(p.value)} Ton</b></div>`;
          });
          return str;
        },
      },
      legend: {
        top: 0,
        left: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 13, fontWeight: "600", color: "#0B1F4B" },
      },
      grid: { top: 40, left: "3%", right: "4%", bottom: 25, containLabel: true },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, fontWeight: "bold", color: "#0B1F4B" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: {
          formatter: (v: number) => formatCompactNumber(v),
          fontSize: 11,
          color: "#64748B",
        },
      },
      series: [
        {
          name: "Realisasi",
          type: "bar",
          data: realVals,
          barMaxWidth: 26,
          itemStyle: {
            color: REALISASI_GRADIENT,
            borderRadius: [6, 6, 0, 0],
            shadowBlur: 6,
            shadowColor: "rgba(11,31,75,0.12)",
          },
          label: {
            show: true,
            position: "top",
            formatter: (p: any) => formatCompactNumber(p.value),
            fontSize: 10,
            fontWeight: "bold",
            color: "#2E7D32",
          },
        },
        {
          name: "RKAP",
          type: "bar",
          data: rkapVals,
          barMaxWidth: 26,
          itemStyle: {
            color: RKAP_GRADIENT,
            borderRadius: [6, 6, 0, 0],
            shadowBlur: 6,
            shadowColor: "rgba(11,31,75,0.12)",
          },
          label: {
            show: true,
            position: "top",
            formatter: (p: any) => formatCompactNumber(p.value),
            fontSize: 10,
            fontWeight: "bold",
            color: "#1565C0",
          },
        },
      ],
    };
  }, [comm, regionalsData, isKayu, period]);

  // 2. Chart 2: Indeks Capaian thd RKAP per Regional (Horizontal Bar + Warna Status + Garis Target 100% + MarkArea)
  // Untuk Kayu: Stacked Bar Jenis Kayu per Regional
  const optionChart2 = useMemo(() => {
    if (isKayu) {
      const categories = regionalsData.map((r) => r.name);
      const woodSpeciesNames = ["Sengon", "Jabon", "Balsa", "Gmelina", "Mahoni", "Mindi", "Jati", "Suren", "Kayu Lainnya"];
      const seriesList = woodSpeciesNames.map((spName) => ({
        name: spName,
        type: "bar",
        stack: "total",
        data: regionalsData.map((r) => {
          const found = (r.species || []).find((s) => s.label.toLowerCase() === spName.toLowerCase());
          const val = period === "hari_ini" ? found?.today : period === "bulan" ? found?.toDate : found?.ytd;
          return val || 0;
        }),
      }));

      return {
        textStyle: { fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "#0B1F4B",
          borderColor: "#16306B",
          textStyle: { color: "#FFFFFF", fontSize: 12 },
        },
        legend: { top: 0, textStyle: { fontSize: 10, color: "#64748B" } },
        grid: { top: 45, left: "3%", right: "4%", bottom: 25, containLabel: true },
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisLabel: { color: "#0B1F4B", fontWeight: "bold" },
        },
        yAxis: {
          type: "value",
          splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
          axisLabel: { formatter: (v: number) => `${formatCompactNumber(v)} M³`, color: "#64748B" },
        },
        series: seriesList,
      };
    }

    const categories = regionalsData.map((r) => r.name);
    const dataVals = regionalsData.map((r) => {
      const ach = getPeriodValues(r, period).achievement;
      const st = getStatus(ach);
      return {
        value: ach || 0,
        itemStyle: {
          color: st.color,
          borderRadius: [0, 6, 6, 0],
        },
      };
    });

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any[]) => {
          const val = p[0].value;
          const st = getStatus(val);
          return `<div class="font-bold text-amber-300 mb-1">${p[0].name}</div>
                  <div>Capaian: <b style="color:${st.color}">${st.arrow} ${fmtDec(val)}%</b> (${st.label})</div>`;
        },
      },
      grid: { top: 20, left: "3%", right: "14%", bottom: 25, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: { formatter: "{value}%", color: "#64748B" },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#0B1F4B", fontWeight: "bold" },
      },
      series: [
        {
          name: "% Capaian",
          type: "bar",
          data: dataVals,
          barMaxWidth: 24,
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
                lineStyle: { color: "#EF6C00", type: "dashed", width: 2 },
                label: { formatter: "TARGET 100%", position: "end", color: "#EF6C00", fontWeight: "bold" },
              },
            ],
          },
          markArea: {
            silent: true,
            data: [
              [
                { xAxis: 0, itemStyle: { color: "rgba(211, 47, 47, 0.06)" } },
                { xAxis: 95 },
              ],
              [
                { xAxis: 95, itemStyle: { color: "rgba(249, 168, 37, 0.06)" } },
                { xAxis: 100 },
              ],
              [
                { xAxis: 100, itemStyle: { color: "rgba(46, 125, 50, 0.06)" } },
                { xAxis: 150 },
              ],
            ],
          },
        },
      ],
    };
  }, [regionalsData, isKayu, period]);

  // 3. Chart 3: Peringkat Capaian Kebun (Horizontal Bar Semua Kebun Terurut)
  // Untuk Kayu: Bar Produksi per Kebun (M³)
  const optionChart3 = useMemo(() => {
    if (isKayu) {
      const sortedUnits = [...unitsData]
        .map((u) => ({
          name: u.name,
          val: getPeriodValues(u, period).actual,
        }))
        .filter((u) => u.val !== null && !isNaN(u.val as number))
        .sort((a, b) => (a.val as number) - (b.val as number));

      return {
        textStyle: { fontFamily: "Inter, sans-serif" },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          formatter: (p: any[]) => `${p[0].name}: <b>${fmtDec(p[0].value)} M³</b>`,
        },
        grid: { top: 15, left: "3%", right: "14%", bottom: 25, containLabel: true },
        xAxis: {
          type: "value",
          splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
          axisLabel: { formatter: (v: number) => `${formatCompactNumber(v)} M³`, color: "#64748B" },
        },
        yAxis: {
          type: "category",
          data: sortedUnits.map((u) => u.name),
          axisLabel: { fontSize: 10, color: "#0B1F4B", fontWeight: 600 },
        },
        series: [
          {
            name: "Produksi",
            type: "bar",
            data: sortedUnits.map((u) => u.val),
            barMaxWidth: 16,
            itemStyle: { color: REALISASI_GRADIENT, borderRadius: [0, 6, 6, 0] },
            label: {
              show: true,
              position: "right",
              formatter: (p: any) => `${formatCompactNumber(p.value)} M³`,
              fontSize: 10,
              fontWeight: "bold",
              color: "#0B1F4B",
            },
          },
        ],
      };
    }

    const valid = unitsData
      .map((u) => ({
        name: u.name,
        regional: u.regional,
        ach: getPeriodValues(u, period).achievement,
      }))
      .filter((u) => u.ach !== null && !isNaN(u.ach as number))
      .sort((a, b) => (a.ach as number) - (b.ach as number));

    const categories = valid.map((u) => u.name);
    const dataVals = valid.map((u) => {
      const ach = u.ach as number;
      const st = getStatus(ach);
      return {
        value: ach,
        itemStyle: {
          color: st.color,
          borderRadius: [0, 5, 5, 0],
        },
      };
    });

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any[]) => {
          const val = p[0].value;
          const st = getStatus(val);
          return `<div class="font-bold text-amber-300">${p[0].name}</div>
                  <div>Capaian: <b style="color:${st.color}">${st.arrow} ${fmtDec(val)}%</b> (${st.label})</div>`;
        },
      },
      grid: { top: 15, left: "3%", right: "14%", bottom: 25, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: { formatter: "{value}%", color: "#64748B" },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisLabel: { fontSize: 10, color: "#0B1F4B", fontWeight: 600 },
      },
      series: [
        {
          name: "% Capaian",
          type: "bar",
          data: dataVals,
          barMaxWidth: 16,
          label: {
            show: true,
            position: "right",
            formatter: (p: any) => `${fmtDec(p.value)}%`,
            fontSize: 9,
            fontWeight: "bold",
            color: "#0B1F4B",
          },
          markLine: {
            symbol: "none",
            data: [
              {
                xAxis: 100,
                lineStyle: { color: "#EF6C00", type: "dashed", width: 2 },
                label: { formatter: "TARGET 100%", position: "end", color: "#EF6C00", fontWeight: "bold" },
              },
            ],
          },
        },
      ],
    };
  }, [unitsData, period, isKayu]);

  // 4. Chart 4: Progres vs Tahun Lalu per Kebun (Diverging Bar: delta = achievementVsPreviousYear - 100)
  // Hijau ke kanan (>0), Merah ke kiri (<0), Garis 0 tengah
  const optionChart4 = useMemo(() => {
    if (isKayu || isTembakau) return null;

    const valid = unitsData
      .map((u) => {
        const achVsTL = u.achievementVsPreviousYear;
        const delta = achVsTL !== null && !isNaN(achVsTL) ? achVsTL - 100 : null;
        return {
          name: u.name,
          achVsTL,
          delta,
        };
      })
      .filter((u) => u.delta !== null)
      .sort((a, b) => (a.delta as number) - (b.delta as number));

    const categories = valid.map((u) => u.name);
    const seriesData = valid.map((u) => {
      const d = u.delta as number;
      const isPositive = d >= 0;
      return {
        value: d,
        itemStyle: {
          color: isPositive ? "#2E7D32" : "#D32F2F",
          borderRadius: isPositive ? [0, 4, 4, 0] : [4, 0, 0, 4],
        },
      };
    });

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any[]) => {
          const item = valid[p[0].dataIndex];
          const d = item.delta as number;
          const sign = d > 0 ? "+" : "";
          const color = d >= 0 ? "#2E7D32" : "#D32F2F";
          return `
            <div class="font-bold text-amber-300">${item.name}</div>
            <div>Delta vs TL: <b style="color:${color}">${sign}${fmtDec(d)}%</b></div>
            <div class="text-xs text-white/70 mt-1">Real thd TL: ${fmtDec(item.achVsTL)}%</div>
          `;
        },
      },
      grid: { top: 15, left: "3%", right: "8%", bottom: 25, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: {
          formatter: (v: number) => (v > 0 ? `+${v}%` : `${v}%`),
          color: "#64748B",
          fontSize: 10,
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisLabel: { fontSize: 10, color: "#0B1F4B", fontWeight: 600 },
      },
      series: [
        {
          name: "Delta vs Tahun Lalu",
          type: "bar",
          data: seriesData,
          barMaxWidth: 16,
          markLine: {
            symbol: "none",
            data: [
              {
                xAxis: 0,
                lineStyle: { color: "#0B1F4B", type: "solid", width: 1.5 },
                label: { show: false },
              },
            ],
          },
        },
      ],
    };
  }, [unitsData, isKayu, isTembakau]);

  // 5. Chart 5: Protas Real vs RKAP vs Tahun Lalu per Regional
  const optionChart5 = useMemo(() => {
    if (isKayu) return null;

    const categories = regionalsData.map((r) => r.name);
    const realProtas = regionalsData.map((r) => r.productivityActual || 0);
    const rkapProtas = regionalsData.map((r) => r.productivityRkap || 0);
    const prevProtas = regionalsData.map((r) => r.previousYearActual || 0);

    const series: any[] = [
      {
        name: "Protas Real",
        type: "bar",
        data: realProtas,
        barMaxWidth: 20,
        itemStyle: { color: REALISASI_GRADIENT, borderRadius: [5, 5, 0, 0] },
      },
      {
        name: "Protas RKAP",
        type: "bar",
        data: rkapProtas,
        barMaxWidth: 20,
        itemStyle: { color: RKAP_GRADIENT, borderRadius: [5, 5, 0, 0] },
      },
    ];

    if (!isTembakau && showVsTl) {
      series.push({
        name: "Protas Th Lalu",
        type: "bar",
        data: prevProtas,
        barMaxWidth: 20,
        itemStyle: { color: PROTAS_TL_COLOR, borderRadius: [5, 5, 0, 0] },
      });
    }

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (params: any[]) => {
          let s = `<div class="font-bold text-amber-300 mb-1">${params[0].name}</div>`;
          params.forEach((p) => {
            s += `<div class="flex items-center justify-between gap-4"><span>${p.marker} ${p.seriesName}</span><b>${fmtDec(p.value)} KG/Ha</b></div>`;
          });
          return s;
        },
      },
      legend: {
        top: 0,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, fontWeight: "600", color: "#0B1F4B" },
      },
      grid: { top: 40, left: "3%", right: "4%", bottom: 25, containLabel: true },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisLabel: { color: "#0B1F4B", fontWeight: "bold", fontSize: 11 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { type: "dashed", color: "#E6EBF2" } },
        axisLabel: {
          formatter: (v: number) => `${formatCompactNumber(v)}`,
          color: "#64748B",
          fontSize: 10,
        },
      },
      series,
    };
  }, [regionalsData, isKayu, isTembakau, showVsTl]);

  // 6. Chart 6: Gauge Capaian 1 Jan s.d HI PTPN I
  const optionChart6 = useMemo(() => {
    if (!comm?.grandTotal?.achievementYtd && comm?.grandTotal?.achievementYtd !== 0) {
      return null;
    }
    const ach = comm.grandTotal.achievementYtd;
    const st = getStatus(ach);

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 130,
          splitNumber: 5,
          itemStyle: {
            color: st.color,
          },
          progress: {
            show: true,
            roundCap: true,
            width: 16,
          },
          pointer: {
            icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
            length: "14%",
            width: 14,
            offsetCenter: [0, "-55%"],
            itemStyle: { color: "#0B1F4B" },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 16,
              color: [
                [0.73, "#D32F2F"], // <95%
                [0.77, "#F9A825"], // 95-100%
                [1, "#2E7D32"],    // >=100%
              ],
            },
          },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { width: 2, color: "#fff" } },
          axisLabel: {
            distance: 22,
            color: "#64748B",
            fontSize: 10,
            formatter: (v: number) => `${v}%`,
          },
          title: {
            offsetCenter: [0, "-18%"],
            fontSize: 13,
            fontWeight: "bold",
            color: "#0B1F4B",
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, "15%"],
            fontSize: 26,
            fontWeight: "bolder",
            formatter: () => `${st.arrow} ${fmtDec(ach)}%`,
            color: st.color,
          },
          data: [{ value: Math.min(ach, 130), name: "Capaian PTPN I" }],
        },
      ],
    };
  }, [comm]);

  // 7. Chart 7: Kontribusi Produksi per Regional (Donut dengan total di tengah)
  const optionChart7 = useMemo(() => {
    const list = regionalsData
      .map((r) => {
        const val = getPeriodValues(r, period).actual;
        return {
          name: r.name,
          value: val !== null ? (isKayu ? val : val / 1000) : 0,
        };
      })
      .filter((r) => r.value > 0);

    const totalContribution = list.reduce((acc, curr) => acc + curr.value, 0);

    return {
      textStyle: { fontFamily: "Inter, sans-serif" },
      tooltip: {
        trigger: "item",
        backgroundColor: "#0B1F4B",
        borderColor: "#16306B",
        textStyle: { color: "#FFFFFF", fontSize: 12 },
        formatter: (p: any) => `${p.name}: <b>${fmtDec(p.value)} ${unitLabel}</b> (${p.percent}%)`,
      },
      legend: {
        top: "bottom",
        textStyle: { fontSize: 11, color: "#64748B" },
      },
      graphic: [
        {
          type: "text",
          left: "center",
          top: "43%",
          style: {
            text: `TOTAL\n${formatCompactNumber(totalContribution)}\n${unitLabel}`,
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
          center: ["50%", "47%"],
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
  }, [regionalsData, period, isKayu, unitLabel]);

  // Empty state jika data belum terisi
  const isCommodityEmpty = !comm || (comm.regionals?.length === 0 && comm.units?.length === 0);

  if (isCommodityEmpty) {
    return (
      <div className="bg-white rounded-[14px] p-8 text-center border border-[#E2E8F0] shadow-sm my-6">
        <Info className="w-10 h-10 text-[#64748B] mx-auto mb-2" />
        <h3 className="text-sm font-extrabold uppercase text-[#0B1F4B]">Data Belum Diinput</h3>
        <p className="text-xs text-[#64748B] mt-1">
          Laporan produksi komoditas {meta?.name} belum tersedia pada tanggal ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Bar Pemilih Komoditas & Filter Regional */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] block mb-2">
            Pilih Komoditas untuk Analisis Grafik:
          </span>
          <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
            {ALL_COMMODITY_KEYS.map((key) => {
              const m = COMMODITIES_METADATA[key];
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveKey(key);
                    setSelectedRegionalFilter("all");
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
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
        </div>

        {/* Filter Regional Opsional */}
        <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[#0B1F4B] font-bold">Filter Regional:</span>
            <select
              value={selectedRegionalFilter}
              onChange={(e) => setSelectedRegionalFilter(e.target.value)}
              className="bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B1F4B] cursor-pointer focus:outline-none"
            >
              <option value="all">Semua Regional ({regionalOptions.length})</option>
              {regionalOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-[#64748B]">
            Periode: <b className="text-[#0B1F4B]">{getPeriodTitle()}</b> &bull; Satuan: <b>{unitLabel}</b>
          </div>
        </div>
      </section>

      {/* Grid Grafik Responsif (Uniform Height 340px / 280px on HP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Realisasi vs RKAP per Regional */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                {isKayu ? "1. KOMPOSISI JENIS KAYU (PTPN I)" : "1. REALISASI VS RKAP PER REGIONAL"}
              </h3>
              <p className="text-[10px] text-[#64748B]">
                {getPeriodTitle()} &bull; Satuan {unitLabel} &bull; Bar Gradien Hijau vs Biru
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadChart(refChart1, "1_Realisasi_vs_RKAP")}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
              title="Unduh Grafik (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] sm:h-[340px] w-full">
            <ReactECharts ref={refChart1} option={optionChart1} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
          </div>
        </div>

        {/* 2. Indeks Capaian thd RKAP per Regional */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                {isKayu ? "2. PRODUKSI JENIS KAYU PER REGIONAL" : "2. INDEKS CAPAIAN THD RKAP PER REGIONAL"}
              </h3>
              <p className="text-[10px] text-[#64748B]">
                {isKayu ? "Stacked Volume M³" : "Warna status capaian & garis target emas 100%"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadChart(refChart2, "2_Indeks_Capaian_Regional")}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
              title="Unduh Grafik (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] sm:h-[340px] w-full">
            <ReactECharts ref={refChart2} option={optionChart2} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
          </div>
        </div>

        {/* 3. Peringkat Capaian Kebun */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                {isKayu ? "3. PERINGKAT VOLUME PRODUKSI KEBUN" : "3. PERINGKAT CAPAIAN KEBUN THD RKAP"}
              </h3>
              <p className="text-[10px] text-[#64748B]">
                {isKayu ? "Semua unit kayu terurut volume (M³)" : "Semua kebun diurutkan dari capaian terendah ke tertinggi"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadChart(refChart3, "3_Peringkat_Capaian_Kebun")}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
              title="Unduh Grafik (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] sm:h-[340px] w-full">
            <ReactECharts ref={refChart3} option={optionChart3} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
          </div>
        </div>

        {/* 4. Progres vs Tahun Lalu per Kebun (Diverging Bar) */}
        {!isKayu && !isTembakau && (
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                  4. PROGRES VS TAHUN LALU PER KEBUN
                </h3>
                <p className="text-[10px] text-[#64748B]">
                  Delta = Real thd TL - 100% (Hijau: Naik, Merah: Turun, Garis 0%)
                </p>
              </div>
              {showVsTl && optionChart4 && (
                <button
                  type="button"
                  onClick={() => downloadChart(refChart4, "4_Progres_vs_Tahun_Lalu_Kebun")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
                  title="Unduh Grafik (PNG)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {showVsTl && optionChart4 ? (
              <div className="h-[280px] sm:h-[340px] w-full transition-opacity duration-200">
                <ReactECharts ref={refChart4} option={optionChart4} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
              </div>
            ) : (
              <div className="py-12 px-4 flex items-center justify-center text-center text-xs text-[#94A3B8] italic font-medium bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1] transition-opacity duration-200">
                Perbandingan tahun lalu tersedia pada periode 1 Jan s/d HI
              </div>
            )}
          </div>
        )}

        {/* 5. Produktivitas (Protas) per Regional */}
        {!isKayu && optionChart5 && (
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                  5. PRODUKTIVITAS (PROTAS KG/HA) PER REGIONAL
                </h3>
                <p className="text-[10px] text-[#64748B]">
                  Real vs RKAP {isTembakau || !showVsTl ? "" : "vs Tahun Lalu"} &bull; Satuan KG/Ha
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadChart(refChart5, "5_Protas_Regional")}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
                title="Unduh Grafik (PNG)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-[280px] sm:h-[340px] w-full">
              <ReactECharts ref={refChart5} option={optionChart5} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
            </div>
          </div>
        )}

        {/* 6. Gauge Capaian 1 Jan s.d HI PTPN I */}
        {!isKayu && optionChart6 && (
          <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                  6. GAUGE CAPAIAN 1 JAN S.D HI PTPN I
                </h3>
                <p className="text-[10px] text-[#64748B]">
                  Pita merah (&lt;95%), kuning (95-100%), hijau (&ge;100%)
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadChart(refChart6, "6_Gauge_Capaian_PTPN_I")}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
                title="Unduh Grafik (PNG)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-[280px] sm:h-[340px] w-full">
              <ReactECharts ref={refChart6} option={optionChart6} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
            </div>
          </div>
        )}

        {/* 7. Kontribusi Produksi per Regional */}
        <div className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                7. KONTRIBUSI PRODUKSI PER REGIONAL (%)
              </h3>
              <p className="text-[10px] text-[#64748B]">
                Proporsi kontribusi {unitLabel} regional pada {getPeriodTitle()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadChart(refChart7, "7_Kontribusi_Regional")}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0B1F4B] cursor-pointer transition-colors"
              title="Unduh Grafik (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] sm:h-[340px] w-full">
            <ReactECharts ref={refChart7} option={optionChart7} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} />
          </div>
        </div>
      </div>
    </div>
  );
};
