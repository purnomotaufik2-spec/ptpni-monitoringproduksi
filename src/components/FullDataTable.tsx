/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Commodity, Row, PeriodType } from "../types";
import {
  formatRawNumber,
  formatAreaNumber,
  getStatus,
  getPreviousYearProgress,
} from "../utils/formatters";

interface FullDataTableProps {
  commodity: Commodity;
  period?: PeriodType;
}

export const FullDataTable: React.FC<FullDataTableProps> = ({ commodity, period }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegional, setSelectedRegional] = useState<string>("all");
  const [unitMode, setUnitMode] = useState<"KG" | "Ton">("Ton");

  // State untuk collapsible group regional
  const [collapsedRegionals, setCollapsedRegionals] = useState<Record<string, boolean>>({});

  const toggleCollapse = (regName: string) => {
    setCollapsedRegionals((prev) => ({
      ...prev,
      [regName]: !prev[regName],
    }));
  };

  const isKayu = commodity.key === "kayu";
  const isTembakau = commodity.key === "tembakau";
  const showVsTl = !period || period === "kumulatif";

  // Kumpulan nama regional unik
  const regionalOptions = useMemo(() => {
    const set = new Set<string>();
    (commodity.regionals || []).forEach((r) => set.add(r.name));
    (commodity.units || []).forEach((u) => {
      if (u.regional) set.add(u.regional);
    });
    return Array.from(set).sort();
  }, [commodity]);

  // Helper konversi nilai KG/Ton
  const fmtProd = (val: number | null): string => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    if (isKayu) return formatRawNumber(val, 2);
    if (unitMode === "Ton") {
      return formatRawNumber(val / 1000, 2);
    }
    return formatRawNumber(val, 2);
  };

  const fmtProtas = (val: number | null): string => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return formatRawNumber(val, 2);
  };

  const fmtPct = (val: number | null): string => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return `${formatRawNumber(val, 2)}%`;
  };

  // 9 spesies kayu baku
  const woodSpeciesKeys = [
    { key: "sengon", label: "Sengon" },
    { key: "jabon", label: "Jabon" },
    { key: "balsa", label: "Balsa" },
    { key: "gmelina", label: "Gmelina" },
    { key: "mahoni", label: "Mahoni" },
    { key: "mindi", label: "Mindi" },
    { key: "jati", label: "Jati" },
    { key: "suren", label: "Suren" },
    { key: "lainnya", label: "Lainnya" },
  ];

  // Helper nilai spesies kayu
  const getSpeciesVal = (row: Row, spKey: string, field: "today" | "toDate" | "ytd") => {
    if (!row.species) return null;
    const found = row.species.find((s) => s.key === spKey || s.label.toLowerCase() === spKey.toLowerCase());
    return found ? found[field] : null;
  };

  // Kelompokkan units per regional
  const groupedData = useMemo(() => {
    const groups: {
      regionalName: string;
      regionalRow: Row | null;
      units: Row[];
    }[] = [];

    const activeRegionals = selectedRegional === "all" ? regionalOptions : [selectedRegional];

    activeRegionals.forEach((regName) => {
      const regRow = (commodity.regionals || []).find(
        (r) => r.name.trim().toLowerCase() === regName.trim().toLowerCase()
      ) || null;

      const unitsInReg = (commodity.units || []).filter((u) => {
        const matchReg = u.regional?.trim().toLowerCase() === regName.trim().toLowerCase();
        const matchSearch =
          searchTerm === "" ||
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          regName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchReg && matchSearch;
      });

      if (unitsInReg.length > 0 || searchTerm === "") {
        groups.push({
          regionalName: regName,
          regionalRow: regRow,
          units: unitsInReg,
        });
      }
    });

    return groups;
  }, [commodity, regionalOptions, selectedRegional, searchTerm]);

  return (
    <div className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] overflow-hidden">
      {/* Bar Atas: Pencarian, Filter Regional & Toggle Satuan */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Input Pencarian */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kebun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Filter Regional Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={selectedRegional}
              onChange={(e) => setSelectedRegional(e.target.value)}
              className="bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0B1F4B] cursor-pointer focus:outline-none"
            >
              <option value="all">Semua Regional ({regionalOptions.length})</option>
              {regionalOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info Satuan & Toggle [KG] [Ton] */}
        <div className="flex items-center gap-3">
          {!isKayu && (
            <div className="flex items-center bg-[#EEF2FA] p-0.5 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setUnitMode("KG")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === "KG" ? "bg-[#0B1F4B] text-white shadow-2xs" : "text-[#64748B] hover:text-[#0B1F4B]"
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setUnitMode("Ton")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  unitMode === "Ton" ? "bg-[#0B1F4B] text-white shadow-2xs" : "text-[#64748B] hover:text-[#0B1F4B]"
                }`}
              >
                Ton
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Kontainer Tabel dengan Sticky Header & Sticky Kolom Unit */}
      <div className="overflow-x-auto custom-scrollbar max-h-[640px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* HEADER 2 TINGKAT BERLATAR NAVY 900 */}
          {!isKayu ? (
            <thead className="bg-[#0B1F4B] text-white text-[11px] font-semibold sticky top-0 z-20 shadow-xs">
              {/* TINGKAT 1 */}
              <tr className="divide-x divide-white/10 border-b border-white/10">
                <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap sticky left-0 z-30 bg-[#0B1F4B] shadow-[2px_0_5px_rgba(0,0,0,0.1)] min-w-[220px]">
                  UNIT / REGIONAL
                </th>
                <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap text-right min-w-[100px]">
                  LUAS TM (HA)
                </th>

                {/* HARI INI */}
                <th colSpan={3} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#16306B]">
                  HARI INI
                </th>

                {/* S.D HARI INI (BULAN) */}
                <th colSpan={4} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#0B1F4B]">
                  S.D HARI INI (BULAN)
                </th>

                {/* 1 JAN S.D HARI INI */}
                <th colSpan={3} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#16306B]">
                  1 JAN S.D HARI INI
                </th>

                {/* PRODUKTIVITAS (KG/HA) */}
                <th colSpan={!isTembakau ? (showVsTl ? 4 : 2) : 2} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#0B1F4B]">
                  PRODUKTIVITAS (KG/HA)
                </th>

                {/* TAHUNAN */}
                <th colSpan={2} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#16306B]">
                  TARGET TAHUNAN
                </th>
              </tr>

              {/* TINGKAT 2 (SUB-KOLOM) */}
              <tr className="divide-x divide-white/10 bg-[#16306B] text-[10px]">
                {/* HARI INI */}
                <th className="py-1.5 px-2 text-right min-w-[90px]">RKAP ({unitMode})</th>
                <th className="py-1.5 px-2 text-right min-w-[90px]">Realisasi</th>
                <th className="py-1.5 px-2 text-right min-w-[80px]">% Capaian</th>

                {/* S.D HARI INI */}
                <th className="py-1.5 px-2 text-right min-w-[95px]">RKAP ({unitMode})</th>
                <th className="py-1.5 px-2 text-right min-w-[95px]">Realisasi</th>
                <th className="py-1.5 px-2 text-right min-w-[80px]">Protas</th>
                <th className="py-1.5 px-2 text-right min-w-[80px]">% Capaian</th>

                {/* 1 JAN S.D HARI INI */}
                <th className="py-1.5 px-2 text-right min-w-[95px]">RKAP ({unitMode})</th>
                <th className="py-1.5 px-2 text-right min-w-[95px]">Realisasi</th>
                <th className="py-1.5 px-2 text-right min-w-[85px]">% Capaian</th>

                {/* PRODUKTIVITAS */}
                <th className="py-1.5 px-2 text-right min-w-[75px]">RKAP</th>
                <th className="py-1.5 px-2 text-right min-w-[75px]">Real</th>
                {!isTembakau && showVsTl && (
                  <>
                    <th className="py-1.5 px-2 text-right min-w-[80px]">Tahun Lalu</th>
                    <th className="py-1.5 px-2 text-right min-w-[85px]">% vs TL</th>
                  </>
                )}

                {/* TAHUNAN */}
                <th className="py-1.5 px-2 text-right min-w-[95px]">% Setahun</th>
                <th className="py-1.5 px-2 text-right min-w-[100px]">RKAP Tahun Ini</th>
              </tr>
            </thead>
          ) : (
            /* HEADER 2 TINGKAT KHUSUS KAYU */
            <thead className="bg-[#0B1F4B] text-white text-[11px] font-semibold sticky top-0 z-20 shadow-xs">
              <tr className="divide-x divide-white/10 border-b border-white/10">
                <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap sticky left-0 z-30 bg-[#0B1F4B] min-w-[220px]">
                  UNIT / REGIONAL
                </th>
                <th rowSpan={2} className="py-2.5 px-3 whitespace-nowrap text-right min-w-[100px]">
                  LUAS TP (HA)
                </th>

                {woodSpeciesKeys.map((sp) => (
                  <th key={sp.key} colSpan={3} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#16306B]">
                    {sp.label}
                  </th>
                ))}

                {/* JUMLAH LEBIH GELAP */}
                <th colSpan={3} className="py-1.5 px-2 text-center uppercase tracking-wider bg-[#071330]">
                  JUMLAH (M³)
                </th>
              </tr>

              <tr className="divide-x divide-white/10 bg-[#16306B] text-[10px]">
                {woodSpeciesKeys.map((sp) => (
                  <React.Fragment key={sp.key}>
                    <th className="py-1 px-1.5 text-right min-w-[65px]">H.INI</th>
                    <th className="py-1 px-1.5 text-right min-w-[65px]">S.D HI</th>
                    <th className="py-1 px-1.5 text-right min-w-[65px]">S.D BI</th>
                  </React.Fragment>
                ))}

                <th className="py-1 px-2 text-right min-w-[75px] bg-[#071330]">H.INI</th>
                <th className="py-1 px-2 text-right min-w-[75px] bg-[#071330]">S.D HI</th>
                <th className="py-1 px-2 text-right min-w-[75px] bg-[#071330]">S.D BI</th>
              </tr>
            </thead>
          )}

          {/* BODY TABEL: Group Regional Collapsible -> Units -> Subtotal -> Grand Total */}
          <tbody className="divide-y divide-[#E2E8F0]">
            {groupedData.length === 0 ? (
              <tr>
                <td colSpan={25} className="py-8 text-center text-[#94A3B8] italic">
                  Tidak ada data yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              groupedData.map((group) => {
                const isCollapsed = Boolean(collapsedRegionals[group.regionalName]);

                return (
                  <React.Fragment key={group.regionalName}>
                    {/* BARIS JUDUL GRUP REGIONAL COLLAPSIBLE */}
                    <tr
                      onClick={() => toggleCollapse(group.regionalName)}
                      className="bg-[#EEF2FA] hover:bg-slate-200 cursor-pointer font-extrabold text-[#0B1F4B] border-y border-slate-300 transition-colors select-none"
                    >
                      <td colSpan={25} className="py-2.5 px-3 sticky left-0 z-10 bg-[#EEF2FA]">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-[#0B1F4B] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#0B1F4B] shrink-0" />
                          )}
                          <span className="text-xs uppercase tracking-wider text-[#0B1F4B]">
                            {group.regionalName} ({group.units.length} Kebun)
                          </span>
                          <span className="text-[10px] text-[#64748B] font-normal">
                            {isCollapsed ? "(Klik untuk membuka)" : "(Klik untuk melipat)"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* KEBUN-KEBUN DALAM REGIONAL */}
                    {!isCollapsed &&
                      group.units.map((unitRow, idx) => {
                        const stToday = getStatus(unitRow.achievementToday, commodity.hasRkap);
                        const stToDate = getStatus(unitRow.achievementToDate, commodity.hasRkap);
                        const stYtd = getStatus(unitRow.achievementYtd, commodity.hasRkap);
                        const progVsTl = getPreviousYearProgress(unitRow.achievementVsPreviousYear, !isKayu && !isTembakau);

                        return (
                          <tr
                            key={`${unitRow.name}-${idx}`}
                            className="h-[44px] hover:bg-[#F3F5F9]/80 transition-colors divide-x divide-slate-100 text-xs"
                          >
                            {/* Kolom Nama Sticky */}
                            <td className="py-2 px-3 font-semibold text-[#0F172A] whitespace-nowrap sticky left-0 z-10 bg-white hover:bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.04)] pl-6">
                              <span className="text-[10px] text-[#94A3B8] mr-2 font-mono">{idx + 1}.</span>
                              {unitRow.name}
                            </td>

                            {!isKayu ? (
                              <>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">{formatAreaNumber(unitRow.areaHa)}</td>

                                {/* Hari Ini */}
                                <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProd(unitRow.rkapToday)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0F172A]">{fmtProd(unitRow.actualToday)}</td>
                                <td className="py-2 px-2 text-right">
                                  {commodity.hasRkap ? (
                                    <span
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums"
                                      style={{ backgroundColor: stToday.bgColor, color: stToday.textColor }}
                                    >
                                      {stToday.formatted}
                                    </span>
                                  ) : "—"}
                                </td>

                                {/* S.d Hari Ini */}
                                <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProd(unitRow.rkapToDate)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0F172A]">{fmtProd(unitRow.actualToDate)}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-700">{fmtProtas(unitRow.protas)}</td>
                                <td className="py-2 px-2 text-right">
                                  {commodity.hasRkap ? (
                                    <span
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums"
                                      style={{ backgroundColor: stToDate.bgColor, color: stToDate.textColor }}
                                    >
                                      {stToDate.formatted}
                                    </span>
                                  ) : "—"}
                                </td>

                                {/* 1 Jan s.d Hari Ini */}
                                <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProd(unitRow.productionRkapYtd)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0F172A]">{fmtProd(unitRow.productionActualYtd)}</td>
                                <td className="py-2 px-2 text-right">
                                  {commodity.hasRkap ? (
                                    <span
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums"
                                      style={{ backgroundColor: stYtd.bgColor, color: stYtd.textColor }}
                                    >
                                      {stYtd.formatted}
                                    </span>
                                  ) : "—"}
                                </td>

                                {/* Produktivitas */}
                                <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProtas(unitRow.productivityRkap)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0B1F4B]">{fmtProtas(unitRow.productivityActual)}</td>
                                {!isTembakau && showVsTl && (
                                  <>
                                    <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProtas(unitRow.previousYearActual)}</td>
                                    <td className="py-2 px-2 text-right">
                                      {progVsTl.hasData ? (
                                        <span className="font-bold tabular-nums text-[10px]" style={{ color: progVsTl.color }}>
                                          {progVsTl.arrow} {fmtPct(unitRow.achievementVsPreviousYear)}
                                        </span>
                                      ) : "—"}
                                    </td>
                                  </>
                                )}

                                {/* Target Tahunan */}
                                <td className="py-2 px-2 text-right font-mono text-slate-700">{fmtPct(unitRow.achievementAnnual)}</td>
                                <td className="py-2 px-2 text-right font-mono text-[#64748B]">{fmtProd(unitRow.annualRkap)}</td>
                              </>
                            ) : (
                              /* Sel untuk Kayu */
                              <>
                                <td className="py-2 px-3 text-right font-mono text-slate-700">{formatAreaNumber(unitRow.areaHa)}</td>
                                {woodSpeciesKeys.map((sp) => (
                                  <React.Fragment key={sp.key}>
                                    <td className="py-1 px-1.5 text-right font-mono text-slate-600">{fmtProd(getSpeciesVal(unitRow, sp.key, "today"))}</td>
                                    <td className="py-1 px-1.5 text-right font-mono text-slate-600">{fmtProd(getSpeciesVal(unitRow, sp.key, "toDate"))}</td>
                                    <td className="py-1 px-1.5 text-right font-mono font-bold text-[#0F172A]">{fmtProd(getSpeciesVal(unitRow, sp.key, "ytd"))}</td>
                                  </React.Fragment>
                                ))}
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0B1F4B] bg-[#EEF2FA]/50">{fmtProd(unitRow.actualToday)}</td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-[#0B1F4B] bg-[#EEF2FA]/50">{fmtProd(unitRow.actualToDate)}</td>
                                <td className="py-2 px-2 text-right font-mono font-black text-[#0B1F4B] bg-[#EEF2FA]">{fmtProd(unitRow.productionActualYtd)}</td>
                              </>
                            )}
                          </tr>
                        );
                      })}

                    {/* BARIS SUBTOTAL REGIONAL (Latar Navy 50 #EEF2FA, Tebal) */}
                    {group.regionalRow && (
                      <tr className="bg-[#EEF2FA] font-black text-[#0B1F4B] border-t-2 border-slate-300 divide-x divide-slate-200 h-[44px] text-xs">
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-[#EEF2FA] shadow-[2px_0_5px_rgba(0,0,0,0.06)] pl-6">
                          TOTAL {group.regionalName}
                        </td>

                        {!isKayu ? (
                          <>
                            <td className="py-2 px-3 text-right font-mono">{formatAreaNumber(group.regionalRow.areaHa)}</td>

                            {/* Hari Ini */}
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.rkapToday)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.actualToday)}</td>
                            <td className="py-2 px-2 text-right">
                              {commodity.hasRkap ? (
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums"
                                  style={{
                                    backgroundColor: getStatus(group.regionalRow.achievementToday, commodity.hasRkap).bgColor,
                                    color: getStatus(group.regionalRow.achievementToday, commodity.hasRkap).textColor,
                                  }}
                                >
                                  {getStatus(group.regionalRow.achievementToday, commodity.hasRkap).formatted}
                                </span>
                              ) : "—"}
                            </td>

                            {/* S.d Hari Ini */}
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.rkapToDate)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.actualToDate)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtProtas(group.regionalRow.protas)}</td>
                            <td className="py-2 px-2 text-right">
                              {commodity.hasRkap ? (
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums"
                                  style={{
                                    backgroundColor: getStatus(group.regionalRow.achievementToDate, commodity.hasRkap).bgColor,
                                    color: getStatus(group.regionalRow.achievementToDate, commodity.hasRkap).textColor,
                                  }}
                                >
                                  {getStatus(group.regionalRow.achievementToDate, commodity.hasRkap).formatted}
                                </span>
                              ) : "—"}
                            </td>

                            {/* 1 Jan s.d Hari Ini */}
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.productionRkapYtd)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.productionActualYtd)}</td>
                            <td className="py-2 px-2 text-right">
                              {commodity.hasRkap ? (
                                <span
                                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums"
                                  style={{
                                    backgroundColor: getStatus(group.regionalRow.achievementYtd, commodity.hasRkap).bgColor,
                                    color: getStatus(group.regionalRow.achievementYtd, commodity.hasRkap).textColor,
                                  }}
                                >
                                  {getStatus(group.regionalRow.achievementYtd, commodity.hasRkap).formatted}
                                </span>
                              ) : "—"}
                            </td>

                            {/* Produktivitas */}
                            <td className="py-2 px-2 text-right font-mono">{fmtProtas(group.regionalRow.productivityRkap)}</td>
                            <td className="py-2 px-2 text-right font-mono text-[#0B1F4B]">{fmtProtas(group.regionalRow.productivityActual)}</td>
                            {!isTembakau && showVsTl && (
                              <>
                                <td className="py-2 px-2 text-right font-mono">{fmtProtas(group.regionalRow.previousYearActual)}</td>
                                <td className="py-2 px-2 text-right">
                                  {getPreviousYearProgress(group.regionalRow.achievementVsPreviousYear, !isKayu && !isTembakau).hasData ? (
                                    <span
                                      className="font-bold tabular-nums text-[10px]"
                                      style={{
                                        color: getPreviousYearProgress(group.regionalRow.achievementVsPreviousYear, !isKayu && !isTembakau).color,
                                      }}
                                    >
                                      {getPreviousYearProgress(group.regionalRow.achievementVsPreviousYear, !isKayu && !isTembakau).arrow}{" "}
                                      {fmtPct(group.regionalRow.achievementVsPreviousYear)}
                                    </span>
                                  ) : "—"}
                                </td>
                              </>
                            )}

                            {/* Target Tahunan */}
                            <td className="py-2 px-2 text-right font-mono">{fmtPct(group.regionalRow.achievementAnnual)}</td>
                            <td className="py-2 px-2 text-right font-mono">{fmtProd(group.regionalRow.annualRkap)}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-right font-mono">{formatAreaNumber(group.regionalRow.areaHa)}</td>
                            {woodSpeciesKeys.map((sp) => (
                              <React.Fragment key={sp.key}>
                                <td className="py-1 px-1.5 text-right font-mono">{fmtProd(getSpeciesVal(group.regionalRow!, sp.key, "today"))}</td>
                                <td className="py-1 px-1.5 text-right font-mono">{fmtProd(getSpeciesVal(group.regionalRow!, sp.key, "toDate"))}</td>
                                <td className="py-1 px-1.5 text-right font-mono font-black">{fmtProd(getSpeciesVal(group.regionalRow!, sp.key, "ytd"))}</td>
                              </React.Fragment>
                            ))}
                            <td className="py-2 px-2 text-right font-mono font-black bg-[#E2E8F0]">{fmtProd(group.regionalRow.actualToday)}</td>
                            <td className="py-2 px-2 text-right font-mono font-black bg-[#E2E8F0]">{fmtProd(group.regionalRow.actualToDate)}</td>
                            <td className="py-2 px-2 text-right font-mono font-black bg-[#CBD5E1]">{fmtProd(group.regionalRow.productionActualYtd)}</td>
                          </>
                        )}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}

            {/* BARIS TOTAL PTPN I (Latar Navy 900 #0B1F4B, Teks Putih) */}
            {commodity.grandTotal && (
              <tr className="bg-[#0B1F4B] text-white font-black divide-x divide-white/15 sticky bottom-0 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.15)] h-[46px] text-xs">
                <td className="py-2.5 px-3 sticky left-0 z-30 bg-[#0B1F4B] shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                  TOTAL PTPN I
                </td>

                {!isKayu ? (
                  <>
                    <td className="py-2 px-3 text-right font-mono text-[#F5B93E]">{formatAreaNumber(commodity.grandTotal.areaHa)}</td>

                    {/* Hari Ini */}
                    <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProd(commodity.grandTotal.rkapToday)}</td>
                    <td className="py-2 px-2 text-right font-mono text-white">{fmtProd(commodity.grandTotal.actualToday)}</td>
                    <td className="py-2 px-2 text-right">
                      {commodity.hasRkap ? (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums"
                          style={{
                            backgroundColor: getStatus(commodity.grandTotal.achievementToday, commodity.hasRkap).bgColor,
                            color: getStatus(commodity.grandTotal.achievementToday, commodity.hasRkap).textColor,
                          }}
                        >
                          {getStatus(commodity.grandTotal.achievementToday, commodity.hasRkap).formatted}
                        </span>
                      ) : "—"}
                    </td>

                    {/* S.d Hari Ini */}
                    <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProd(commodity.grandTotal.rkapToDate)}</td>
                    <td className="py-2 px-2 text-right font-mono text-white">{fmtProd(commodity.grandTotal.actualToDate)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[#F5B93E]">{fmtProtas(commodity.grandTotal.protas)}</td>
                    <td className="py-2 px-2 text-right">
                      {commodity.hasRkap ? (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black tabular-nums"
                          style={{
                            backgroundColor: getStatus(commodity.grandTotal.achievementToDate, commodity.hasRkap).bgColor,
                            color: getStatus(commodity.grandTotal.achievementToDate, commodity.hasRkap).textColor,
                          }}
                        >
                          {getStatus(commodity.grandTotal.achievementToDate, commodity.hasRkap).formatted}
                        </span>
                      ) : "—"}
                    </td>

                    {/* 1 Jan s.d Hari Ini */}
                    <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProd(commodity.grandTotal.productionRkapYtd)}</td>
                    <td className="py-2 px-2 text-right font-mono text-white text-sm">{fmtProd(commodity.grandTotal.productionActualYtd)}</td>
                    <td className="py-2 px-2 text-right">
                      {commodity.hasRkap ? (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[11px] font-black tabular-nums"
                          style={{
                            backgroundColor: getStatus(commodity.grandTotal.achievementYtd, commodity.hasRkap).bgColor,
                            color: getStatus(commodity.grandTotal.achievementYtd, commodity.hasRkap).textColor,
                          }}
                        >
                          {getStatus(commodity.grandTotal.achievementYtd, commodity.hasRkap).formatted}
                        </span>
                      ) : "—"}
                    </td>

                    {/* Produktivitas */}
                    <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProtas(commodity.grandTotal.productivityRkap)}</td>
                    <td className="py-2 px-2 text-right font-mono text-[#F5B93E] text-sm">{fmtProtas(commodity.grandTotal.productivityActual)}</td>
                    {!isTembakau && showVsTl && (
                      <>
                        <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProtas(commodity.grandTotal.previousYearActual)}</td>
                        <td className="py-2 px-2 text-right">
                          {getPreviousYearProgress(commodity.grandTotal.achievementVsPreviousYear, !isKayu && !isTembakau).hasData ? (
                            <span
                              className="font-black tabular-nums text-[11px]"
                              style={{
                                color: getPreviousYearProgress(commodity.grandTotal.achievementVsPreviousYear, !isKayu && !isTembakau).color,
                              }}
                            >
                              {getPreviousYearProgress(commodity.grandTotal.achievementVsPreviousYear, !isKayu && !isTembakau).arrow}{" "}
                              {fmtPct(commodity.grandTotal.achievementVsPreviousYear)}
                            </span>
                          ) : "—"}
                        </td>
                      </>
                    )}

                    {/* Target Tahunan */}
                    <td className="py-2 px-2 text-right font-mono text-[#F5B93E]">{fmtPct(commodity.grandTotal.achievementAnnual)}</td>
                    <td className="py-2 px-2 text-right font-mono text-white/80">{fmtProd(commodity.grandTotal.annualRkap)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-3 text-right font-mono text-[#F5B93E]">{formatAreaNumber(commodity.grandTotal.areaHa)}</td>
                    {woodSpeciesKeys.map((sp) => (
                      <React.Fragment key={sp.key}>
                        <td className="py-1 px-1.5 text-right font-mono text-white/80">{fmtProd(getSpeciesVal(commodity.grandTotal!, sp.key, "today"))}</td>
                        <td className="py-1 px-1.5 text-right font-mono text-white/80">{fmtProd(getSpeciesVal(commodity.grandTotal!, sp.key, "toDate"))}</td>
                        <td className="py-1 px-1.5 text-right font-mono font-black text-white">{fmtProd(getSpeciesVal(commodity.grandTotal!, sp.key, "ytd"))}</td>
                      </React.Fragment>
                    ))}
                    <td className="py-2 px-2 text-right font-mono font-bold text-white bg-[#16306B]">{fmtProd(commodity.grandTotal.actualToday)}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-white bg-[#16306B]">{fmtProd(commodity.grandTotal.actualToDate)}</td>
                    <td className="py-2 px-2 text-right font-mono font-black text-[#F5B93E] text-sm bg-[#071330]">{fmtProd(commodity.grandTotal.productionActualYtd)}</td>
                  </>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
