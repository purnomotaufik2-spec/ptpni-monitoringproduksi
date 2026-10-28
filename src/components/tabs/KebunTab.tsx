/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Trees,
} from "lucide-react";
import { DashboardResponse, PeriodType, CommodityKey, Row } from "../../types";
import {
  COMMODITIES_METADATA,
  ALL_COMMODITY_KEYS,
  formatProductionNumber,
  formatRawNumber,
  getStatus,
  getPreviousYearProgress,
} from "../../utils/formatters";
import { CommodityIcon } from "../CommodityIcons";

interface KebunTabProps {
  data: DashboardResponse;
  period: PeriodType;
  filterCommodityKey?: CommodityKey | null;
}

type SortType =
  | "capaian_desc"
  | "capaian_asc"
  | "prog_desc"
  | "prog_asc"
  | "realisasi_desc"
  | "protas_desc"
  | "nama_asc";

export const KebunTab: React.FC<KebunTabProps> = ({ data, filterCommodityKey }) => {
  const [selectedCommodities, setSelectedCommodities] = useState<CommodityKey[]>(
    filterCommodityKey ? [filterCommodityKey] : ALL_COMMODITY_KEYS
  );
  const [selectedRegionals, setSelectedRegionals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState<SortType>("capaian_desc");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Kumpulan seluruh nama regional dari semua komoditas
  const allRegionals = useMemo(() => {
    const set = new Set<string>();
    ALL_COMMODITY_KEYS.forEach((key) => {
      const comm = data.commodities?.[key];
      (comm?.regionals || []).forEach((r) => set.add(r.name));
      (comm?.units || []).forEach((u) => {
        if (u.regional) set.add(u.regional);
      });
    });
    return Array.from(set).sort();
  }, [data]);

  // Toggle multi-select komoditas
  const toggleCommodity = (key: CommodityKey) => {
    if (selectedCommodities.includes(key)) {
      if (selectedCommodities.length > 1) {
        setSelectedCommodities(selectedCommodities.filter((k) => k !== key));
      }
    } else {
      setSelectedCommodities([...selectedCommodities, key]);
    }
  };

  // Toggle multi-select regional
  const toggleRegional = (regName: string) => {
    if (selectedRegionals.includes(regName)) {
      setSelectedRegionals(selectedRegionals.filter((r) => r !== regName));
    } else {
      setSelectedRegionals([...selectedRegionals, regName]);
    }
  };

  // Kumpulkan semua unit kebun yang sesuai filter
  const filteredUnits = useMemo(() => {
    const list: { unit: Row; commodityKey: CommodityKey }[] = [];

    selectedCommodities.forEach((commKey) => {
      const comm = data.commodities?.[commKey];
      if (!comm?.units) return;

      comm.units.forEach((u) => {
        // Filter nama/regional lewat search
        const matchSearch =
          searchTerm === "" ||
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.regional && u.regional.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filter multi-regional
        const matchRegional =
          selectedRegionals.length === 0 ||
          (u.regional && selectedRegionals.includes(u.regional));

        if (matchSearch && matchRegional) {
          list.push({ unit: u, commodityKey: commKey });
        }
      });
    });

    // Pengurutan
    return list.sort((a, b) => {
      const uA = a.unit;
      const uB = b.unit;

      switch (sortType) {
        case "capaian_desc": {
          const achA = uA.achievementYtd ?? -999;
          const achB = uB.achievementYtd ?? -999;
          return achB - achA;
        }
        case "capaian_asc": {
          const achA = uA.achievementYtd ?? 999999;
          const achB = uB.achievementYtd ?? 999999;
          return achA - achB;
        }
        case "prog_desc": {
          const pA = uA.achievementVsPreviousYear ? uA.achievementVsPreviousYear - 100 : -9999;
          const pB = uB.achievementVsPreviousYear ? uB.achievementVsPreviousYear - 100 : -9999;
          return pB - pA;
        }
        case "prog_asc": {
          const pA = uA.achievementVsPreviousYear ? uA.achievementVsPreviousYear - 100 : 9999;
          const pB = uB.achievementVsPreviousYear ? uB.achievementVsPreviousYear - 100 : 9999;
          return pA - pB;
        }
        case "realisasi_desc": {
          const rA = uA.productionActualYtd ?? 0;
          const rB = uB.productionActualYtd ?? 0;
          return rB - rA;
        }
        case "protas_desc": {
          const pA = uA.productivityActual ?? -999;
          const pB = uB.productivityActual ?? -999;
          return pB - pA;
        }
        case "nama_asc":
        default:
          return uA.name.localeCompare(uB.name);
      }
    });
  }, [data, selectedCommodities, selectedRegionals, searchTerm, sortType]);

  const fmtDec = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Panel Filter Komoditas, Regional & Pencarian */}
      <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-4">
        {/* Multi-Pilih Chip Komoditas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
              Filter Komoditas:
            </span>
            <div className="space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCommodities(ALL_COMMODITY_KEYS)}
                className="text-[#1565C0] font-bold hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_COMMODITY_KEYS.map((key) => {
              const meta = COMMODITIES_METADATA[key];
              const isSelected = selectedCommodities.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCommodity(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    isSelected
                      ? "text-white shadow-sm ring-1 ring-black/10"
                      : "bg-[#F3F5F9] text-[#64748B] hover:bg-slate-200"
                  }`}
                  style={isSelected ? { backgroundColor: meta.color } : undefined}
                >
                  <CommodityIcon
                    commodityKey={key}
                    size={15}
                    color={isSelected ? "#FFFFFF" : meta.color}
                  />
                  <span>{meta.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multi-Pilih Chip Regional */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
              Filter Regional:
            </span>
            {selectedRegionals.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedRegionals([])}
                className="text-xs text-[#D32F2F] font-bold hover:underline cursor-pointer"
              >
                Reset Filter Regional
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allRegionals.map((r) => {
              const isSelected = selectedRegionals.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRegional(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0B1F4B] text-white shadow-xs"
                      : "bg-[#EEF2FA] text-[#0B1F4B] hover:bg-slate-200"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Baris Pencarian, Pengurutan, dan Toggle Tampilan */}
        <div className="pt-3 border-t border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Input Pencarian */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kebun atau regional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0B1F4B]"
            />
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                className="bg-[#F3F5F9] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#0B1F4B] cursor-pointer focus:outline-none"
              >
                <option value="capaian_desc">Capaian thd RKAP Tertinggi</option>
                <option value="capaian_asc">Capaian thd RKAP Terendah</option>
                <option value="prog_desc">Progres vs TL Tertinggi</option>
                <option value="prog_asc">Progres vs TL Terendah</option>
                <option value="realisasi_desc">Realisasi Terbesar</option>
                <option value="protas_desc">Protas Tertinggi</option>
                <option value="nama_asc">Nama Kebun A–Z</option>
              </select>
            </div>

            {/* Toggle Kartu / Tabel */}
            <div className="flex items-center bg-[#EEF2FA] p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "card" ? "bg-[#0B1F4B] text-white shadow-xs" : "text-[#64748B] hover:text-[#0B1F4B]"
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-[#0B1F4B] text-white shadow-xs" : "text-[#64748B] hover:text-[#0B1F4B]"
                }`}
                title="Tampilan Tabel"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Ringkasan Jumlah Temuan */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-extrabold text-[#0B1F4B]">
          {filteredUnits.length} kebun ditemukan
        </span>
        <span className="text-[#64748B]">
          Diurutkan berdasarkan:{" "}
          <b className="text-[#0B1F4B]">
            {sortType === "capaian_desc"
              ? "Capaian RKAP Tertinggi"
              : sortType === "capaian_asc"
              ? "Capaian RKAP Terendah"
              : sortType === "prog_desc"
              ? "Progres vs TL Tertinggi"
              : sortType === "prog_asc"
              ? "Progres vs TL Terendah"
              : sortType === "realisasi_desc"
              ? "Realisasi Terbesar"
              : sortType === "protas_desc"
              ? "Protas Tertinggi"
              : "Nama A–Z"}
          </b>
        </span>
      </div>

      {/* 3. Tampilan Kartu (Rigid Equal Sized Cards) */}
      {viewMode === "card" ? (
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          style={{ gridAutoRows: "1fr" }}
        >
          {filteredUnits.map(({ unit, commodityKey }) => {
            const meta = COMMODITIES_METADATA[commodityKey];
            const comm = data.commodities?.[commodityKey];
            const isKayu = commodityKey === "kayu";
            const isTembakau = commodityKey === "tembakau";

            const real1Jan = unit.productionActualYtd;
            const rkap1Jan = unit.productionRkapYtd;
            const achYtd = unit.achievementYtd;
            const vsTl = unit.achievementVsPreviousYear;

            const st = getStatus(achYtd, comm?.hasRkap);
            const prog = getPreviousYearProgress(vsTl, !isKayu && !isTembakau);
            const unitMeasure = comm?.unit || "KG";

            const barPct = achYtd !== null ? Math.min(achYtd, 100) : 0;

            return (
              <div
                key={`${commodityKey}-${unit.name}`}
                className="bg-white rounded-[14px] p-4 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] hover:border-[#1565C0] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Chip Komoditas & Regional */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-white tracking-wide"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] bg-[#EEF2FA] px-2 py-0.5 rounded-md truncate max-w-[140px]">
                      {unit.regional || "Regional"}
                    </span>
                  </div>

                  {/* Nama Kebun */}
                  <h3 className="font-extrabold text-sm text-[#0B1F4B] truncate leading-tight">
                    {unit.name}
                  </h3>

                  {/* Real 1 Jan & RKAP 1 Jan */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-y border-[#E2E8F0] my-2">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                        Real 1 Jan
                      </span>
                      <span className="font-black text-[#0B1F4B] text-base tabular-nums">
                        {formatProductionNumber(real1Jan, unitMeasure)}{" "}
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          {unitMeasure === "KG" ? "Ton" : "M³"}
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                        RKAP 1 Jan
                      </span>
                      <span className="font-bold text-[#1565C0] text-base tabular-nums">
                        {comm?.hasRkap ? formatProductionNumber(rkap1Jan, unitMeasure) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Protas Real */}
                  {unit.productivityActual !== null && (
                    <div className="text-[11px] text-[#64748B] mb-2 font-medium">
                      Protas Real:{" "}
                      <span className="font-black text-[#0B1F4B] tabular-nums">
                        {formatRawNumber(unit.productivityActual, 1)} KG/Ha
                      </span>
                    </div>
                  )}
                </div>

                {/* Bagian Bawah: Chip Capaian thd RKAP + Panah Progres vs TL + Mini Bar */}
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {comm?.hasRkap ? (
                      <span
                        className="text-[11px] font-black px-2.5 py-0.5 rounded-md tabular-nums"
                        style={{
                          backgroundColor: st.bgColor,
                          color: st.textColor,
                          border: `1px solid ${st.borderColor}`,
                        }}
                      >
                        {st.formatted}
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8] italic">Tanpa RKAP</span>
                    )}

                    {/* Panah Progres vs TL */}
                    {!isKayu && !isTembakau && prog.hasData ? (
                      <span
                        className="text-[11px] font-bold tabular-nums"
                        style={{ color: prog.color }}
                        title={prog.tooltip}
                      >
                        {prog.arrow} {prog.text}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#94A3B8]">vs TL: —</span>
                    )}
                  </div>

                  {/* Mini Bar Real vs RKAP */}
                  {comm?.hasRkap && (
                    <div className="w-full h-1.5 bg-[#EEF2FA] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: st.color,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* 4. Tampilan Tabel */
        <section className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#0B1F4B] text-white">
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider">No</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider">Komoditas</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider">Kebun</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider">Regional</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider text-right">Real 1 Jan</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider text-right">RKAP 1 Jan</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider text-center">% Capaian</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider text-right">Progres vs TL</th>
                  <th className="py-3 px-3.5 font-extrabold uppercase tracking-wider text-right">Protas (KG/Ha)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-medium">
                {filteredUnits.map(({ unit, commodityKey }, idx) => {
                  const meta = COMMODITIES_METADATA[commodityKey];
                  const comm = data.commodities?.[commodityKey];
                  const isKayu = commodityKey === "kayu";
                  const isTembakau = commodityKey === "tembakau";

                  const real1Jan = unit.productionActualYtd;
                  const rkap1Jan = unit.productionRkapYtd;
                  const achYtd = unit.achievementYtd;
                  const vsTl = unit.achievementVsPreviousYear;

                  const st = getStatus(achYtd, comm?.hasRkap);
                  const prog = getPreviousYearProgress(vsTl, !isKayu && !isTembakau);
                  const unitMeasure = comm?.unit || "KG";

                  return (
                    <tr key={`${commodityKey}-${unit.name}`} className="hover:bg-[#F3F5F9]/70 h-11">
                      <td className="py-2.5 px-3.5 text-[#64748B] font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white inline-block"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-[#0B1F4B]">{unit.name}</td>
                      <td className="py-2.5 px-3.5 text-[#64748B]">{unit.regional || "—"}</td>
                      <td className="py-2.5 px-3.5 text-right font-black tabular-nums">
                        {formatProductionNumber(real1Jan, unitMeasure)}{" "}
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          {unitMeasure === "KG" ? "Ton" : "M³"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#1565C0] tabular-nums">
                        {comm?.hasRkap ? formatProductionNumber(rkap1Jan, unitMeasure) : "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        {comm?.hasRkap ? (
                          <span
                            className="inline-block px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums"
                            style={{ backgroundColor: st.bgColor, color: st.textColor }}
                          >
                            {st.formatted}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {!isKayu && !isTembakau && prog.hasData ? (
                          <span className="font-bold tabular-nums" style={{ color: prog.color }}>
                            {prog.arrow} {prog.text}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right tabular-nums font-bold">
                        {formatRawNumber(unit.productivityActual, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
