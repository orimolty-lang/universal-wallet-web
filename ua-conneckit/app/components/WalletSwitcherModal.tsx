"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import BottomSheet from "../../components/BottomSheet";
import { MAX_PRIVY_EMBEDDED_WALLETS, useWalletAppearance, type EmbeddedWalletRow } from "@/app/lib/connectkit-compat";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function reorderRows(rows: EmbeddedWalletRow[], from: number, to: number): EmbeddedWalletRow[] {
  if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return rows;
  const next = [...rows];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function WalletSwitcherModal({ isOpen, onClose }: Props) {
  const {
    embeddedWalletRows,
    switchWallet,
    createAdditionalWallet,
    canCreateWallet,
    isCreatingWallet,
    reorderEmbeddedWallets,
  } = useWalletAppearance();

  const [localRows, setLocalRows] = useState<EmbeddedWalletRow[]>(embeddedWalletRows);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    setLocalRows(embeddedWalletRows);
  }, [embeddedWalletRows]);

  const handleDragStart = useCallback((index: number) => (e: DragEvent) => {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number) => (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("text/plain");
      const parsed = raw !== "" ? Number(raw) : dragFrom.current;
      dragFrom.current = null;
      const from = typeof parsed === "number" && Number.isFinite(parsed) ? parsed : -1;
      if (from < 0 || from === dropIndex) return;
      setLocalRows((prev) => {
        const next = reorderRows(prev, from, dropIndex);
        reorderEmbeddedWallets(next.map((r) => r.address.toLowerCase()));
        return next;
      });
    },
    [reorderEmbeddedWallets],
  );

  const handleDragEnd = useCallback(() => {
    dragFrom.current = null;
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} dark>
      <div className="px-4 pb-8 max-h-[min(78vh,560px)] overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-1 text-center pt-1 pb-3 border-b border-[#252525]">
          Your wallets
        </h2>

        <div className="flex flex-col gap-2 mb-4 mt-3">
          {localRows.map((row, index) => (
            <div
              key={row.address}
              onDragOver={handleDragOver}
              onDrop={handleDrop(index)}
              className={`flex items-stretch gap-1 w-full rounded-xl border transition-colors ${
                row.isActive ? "border-accent-dynamic bg-accent-dynamic/10" : "border-[#333] bg-[#1a1a1a]"
              }`}
            >
              <button
                type="button"
                draggable
                onDragStart={handleDragStart(index)}
                onDragEnd={handleDragEnd}
                className="shrink-0 px-2 flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Reorder wallet"
              >
                <span className="text-lg leading-none select-none">⋮⋮</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchWallet(row.address);
                  onClose();
                }}
                className="flex flex-1 items-center gap-3 min-w-0 py-3 pr-3 text-left rounded-r-xl hover:bg-[#252525]/60 transition-colors"
              >
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center text-xl shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: row.profile.customImage ? undefined : row.profile.backgroundColor || "#f97316",
                  }}
                >
                  {row.profile.customImage ? (
                    <img src={row.profile.customImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    row.profile.emoji
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-sm font-medium truncate">
                    {row.profile.displayName || "Wallet"}
                  </div>
                  <div className="text-gray-500 text-[11px] font-mono truncate">{row.address}</div>
                </div>
                {row.isActive && (
                  <span className="text-accent-dynamic text-xs font-semibold shrink-0">Active</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {canCreateWallet ? (
          <button
            type="button"
            disabled={isCreatingWallet}
            onClick={async () => {
              await createAdditionalWallet();
            }}
            className="w-full py-3.5 rounded-xl border border-dashed border-[#444] text-gray-300 text-sm font-medium hover:border-accent-dynamic hover:text-accent-dynamic disabled:opacity-50"
          >
            {isCreatingWallet ? "Creating wallet…" : "+ Create another wallet"}
          </button>
        ) : (
          <p className="text-center text-gray-500 text-xs">
            Maximum of {MAX_PRIVY_EMBEDDED_WALLETS} wallets reached.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
