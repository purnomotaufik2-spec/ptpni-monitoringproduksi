import { useEffect, useRef } from "react";

const IGNORE =
  '[data-no-swipe],input,textarea,select,[role="dialog"],[role="slider"]';

function insideHorizontalScroller(el: HTMLElement | null): boolean {
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    if ((s.overflowX === "auto" || s.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 2) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function useSwipeNav(enabled: boolean, onSwipeLeft: () => void, onSwipeRight: () => void) {
  const leftRef = useRef(onSwipeLeft);
  const rightRef = useRef(onSwipeRight);
  leftRef.current = onSwipeLeft;
  rightRef.current = onSwipeRight;

  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number; t: number; ignore: boolean } | null = null;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { start = null; return; }
      const t = e.touches[0];
      const target = e.target as HTMLElement;
      const nearEdge = t.clientX < 24 || t.clientX > window.innerWidth - 24; // hindari gesture "back" bawaan HP
      start = {
        x: t.clientX, y: t.clientY, t: Date.now(),
        ignore: nearEdge || !!target.closest(IGNORE) || insideHorizontalScroller(target),
      };
    };

    const onEnd = (e: TouchEvent) => {
      const s = start; start = null;
      if (!s || s.ignore) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const dt = Date.now() - s.t;
      if (dt > 800) return;                         // terlalu lambat = bukan swipe
      if (Math.abs(dx) < 60) return;                // terlalu pendek
      if (Math.abs(dx) < 1.5 * Math.abs(dy)) return; // dominan vertikal = scroll
      if (dx < 0) leftRef.current(); else rightRef.current();
    };

    const onCancel = () => { start = null; };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
    };
  }, [enabled]);
}
