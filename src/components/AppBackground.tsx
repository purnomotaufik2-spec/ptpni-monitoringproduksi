/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { CommodityKey } from "../types";
import { CommodityWatermarkCorner } from "./CommodityIcons";

interface AppBackgroundProps {
  activeCommodityKey?: CommodityKey | string | null;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ activeCommodityKey }) => {
  const [scrollY, setScrollY] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isPointerFine, setIsPointerFine] = useState(false);

  // Parallax scroll untuk watermark logo
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cek apakah perangkat desktop / fine pointer
  useEffect(() => {
    if (typeof window !== "undefined") {
      const fine = window.matchMedia("(pointer: fine)").matches;
      setIsPointerFine(fine);
    }
  }, []);

  // Cursor follower smooth delay untuk desktop saat komoditas aktif
  useEffect(() => {
    if (!isPointerFine || !activeCommodityKey || activeCommodityKey === "semua") return;

    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animateFollower = () => {
      setFollowerPos((prev) => ({
        x: prev.x + (cursorPos.x - prev.x) * 0.15,
        y: prev.y + (cursorPos.y - prev.y) * 0.15,
      }));
      animationFrameId = requestAnimationFrame(animateFollower);
    };

    animationFrameId = requestAnimationFrame(animateFollower);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPointerFine, activeCommodityKey, cursorPos.x, cursorPos.y]);

  // Tentukan warna follower berdasarkan komoditas
  const getFollowerColor = () => {
    switch (activeCommodityKey) {
      case "karet":
        return "#2E7D32";
      case "teh":
        return "#00897B";
      case "kopi_arabika":
      case "kopi":
        return "#6D4C41";
      case "kopi_robusta":
        return "#EF6C00";
      case "tembakau":
        return "#F9A825";
      case "kayu":
        return "#8D6E63";
      default:
        return "#2E7D32";
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Latar dasar: Gradient lembut diagonal #EAF0FB -> #F1F7F2 -> #FFF6E5 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #EAF0FB 0%, #F1F7F2 50%, #FFF6E5 100%)",
        }}
      />

      {/* 2. Tiga Blob Cahaya Melayang Berputar Pelan */}
      {/* Blob Biru */}
      <div
        className="app-blob absolute w-[420px] h-[420px] rounded-full blur-[80px] opacity-30 animate-blob-blue"
        style={{
          background: "radial-gradient(circle, #48A6DD 0%, rgba(72,166,221,0) 70%)",
          top: "-8%",
          left: "5%",
        }}
      />

      {/* Blob Hijau */}
      <div
        className="app-blob absolute w-[460px] h-[460px] rounded-full blur-[85px] opacity-28 animate-blob-green"
        style={{
          background: "radial-gradient(circle, #22C232 0%, rgba(34,194,50,0) 70%)",
          top: "40%",
          right: "-5%",
        }}
      />

      {/* Blob Emas */}
      <div
        className="app-blob absolute w-[440px] h-[440px] rounded-full blur-[80px] opacity-25 animate-blob-gold"
        style={{
          background: "radial-gradient(circle, #F9B33F 0%, rgba(249,179,63,0) 70%)",
          bottom: "-5%",
          left: "25%",
        }}
      />

      {/* 3. Pola Titik Halus (Dot grid 24px, #0B1F4B opacity 4%) */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#0B1F4B 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 4. WATERMARK LOGO RESMI PTPN I (Sangat besar di tengah layar, rotasi ±3°, parallax scroll) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `translate(-50%, calc(-50% + ${scrollY * 0.05}px))`,
        }}
      >
        <img
          src="/LOGO-PTPN-1.png"
          alt=""
          className="w-[60vw] max-w-[720px] h-auto object-contain opacity-[0.045] animate-slow-rotate"
        />
      </div>

      {/* 5. Watermark Komoditas Pojok Kanan Bawah */}
      <CommodityWatermarkCorner commodityKey={activeCommodityKey} />

      {/* 6. Cursor Follower Halus (Desktop fine pointer only) */}
      {isPointerFine && activeCommodityKey && activeCommodityKey !== "semua" && followerPos.x > 0 && (
        <div
          className="fixed rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            transform: `translate3d(${followerPos.x - 14}px, ${followerPos.y - 14}px, 0)`,
            width: "28px",
            height: "28px",
            border: `2px solid ${getFollowerColor()}`,
            backgroundColor: `${getFollowerColor()}18`,
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
};
