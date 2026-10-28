/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Calendar,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  Bug,
} from "lucide-react";
import { DashboardResponse, CommodityKey } from "../../types";
import {
  ALL_COMMODITY_KEYS,
  COMMODITIES_METADATA,
  formatIndonesianDate,
  formatCount,
  getDisplayUnit,
  formatRawNumber,
} from "../../utils/formatters";
import { FullDataTable } from "../FullDataTable";

interface AkunTabProps {
  data: DashboardResponse;
  onLogout: () => void;
}

export const AkunTab: React.FC<AkunTabProps> = ({ data, onLogout }) => {
  const [selectedTableComm, setSelectedTableComm] = useState<CommodityKey | null>(null);
  const [debugComm, setDebugComm] = useState<CommodityKey>("karet");

  const userInitials = (data.user.name || data.user.username || "P")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeDebugCommodity = data.commodities?.[debugComm];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* 1. Kartu Profil Pengguna */}
      <section className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar Inisial Emas/Navy */}
            <div className="w-16 h-16 rounded-2xl bg-[#0B1F4B] text-[#F5B93E] font-black text-xl flex items-center justify-center shadow-md ring-4 ring-[#EEF2FA] shrink-0">
              {userInitials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0B1F4B]">
                  {data.user.name}
                </h2>
                <span className="bg-[#EEF2FA] text-[#0B1F4B] text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-200 uppercase">
                  {data.user.role}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Username: <code className="font-mono text-[#0B1F4B] font-bold">{data.user.username}</code> &bull; Divisi: <span className="font-semibold text-[#0B1F4B]">{data.user.division || "Operasional"}</span>
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#F5B93E]" />
                <span>Tanggal LHP Aktif:</span>
                <span className="font-bold text-[#0B1F4B]">{formatIndonesianDate(data.reportDate)}</span>
              </div>
            </div>
          </div>

          {/* Tombol Keluar */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFEBEE] hover:bg-red-100 text-[#C62828] border border-[#FFCDD2] rounded-xl text-xs font-bold transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#D32F2F]" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </section>

      {/* 2. Bagian Validasi Data (Tabel Status 6 Komoditas) */}
      <section className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F3F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
              Validasi Data Backend (6 Komoditas)
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#64748B]">
            Status Integritas Backend
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF2FA] text-[#0B1F4B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3.5 font-bold">Komoditas</th>
                <th className="py-2.5 px-3.5 font-bold text-center">Tersedia?</th>
                <th className="py-2.5 px-3.5 font-bold text-center">Satuan</th>
                <th className="py-2.5 px-3.5 font-bold text-right">Jml Regional</th>
                <th className="py-2.5 px-3.5 font-bold text-right">Jml Kebun (Unit)</th>
                <th className="py-2.5 px-3.5 font-bold text-center">Konsisten?</th>
                <th className="py-2.5 px-3.5 font-bold text-center">Warning</th>
                <th className="py-2.5 px-3.5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {ALL_COMMODITY_KEYS.map((key) => {
                const comm = data.commodities?.[key];
                const meta = COMMODITIES_METADATA[key];
                const isAvail = Boolean(comm?.available);
                const isCons = comm?.validation?.consistent;
                const warnCount = comm?.validation?.warnings?.length ?? 0;
                const unitCount = comm?.units?.length ?? (comm?.validation?.unitCount ?? 0);
                const regCount = comm?.regionals?.length ?? (comm?.validation?.regionalCount ?? 0);
                const unitDisplay = comm?.unit ? getDisplayUnit(comm.unit) : (key === "kayu" ? "M³" : "Ton");

                return (
                  <tr key={key} className="hover:bg-[#F3F5F9]/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-[#0B1F4B] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span>{meta.name}</span>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      {isAvail ? (
                        <span className="inline-flex items-center gap-1 text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Ya
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                          <XCircle className="w-3 h-3" /> Tidak
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-center font-mono text-[#64748B]">
                      {unitDisplay}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono text-[#0B1F4B]">
                      {formatCount(regCount)}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#0B1F4B]">
                      {formatCount(unitCount)}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      {isCons === true ? (
                        <span className="text-[#2E7D32] font-bold text-[11px]">Ya</span>
                      ) : isCons === false ? (
                        <span className="text-[#D32F2F] font-bold text-[11px] bg-[#FFEBEE] px-1.5 py-0.5 rounded">
                          Tidak
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      {warnCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#EF6C00] font-bold bg-[#FFF3E0] px-2 py-0.5 rounded-full text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> {warnCount}
                        </span>
                      ) : (
                        <span className="text-[#64748B] text-xs">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTableComm(selectedTableComm === key ? null : key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedTableComm === key
                            ? "bg-[#0B1F4B] text-white shadow-2xs"
                            : "bg-[#EEF2FA] hover:bg-slate-200 text-[#0B1F4B]"
                        }`}
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>{selectedTableComm === key ? "Tutup" : "Tabel"}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Tampilan Sheet FullDataTable jika tombol ditekan */}
      {selectedTableComm && data.commodities?.[selectedTableComm] && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1565C0]" />
              <span>
                Tabel Lengkap: {COMMODITIES_METADATA[selectedTableComm].name}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setSelectedTableComm(null)}
              className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
            >
              Tutup Tabel
            </button>
          </div>

          <FullDataTable commodity={data.commodities[selectedTableComm]} />
        </section>
      )}

      {/* 4. Tabel Debug per Regional (Nilai Mentah: productionRkapYtd, productionActualYtd, achievementYtd) */}
      <section className="bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_2px_10px_rgba(11,31,75,0.06)] overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F3F5F9] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#EF6C00]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F4B]">
              Tabel Debug Nilai Mentah per Regional
            </h3>
          </div>

          {/* Pemilih Komoditas untuk Debug */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] font-semibold">Komoditas:</span>
            <select
              value={debugComm}
              onChange={(e) => setDebugComm(e.target.value as CommodityKey)}
              className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs font-bold text-[#0B1F4B] cursor-pointer focus:outline-none"
            >
              {ALL_COMMODITY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {COMMODITIES_METADATA[k].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF2FA] text-[#0B1F4B] uppercase text-[10px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="py-2.5 px-3.5 font-bold">Regional</th>
                <th className="py-2.5 px-3.5 font-bold text-right">productionRkapYtd (Mentah)</th>
                <th className="py-2.5 px-3.5 font-bold text-right">productionActualYtd (Mentah)</th>
                <th className="py-2.5 px-3.5 font-bold text-right">achievementYtd (Mentah)</th>
                <th className="py-2.5 px-3.5 font-bold text-right">achievementVsPreviousYear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-mono">
              {(activeDebugCommodity?.regionals || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#94A3B8] italic font-sans">
                    Tidak ada regional tercatat untuk komoditas ini.
                  </td>
                </tr>
              ) : (
                activeDebugCommodity?.regionals?.map((r) => (
                  <tr key={r.name} className="hover:bg-[#F3F5F9]/80">
                    <td className="py-2 px-3.5 font-bold text-[#0B1F4B] font-sans">{r.name}</td>
                    <td className="py-2 px-3.5 text-right text-[#64748B]">
                      {r.productionRkapYtd !== null ? formatRawNumber(r.productionRkapYtd, 2) : "null"}
                    </td>
                    <td className="py-2 px-3.5 text-right font-bold text-[#0B1F4B]">
                      {r.productionActualYtd !== null ? formatRawNumber(r.productionActualYtd, 2) : "null"}
                    </td>
                    <td className="py-2 px-3.5 text-right font-black text-[#2E7D32]">
                      {r.achievementYtd !== null ? `${formatRawNumber(r.achievementYtd, 2)}%` : "null"}
                    </td>
                    <td className="py-2 px-3.5 text-right text-[#64748B]">
                      {r.achievementVsPreviousYear !== null ? `${formatRawNumber(r.achievementVsPreviousYear, 2)}%` : "null"}
                    </td>
                  </tr>
                ))
              )}

              {/* Grand Total Baris Mentah */}
              {activeDebugCommodity?.grandTotal && (
                <tr className="bg-[#0B1F4B] text-white font-bold font-mono">
                  <td className="py-2.5 px-3.5 font-sans">TOTAL PTPN I</td>
                  <td className="py-2.5 px-3.5 text-right text-white/80">
                    {activeDebugCommodity.grandTotal.productionRkapYtd !== null
                      ? formatRawNumber(activeDebugCommodity.grandTotal.productionRkapYtd, 2)
                      : "null"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-white">
                    {activeDebugCommodity.grandTotal.productionActualYtd !== null
                      ? formatRawNumber(activeDebugCommodity.grandTotal.productionActualYtd, 2)
                      : "null"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-[#F5B93E]">
                    {activeDebugCommodity.grandTotal.achievementYtd !== null
                      ? `${formatRawNumber(activeDebugCommodity.grandTotal.achievementYtd, 2)}%`
                      : "null"}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-white/80">
                    {activeDebugCommodity.grandTotal.achievementVsPreviousYear !== null
                      ? `${formatRawNumber(activeDebugCommodity.grandTotal.achievementVsPreviousYear, 2)}%`
                      : "null"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
