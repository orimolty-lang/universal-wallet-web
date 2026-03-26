"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  ColorType,
  CandlestickSeries,
} from "lightweight-charts";

type Point = { t: number; o: number; h: number; l: number; c: number };

export default function PerpsCandleChart({
  data,
  loading,
  error,
  onRetry,
}: {
  data: Point[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const normalized = useMemo<CandlestickData[]>(() => {
    return data
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.o) && Number.isFinite(p.h) && Number.isFinite(p.l) && Number.isFinite(p.c))
      .map((p) => ({
        time: Math.floor(p.t / 1000) as CandlestickData["time"],
        open: p.o,
        high: p.h,
        low: p.l,
        close: p.c,
      }));
  }, [data]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || chartRef.current) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#0c0c0c" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#171717" },
        horzLines: { color: "#171717" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 6,
        rightOffset: 2,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: "#374151" },
        horzLine: { color: "#374151" },
      },
      handleScroll: false,
      handleScale: false,
      width: el.clientWidth,
      height: 170,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#4ade80",
      wickDownColor: "#f87171",
      borderUpColor: "#4ade80",
      borderDownColor: "#f87171",
      borderVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(normalized);
    if (normalized.length > 1) {
      chartRef.current?.timeScale().fitContent();
    }

    // iOS webview can report stale initial size; force a late resize pass.
    const t = setTimeout(() => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      chartRef.current.timeScale().fitContent();
    }, 120);

    return () => clearTimeout(t);
  }, [normalized]);

  const pct = useMemo(() => {
    if (!normalized.length) return null;
    const first = normalized[0].open;
    const last = normalized[normalized.length - 1].close;
    if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return null;
    return ((last - first) / first) * 100;
  }, [normalized]);

  return (
    <div className="h-[170px] rounded-lg bg-[#0c0c0c] border border-[#222] p-2 relative">
      {pct != null && (
        <div className={`text-[11px] mb-1 ${pct >= 0 ? "text-green-400" : "text-red-400"}`}>
          {pct >= 0 ? "+" : ""}
          {pct.toFixed(2)}%
        </div>
      )}

      <div ref={containerRef} className="w-full h-[145px]" />

      {loading && normalized.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
          Loading chart…
        </div>
      )}

      {!loading && normalized.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
          <div>No chart data{error ? ` (${error})` : ""}</div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-2 py-1 rounded border border-[#333] text-[10px] text-gray-300"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
