/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ChevronRight,
  Table,
  LayoutGrid,
  Trees,
  Layers,
  ArrowUpDown,
  Home,
  ArrowLeft,
} from "lucide-react";
import { DashboardResponse, PeriodType, CommodityKey, Row } from "../../types";
import {
  COMMODITIES_METADATA,
  ALL_COMMODITY_KEYS,
  formatProductionNumber,
  getStatus,
  getPreviousYearProgress,
  getPeriodValues,
} from "../../utils/formatters";
import { CommodityKpiPanel } from "../CommodityKpiPanel";
import { FullDataTable } from "../FullDataTable";
import { CommodityIcon, getCommodityCursorStyle } from "../CommodityIcons";

interface KomoditasTabProps {
  data: DashboardResponse;
  period: PeriodType;
  initialCommodityKey?: CommodityKey;
}

type SortKey = "capaian_desc" | "capaian_asc" | "realisasi_desc" | "nama_asc";

export const KomoditasTab: React.FC<KomoditasTabProps> = ({
  data,
  period,
  initialCommodityKey = "karet",
}) => {
  const [activeKey, setActiveKey] = useState<CommodityKey>(initialCommodityKey);
  const [selectedRegional, setSelectedRegional] = useState<Row | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Row | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [regionalSort, setRegionalSort] = useState<SortKey>("capaian_desc");

  const currentCommodity = data.commodities?.[activeKey];
  const meta = COMMODITIES_METADATA[activeKey];
  const isKayu = activeKey === "kayu";
  const isTembakau = activeKey === "tembakau";
  const showVsTl = period === "kumulatif";

  // Reset drill-down saat berpindah komoditas
  const handleSelectCommodity = (key: CommodityKey) => {
    setActiveKey(key);
    setSelectedRegional(null);
    setSelectedUnit(null);
  };

  // Sort kartu regional sesuai periode aktif
  const sortedRegionals = React.useMemo(() => {
    if (!currentCommodity?.regionals) return [];
    const list = [...currentCommodity.regionals];

    switch (regionalSort) {
      case "capaian_desc":
        return list.sort((a, b) => (getPeriodValues(b, period).achievement || 0) - (getPeriodValues(a, period).achievement || 0));
      case "capaian_asc":
        return list.sort((a, b) => (getPeriodValues(a, period).achievement || 0) - (getPeriodValues(b, period).achievement || 0));
      case "realisasi_desc":
        return list.sort((a, b) => (getPeriodValues(b, period).actual || 0) - (getPeriodValues(a, period).actual || 0));
      case "nama_asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [currentCommodity, regionalSort, period]);

  // Unit kebun dalam regional yang sedang dipilih
  const unitsInSelectedRegional = React.useMemo(() => {
    if (!selectedRegional || !currentCommodity?.units) return [];
    return currentCommodity.units.filter(
      (u) => u.regional?.trim().toLowerCase() === selectedRegional.name.trim().toLowerCase()
    );
  }, [selectedRegional, currentCommodity]);

  // Row aktif untuk ditampilkan di CommodityKpiPanel
  const activeDisplayRow: Row | null = selectedUnit
    ? selectedUnit
    : selectedRegional
    ? selectedRegional
    : currentCommodity?.grandTotal || null;

  const activeLevelTitle = selectedUnit
    ? `Unit Kebun: ${selectedUnit.name}`
    : selectedRegional
    ? `Regional: ${selectedRegional.name}`
    : `Total PTPN I: ${meta.name}`;

  return (
    <div
      className="space-y-6 pb-12"
      style={{
        cursor: getCommodityCursorStyle(activeKey),
      }}
    >
      {/* 1. Bar Pemilih Komoditas dengan Ikon SVG Flat */}
      <section className="glass-card rounded-[18px] p-3.5 sm:p-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
          Pilih Komoditas:
        </span>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
          {ALL_COMMODITY_KEYS.map((key) => {
            const m = COMMODITIES_METADATA[key];
            const isActive = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectCommodity(key)}
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
      </section>

      {/* 2. Breadcrumbs Navigasi Drill-Down */}
      <section className="bg-white rounded-[14px] px-4 py-3 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap font-bold text-[#64748B]">
          <span className="flex items-center gap-1 text-[#0B1F4B]">
            <Home className="w-3.5 h-3.5" />
            <span>Komoditas</span>
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />

          {/* Level Komoditas */}
          <button
            type="button"
            onClick={() => {
              setSelectedRegional(null);
              setSelectedUnit(null);
            }}
            className={`cursor-pointer transition-colors ${
              !selectedRegional && !selectedUnit
                ? "text-[#0B1F4B] font-extrabold underline decoration-2 underline-offset-4"
                : "text-[#64748B] hover:text-[#0B1F4B]"
            }`}
          >
            {meta.name}
          </button>

          {/* Level Regional */}
          {selectedRegional && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className={`cursor-pointer transition-colors ${
                  !selectedUnit
                    ? "text-[#0B1F4B] font-extrabold underline decoration-2 underline-offset-4"
                    : "text-[#64748B] hover:text-[#0B1F4B]"
                }`}
              >
                {selectedRegional.name}
              </button>
            </>
          )}

          {/* Level Kebun */}
          {selectedUnit && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="text-[#0B1F4B] font-extrabold underline decoration-2 underline-offset-4">
                {selectedUnit.name}
              </span>
            </>
          )}
        </div>

        {/* Tombol Reset / Kembali */}
        {(selectedRegional || selectedUnit) && (
          <button
            type="button"
            onClick={() => {
              if (selectedUnit) {
                setSelectedUnit(null);
              } else {
                setSelectedRegional(null);
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke {selectedUnit ? selectedRegional?.name : "Semua Regional"}</span>
          </button>
        )}
      </section>

      {/* 3. Panel KPI Simetris Eksekutif */}
      {currentCommodity && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B] block">
                {activeLevelTitle}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B1F4B]">
                Indikator Utama Produksi
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowFullTable(!showFullTable)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0B1F4B] text-[#0B1F4B] hover:bg-[#0B1F4B] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Table className="w-3.5 h-3.5" />
              <span>{showFullTable ? "Tutup Tabel Lengkap" : "Lihat Tabel Lengkap"}</span>
            </button>
          </div>

          <CommodityKpiPanel
            commodity={currentCommodity}
            selectedRow={activeDisplayRow}
            title={activeLevelTitle}
            period={period}
          />
        </section>
      )}

      {/* 4. Tampilan Tabel Lengkap (Jika Tombol Ditekan) */}
      {showFullTable && currentCommodity && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0B1F4B]">
              Tabel Lengkap Komoditas {meta.name}
            </h3>
            <button
              type="button"
              onClick={() => setShowFullTable(false)}
              className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
            >
              Sembunyikan
            </button>
          </div>
          <FullDataTable commodity={currentCommodity} period={period} />
        </section>
      )}

      {/* 5. Kartu Regional (Grid Simetris) jika belum memilih Kebun */}
      {!selectedUnit && currentCommodity && (
        <section className="bg-white rounded-[14px] p-4 sm:p-5 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] space-y-4">
          {/* Header & Pengurutan */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm sm:text-[15px] font-extrabold uppercase tracking-wider text-[#0B1F4B]">
                {selectedRegional ? `Daftar Kebun di ${selectedRegional.name}` : `Daftar Regional (${sortedRegionals.length})`}
              </h3>
              <p className="text-xs text-[#64748B]">
                {selectedRegional
                  ? "Klik kebun untuk melihat detail indikator spesifik"
                  : "Klik regional untuk melihat kebun di bawahnya"}
              </p>
            </div>

            {!selectedRegional && (
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
                <span className="text-[#64748B] font-semibold">Urutkan:</span>
                <select
                  value={regionalSort}
                  onChange={(e) => setRegionalSort(e.target.value as SortKey)}
                  className="bg-[#F3F5F9] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0B1F4B] cursor-pointer focus:outline-none"
                >
                  <option value="capaian_desc">Capaian RKAP Tertinggi</option>
                  <option value="capaian_asc">Capaian RKAP Terendah</option>
                  <option value="realisasi_desc">Realisasi Terbesar</option>
                  <option value="nama_asc">Nama A–Z</option>
                </select>
              </div>
            )}
          </div>

          {/* Grid Kartu Regional Simetris */}
          {!selectedRegional ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ gridAutoRows: "1fr" }}>
              {sortedRegionals.map((reg) => {
                const pVals = getPeriodValues(reg, period);
                const realVal = pVals.actual;
                const achVal = pVals.achievement;
                const vsTl = reg.achievementVsPreviousYear;
                const st = getStatus(achVal, currentCommodity.hasRkap, pVals.rkap);
                const prog = getPreviousYearProgress(vsTl, !isKayu && !isTembakau);

                const unitCountInReg = (currentCommodity.units || []).filter(
                  (u) => u.regional?.trim().toLowerCase() === reg.name.trim().toLowerCase()
                ).length;

                return (
                  <div
                    key={reg.name}
                    onClick={() => setSelectedRegional(reg)}
                    className="group rounded-[14px] border border-[#E2E8F0] bg-white hover:border-[#1565C0] p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between shadow-[0_2px_10px_rgba(11,31,75,0.06)] hover:shadow-lg"
                  >
                    <div>
                      {/* Nama Regional + Jumlah Kebun */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <h4 className="font-extrabold text-sm text-[#0B1F4B] group-hover:text-[#1565C0] transition-colors truncate">
                          {reg.name}
                        </h4>
                        <span className="text-[10px] font-bold text-[#64748B] bg-[#EEF2FA] px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                          {unitCountInReg} Kebun
                        </span>
                      </div>

                      {/* Realisasi Sesuai Periode Aktif */}
                      <div className="mb-2.5">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                          {period === "hari_ini" ? "Real Hari Ini" : period === "bulan" ? "Real Bulan s/d HI" : "Real 1 Jan s/d HI"}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-black text-[#0B1F4B] tabular-nums">
                            {formatProductionNumber(realVal, currentCommodity.unit)}
                          </span>
                          <span className="text-xs font-semibold text-[#64748B]">
                            {currentCommodity.unit === "KG" ? "Ton" : "M³"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chip Capaian thd RKAP + Panah Progres vs TL */}
                    <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                      {currentCommodity.hasRkap ? (
                        <div className="space-y-0.5">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black tabular-nums"
                            style={{
                              backgroundColor: st.bgColor,
                              color: st.textColor,
                              border: `1px solid ${st.borderColor}`,
                            }}
                          >
                            {st.formatted}
                          </span>
                          {showVsTl && !isTembakau && prog.hasData && (
                            <span
                              className="block text-[10px] font-bold tabular-nums transition-opacity duration-200"
                              style={{ color: prog.color }}
                              title={prog.tooltip}
                            >
                              {prog.arrow} {prog.text}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#64748B] font-semibold">Volume Kumulatif M³</span>
                      )}

                      <span className="text-xs font-bold text-[#1565C0] group-hover:underline flex items-center gap-0.5 shrink-0">
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grid Kebun di Regional Terpilih */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ gridAutoRows: "1fr" }}>
              {unitsInSelectedRegional.map((u) => {
                const pVals = getPeriodValues(u, period);
                const realVal = pVals.actual;
                const achVal = pVals.achievement;
                const vsTl = u.achievementVsPreviousYear;
                const st = getStatus(achVal, currentCommodity.hasRkap, pVals.rkap);
                const prog = getPreviousYearProgress(vsTl, !isKayu && !isTembakau);

                return (
                  <div
                    key={u.name}
                    onClick={() => setSelectedUnit(u)}
                    className="group rounded-[14px] border border-[#E2E8F0] bg-white hover:border-[#1565C0] p-4 transition-all cursor-pointer flex flex-col justify-between shadow-[0_2px_10px_rgba(11,31,75,0.06)] hover:shadow-lg"
                  >
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0B1F4B] group-hover:text-[#1565C0] transition-colors truncate mb-1">
                        {u.name}
                      </h4>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-lg font-black text-[#0B1F4B] tabular-nums">
                          {formatProductionNumber(realVal, currentCommodity.unit)}
                        </span>
                        <span className="text-xs font-semibold text-[#64748B]">
                          {currentCommodity.unit === "KG" ? "Ton" : "M³"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                      {currentCommodity.hasRkap ? (
                        <div
                          className="px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums"
                          style={{ backgroundColor: st.bgColor, color: st.textColor }}
                        >
                          {st.formatted}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#64748B]">Unit Kebun</span>
                      )}

                      <span className="text-xs font-bold text-[#1565C0] flex items-center gap-0.5">
                        <span>Pilih</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
