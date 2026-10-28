/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fallback?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  fallback = "—",
  duration = 800,
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState<number | null>(value ?? null);
  const prevValueRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === null || value === undefined || isNaN(value)) {
      setDisplayValue(null);
      prevValueRef.current = null;
      return;
    }

    const startValue = prevValueRef.current ?? 0;
    const targetValue = value;
    prevValueRef.current = targetValue;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - (1 - progress)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (targetValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(targetValue);
      }
    };

    frameRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  if (displayValue === null || displayValue === undefined) {
    return <span className={className}>{fallback}</span>;
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
