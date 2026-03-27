"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

type Theme = "sunset" | "midnight" | "forest" | "pos1" | "pos2" | "pos3" | "neg1" | "neg2" | "neg3";

type PnlData = {
  totalGain?: number;
  totalGainPct?: number;
};

type TokenData = {
  symbol: string;
  name?: string;
  logo?: string;
  amountInUSD?: number;
};

interface PnlShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenData | null;
  pnl: PnlData | null;
}

const themeMap: Record<Theme, { bg: string; accent: string; image?: string; sentiment: "neutral" | "positive" | "negative" }> = {
  sunset: { bg: "linear-gradient(135deg,#3b0a45 0%, #f97316 70%, #f59e0b 100%)", accent: "#fbbf24", sentiment: "neutral" },
  midnight: { bg: "linear-gradient(135deg,#0f172a 0%, #1d4ed8 70%, #0ea5e9 100%)", accent: "#60a5fa", sentiment: "neutral" },
  forest: { bg: "linear-gradient(135deg,#052e16 0%, #166534 70%, #22c55e 100%)", accent: "#86efac", sentiment: "neutral" },
  pos1: { bg: "#0f172a", accent: "#4ade80", image: "/pnl-backgrounds/pnl-positive.png", sentiment: "positive" },
  pos2: { bg: "#0f172a", accent: "#4ade80", image: "/pnl-backgrounds/pnl-positive2.png", sentiment: "positive" },
  pos3: { bg: "#0f172a", accent: "#4ade80", image: "/pnl-backgrounds/pnl-positive3.png", sentiment: "positive" },
  neg1: { bg: "#0f172a", accent: "#f87171", image: "/pnl-backgrounds/pnl-negative.png", sentiment: "negative" },
  neg2: { bg: "#0f172a", accent: "#f87171", image: "/pnl-backgrounds/pnl-negative1.png", sentiment: "negative" },
  neg3: { bg: "#0f172a", accent: "#f87171", image: "/pnl-backgrounds/pnl-negative4.png", sentiment: "negative" },
};

const withBasePath = (p: string): string => {
  const base = "/universal-wallet-web";
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
};

export default function PnlShareModal({ isOpen, onClose, token, pnl }: PnlShareModalProps) {
  const [theme, setTheme] = useState<Theme>("sunset");
  const [showPnl, setShowPnl] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const gain = Number(pnl?.totalGain || 0);
  const gainPct = Number(pnl?.totalGainPct || 0);
  const positive = gain >= 0;

  const selectableThemes = useMemo(() => {
    const desired = positive ? "positive" : "negative";
    return (Object.keys(themeMap) as Theme[]).filter((k) => {
      const s = themeMap[k].sentiment;
      return s === "neutral" || s === desired;
    });
  }, [positive]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectableThemes.includes(theme)) {
      setTheme(positive ? "pos1" : "neg1");
    }
  }, [isOpen, positive, selectableThemes, theme]);

  const displayDollar = useMemo(() => {
    if (!showPnl) return "••••";
    return `${positive ? "+" : "-"}$${Math.abs(gain).toFixed(2)}`;
  }, [showPnl, positive, gain]);

  const displayPct = useMemo(() => {
    return `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%`;
  }, [gainPct]);

  const exportImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const file = new File([blob], `${token?.symbol || "token"}-pnl-card.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My PnL Card" });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${token?.symbol || "token"}-pnl-card.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !token) return null;

  const t = themeMap[theme];

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#101010] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">P&L Share Card</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Close</button>
        </div>

        <div
          ref={cardRef}
          className="relative rounded-2xl p-4 text-white overflow-hidden"
          style={{ background: t.bg }}
        >
          {t.image && (
            <img
              src={withBasePath(t.image)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-black/5" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              {token.logo ? <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/20" />}
              <div>
                <div className="font-semibold text-lg">{token.symbol}</div>
              </div>
            </div>
            <img src={withBasePath("/omni-logo.png")} alt="Omni" className="w-7 h-7 rounded-full" />
          </div>

          <div className="relative mt-6">
            <div className="text-xs text-white/80">Position Value</div>
            <div className="text-2xl font-bold">${Number(token.amountInUSD || 0).toFixed(2)}</div>
          </div>

          <div className="relative mt-4">
            {showPnl ? (
              <>
                <div className="text-xs text-white/80">PnL</div>
                <div className="text-3xl font-extrabold" style={{ color: positive ? "#4ade80" : "#f87171" }}>
                  {displayDollar}
                </div>
                <div className="mt-1 text-sm text-white/90">{displayPct}</div>
              </>
            ) : (
              <div className="text-3xl font-extrabold text-white">{displayPct}</div>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {selectableThemes.map((x) => (
              <button
                key={x}
                onClick={() => setTheme(x)}
                className={`h-9 rounded-lg text-xs font-medium ${theme === x ? "bg-accent-dynamic text-white" : "bg-white/10 text-gray-300"}`}
              >
                {{
                  sunset: "sunset",
                  midnight: "midnight",
                  forest: "forest",
                  pos1: "pos-1",
                  pos2: "pos-2",
                  pos3: "pos-3",
                  neg1: "neg-1",
                  neg2: "neg-2",
                  neg3: "neg-3",
                }[x]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPnl((v) => !v)}
            className="w-full h-9 rounded-lg bg-white/10 text-gray-300 text-xs font-medium"
          >
            {showPnl ? "Hide $ PnL" : "Show $ PnL"}
          </button>
        </div>

        <button
          onClick={exportImage}
          disabled={isExporting}
          className="mt-3 w-full h-11 rounded-xl bg-accent-dynamic text-white font-medium disabled:opacity-70"
        >
          {isExporting ? "Exporting…" : "Share / Save Image"}
        </button>
      </div>
    </div>
  );
}
