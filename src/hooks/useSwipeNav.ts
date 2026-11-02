import { useEffect, useRef, RefObject } from "react";

const IGNORE = '[data-no-swipe],input,textarea,select,[role="dialog"],[role="slider"]';

function insideHorizontalScroller(el: HTMLElement | null): boolean {
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    if ((s.overflowX === "auto" || s.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 2) return true;
    el = el.parentElement;
  }
  return false;
}

type Opts = {
  enabled: boolean;
  targetRef: RefObject<HTMLElement | null>; // elemen yang digeser (pembungkus konten tab)
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  onNext: () => void;
  onPrev: () => void;
};

export function useSwipeNav(o: Opts) {
  const opts = useRef(o);
  opts.current = o;

  useEffect(() => {
    if (!o.enabled) return;
    let sx = 0, sy = 0, st = 0, lastX = 0, lastT = 0, vx = 0;
    let axis: "x" | "y" | null = null;
    let active = false;
    let raf = 0;
    let dx = 0;

    const el = () => opts.current.targetRef.current;
    const apply = (x: number, withTransition: boolean) => {
      const t = el(); if (!t) return;
      t.style.transition = withTransition ? "transform 260ms cubic-bezier(.22,.8,.24,1), opacity 260ms ease" : "none";
      t.style.transform = `translate3d(${x}px,0,0)`;
      t.style.opacity = String(1 - Math.min(Math.abs(x) / (window.innerWidth * 1.6), 0.35));
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { active = false; return; }
      const p = e.touches[0];
      const target = e.target as HTMLElement;
      const nearEdge = p.clientX < 20 || p.clientX > window.innerWidth - 20;
      active = !(nearEdge || target.closest(IGNORE) || insideHorizontalScroller(target));
      sx = lastX = p.clientX; sy = p.clientY; st = lastT = performance.now();
      axis = null; dx = 0; vx = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!active) return;
      const p = e.touches[0];
      const mx = p.clientX - sx, my = p.clientY - sy;
      if (axis === null) {
        if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
        axis = Math.abs(mx) > Math.abs(my) * 1.2 ? "x" : "y";
        if (axis === "y") { active = false; return; }
      }
      const now = performance.now();
      vx = (p.clientX - lastX) / Math.max(now - lastT, 1); // px/ms
      lastX = p.clientX; lastT = now;

      const atStart = mx > 0 && !opts.current.canGoPrev();
      const atEnd = mx < 0 && !opts.current.canGoNext();
      dx = atStart || atEnd ? mx * 0.18 : mx; // efek karet di ujung
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(dx, false));
    };

    const onEnd = () => {
      if (!active || axis !== "x") { active = false; return; }
      active = false;
      cancelAnimationFrame(raf);
      const w = window.innerWidth;
      const fast = Math.abs(vx) > 0.45; // flick cepat
      const far = Math.abs(dx) > w * 0.22; // geser cukup jauh (>22% layar)
      const canNext = opts.current.canGoNext();
      const canPrev = opts.current.canGoPrev();

      if (dx < 0 && (fast || far) && canNext) {
        // swipe ke KIRI → menu berikutnya
        apply(-w * 0.3, true);
        setTimeout(() => {
          const t = el();
          if (t) {
            t.style.transition = "none";
            t.style.transform = "";
            t.style.opacity = "";
          }
          opts.current.onNext();
        }, 100);
      } else if (dx > 0 && (fast || far) && canPrev) {
        // swipe ke KANAN → menu sebelumnya
        apply(w * 0.3, true);
        setTimeout(() => {
          const t = el();
          if (t) {
            t.style.transition = "none";
            t.style.transform = "";
            t.style.opacity = "";
          }
          opts.current.onPrev();
        }, 100);
      } else {
        // snap back jika batal / di ujung mentok
        apply(0, true);
        setTimeout(() => {
          const t = el();
          if (t) {
            t.style.transition = "";
            t.style.transform = "";
            t.style.opacity = "";
          }
        }, 260);
      }
    };

    const onCancel = () => {
      active = false;
      cancelAnimationFrame(raf);
      apply(0, true);
      setTimeout(() => {
        const t = el();
        if (t) {
          t.style.transition = "";
          t.style.transform = "";
          t.style.opacity = "";
        }
      }, 260);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
    };
  }, [o.enabled]);
}
