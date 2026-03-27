"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

type Theme = "sunset" | "midnight" | "forest";

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

const themeMap: Record<Theme, { bg: string; accent: string }> = {
  sunset: { bg: "linear-gradient(135deg,#3b0a45 0%, #f97316 70%, #f59e0b 100%)", accent: "#fbbf24" },
  midnight: { bg: "linear-gradient(135deg,#0f172a 0%, #1d4ed8 70%, #0ea5e9 100%)", accent: "#60a5fa" },
  forest: { bg: "linear-gradient(135deg,#052e16 0%, #166534 70%, #22c55e 100%)", accent: "#86efac" },
};

export default function PnlShareModal({ isOpen, onClose, token, pnl }: PnlShareModalProps) {
  const [theme, setTheme] = useState<Theme>("sunset");
  const [showPnl, setShowPnl] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const gain = Number(pnl?.totalGain || 0);
  const gainPct = Number(pnl?.totalGainPct || 0);
  const positive = gain >= 0;

  const displayDollar = useMemo(() => {
    if (!showPnl) return "••••";
    return `${positive ? "+" : "-"}$${Math.abs(gain).toFixed(2)}`;
  }, [showPnl, positive, gain]);

  const displayPct = useMemo(() => {
    if (!showPnl) return "••••";
    return `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(2)}%`;
  }, [showPnl, gainPct]);

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

        <div ref={cardRef} className="rounded-2xl p-4 text-white" style={{ background: t.bg }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {token.logo ? <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-white/20" />}
              <div>
                <div className="text-sm text-white/80">Universal Account</div>
                <div className="font-semibold text-lg">{token.symbol}</div>
              </div>
            </div>
            <img src="/omni-logo.png" alt="Omni" className="w-7 h-7 rounded-full" />
          </div>

          <div className="mt-6">
            <div className="text-xs text-white/80">Position Value</div>
            <div className="text-2xl font-bold">${Number(token.amountInUSD || 0).toFixed(2)}</div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/80">PnL</div>
            <div className="text-3xl font-extrabold" style={{ color: showPnl ? (positive ? "#4ade80" : "#f87171") : t.accent }}>
              {displayDollar}
            </div>
            <div className="text-sm text-white/90 mt-1">{displayPct}</div>
          </div>

          <div className="mt-6 text-[11px] text-white/70">Powered by Omni UA</div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {(Object.keys(themeMap) as Theme[]).map((x) => (
            <button
              key={x}
              onClick={() => setTheme(x)}
              className={`px-2 py-1 rounded-md text-xs ${theme === x ? "bg-accent-dynamic text-white" : "bg-white/10 text-gray-300"}`}
            >
              {x}
            </button>
          ))}
          <button onClick={() => setShowPnl((v) => !v)} className="ml-auto px-2 py-1 rounded-md bg-white/10 text-gray-300 text-xs">
            {showPnl ? "Hide PnL" : "Show PnL"}
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
