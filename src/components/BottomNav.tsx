/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Home, Layers, Trees, BarChart3, Download, UserCircle } from "lucide-react";
import { motion } from "motion/react";

export type TabKey = "beranda" | "komoditas" | "kebun" | "grafik" | "pdf" | "akun";

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "komoditas", label: "Komoditas", icon: Layers },
  { key: "kebun", label: "Kebun", icon: Trees },
  { key: "grafik", label: "Grafik", icon: BarChart3 },
  { key: "pdf", label: "Unduh", icon: Download },
  { key: "akun", label: "Akun", icon: UserCircle },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-md border-t border-white/60 shadow-[0_-4px_24px_rgba(11,31,75,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md md:max-w-xl mx-auto px-2 py-1.5 flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer group active:scale-95"
            >
              <div className="relative flex flex-col items-center gap-0.5 z-10">
                <div className="relative w-11 h-7 flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 bg-[#0B1F4B] rounded-full shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative z-10 w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-[#64748B] group-hover:text-[#0B1F4B]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] tracking-tight transition-colors ${
                    isActive
                      ? "font-bold text-[#0B1F4B]"
                      : "font-medium text-[#64748B] group-hover:text-[#0B1F4B]"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const WatermarkFooter: React.FC = () => {
  return (
    <footer className="w-full text-center py-4 mb-16 text-[11px] text-[#94A3B8] select-none tracking-wide font-medium">
      Taufik Purnomo / DKTK
    </footer>
  );
};
