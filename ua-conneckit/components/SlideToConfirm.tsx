"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THUMB_LG = 48;
const THUMB_SM = 40;
const PAD = 6;
const THRESHOLD = 0.86;

export type SlideToConfirmVariant = "accent" | "long" | "short" | "danger" | "neutral";

const variantThumb: Record<SlideToConfirmVariant, string> = {
  accent: "bg-accent-dynamic text-black",
  long: "bg-[#22c55e] text-white",
  short: "bg-[#ef4444] text-white",
  danger: "bg-red-600 text-white",
  neutral: "bg-[#3a3a3a] text-white border border-[#555]",
};

const variantTrack: Record<SlideToConfirmVariant, string> = {
  accent: "bg-[#1a1a1a] border border-[#333]",
  long: "bg-[#14532d]/35 border border-[#166534]/60",
  short: "bg-[#7f1d1d]/35 border border-[#991b1b]/60",
  danger: "bg-red-950/35 border border-red-800/60",
  neutral: "bg-[#1a1a1a] border border-[#333]",
};

export type SlideToConfirmProps = {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  variant?: SlideToConfirmVariant;
  /** Shorter track + thumb for dense layouts (e.g. perps position cards). */
  compact?: boolean;
};

export default function SlideToConfirm({
  label,
  disabled = false,
  loading = false,
  loadingLabel = "Working…",
  onConfirm,
  className = "",
  variant = "accent",
  compact = false,
}: SlideToConfirmProps) {
  const thumbPx = compact ? THUMB_SM : THUMB_LG;
  const trackH = compact ? 44 : 52;
  const thumbInner = compact ? "h-9 w-9" : "h-11 w-11";

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragPx, setDragPx] = useState(0);
  const maxPxRef = useRef(0);
  const draggingRef = useRef(false);
  const startPointerXRef = useRef(0);
  const startDragPxRef = useRef(0);
  const firedRef = useRef(false);

  const recalcMax = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    maxPxRef.current = Math.max(0, el.clientWidth - thumbPx - PAD * 2);
  }, [thumbPx]);

  useEffect(() => {
    recalcMax();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => recalcMax());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalcMax, thumbPx]);

  useEffect(() => {
    if (!loading) {
      setDragPx(0);
      firedRef.current = false;
    }
  }, [loading]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || loading || firedRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    startPointerXRef.current = e.clientX;
    startDragPxRef.current = dragPx;
    recalcMax();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || disabled || loading) return;
    const dx = e.clientX - startPointerXRef.current;
    const next = Math.max(0, Math.min(maxPxRef.current, startDragPxRef.current + dx));
    setDragPx(next);
  };

  const endDrag = async (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const max = maxPxRef.current;
    if (disabled || loading || max <= 0) {
      setDragPx(0);
      return;
    }
    const ratio = dragPx / max;
    if (ratio >= THRESHOLD && !firedRef.current) {
      firedRef.current = true;
      try {
        await onConfirm();
      } catch {
        /* parent should surface errors */
      } finally {
        firedRef.current = false;
      }
      setDragPx(0);
      return;
    }
    setDragPx(0);
  };

  const locked = disabled || loading;

  return (
    <div className={`select-none ${className}`}>
      <div
        ref={trackRef}
        className={`relative rounded-full overflow-hidden ${variantTrack[variant]} ${locked ? "opacity-55" : ""}`}
        style={{ height: trackH }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          <span className={`font-semibold text-gray-500 text-center leading-tight ${compact ? "text-[10px]" : "text-[11px] sm:text-xs"}`}>
            {loading ? loadingLabel : label}
          </span>
        </div>
        <button
          type="button"
          aria-label={label}
          disabled={locked}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`absolute top-1/2 -translate-y-1/2 z-10 flex ${thumbInner} items-center justify-center rounded-full shadow-lg disabled:opacity-50 touch-none ${variantThumb[variant]}`}
          style={{
            left: PAD + dragPx,
            touchAction: "none",
          }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-lg font-bold" aria-hidden>
              →
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
