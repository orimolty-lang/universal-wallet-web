"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** Which row index contains this viewport Y (pointer position). */
function indexAtClientY(rowEls: (HTMLElement | null)[], clientY: number, len: number): number {
  for (let i = 0; i < len; i++) {
    const el = rowEls[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (clientY >= r.top && clientY <= r.bottom) return i;
  }
  return -1;
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
  /** Index being dragged (pointer reorder). */
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  /** Drop target while dragging. */
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowCountRef = useRef(0);
  rowCountRef.current = localRows.length;
  const dragSession = useRef<{ from: number; pointerId: number; lastOver: number } | null>(null);

  useEffect(() => {
    setLocalRows(embeddedWalletRows);
  }, [embeddedWalletRows]);

  const commitReorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return;
      setLocalRows((prev) => {
        const next = reorderRows(prev, from, to);
        reorderEmbeddedWallets(next.map((r) => r.address.toLowerCase()));
        return next;
      });
    },
    [reorderEmbeddedWallets],
  );

  const endDrag = useCallback(() => {
    dragSession.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

  const onReorderHandlePointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      dragSession.current = { from: index, pointerId: e.pointerId, lastOver: index };
      setDraggingIndex(index);
      setOverIndex(index);
    },
    [],
  );

  const onReorderHandlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = dragSession.current;
    if (!s || e.pointerId !== s.pointerId) return;
    e.preventDefault();
    const y = e.clientY;
    const len = rowCountRef.current;
    const idx = indexAtClientY(rowRefs.current, y, len);
    if (idx >= 0) {
      s.lastOver = idx;
      setOverIndex(idx);
    }
  }, []);

  const onReorderHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const s = dragSession.current;
      if (!s || e.pointerId !== s.pointerId) return;
      const el = e.currentTarget as HTMLElement;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      const from = s.from;
      const y = e.clientY;
      const len = rowCountRef.current;
      let to = indexAtClientY(rowRefs.current, y, len);
      if (to < 0) to = s.lastOver;
      endDrag();
      if (to >= 0 && from !== to) commitReorder(from, to);
    },
    [commitReorder, endDrag],
  );

  const onReorderHandlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const s = dragSession.current;
      if (!s || e.pointerId !== s.pointerId) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      endDrag();
    },
    [endDrag],
  );

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
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              className={`flex items-stretch gap-1 w-full rounded-xl border transition-colors ${
                row.isActive ? "border-accent-dynamic bg-accent-dynamic/10" : "border-[#333] bg-[#1a1a1a]"
              } ${overIndex === index && draggingIndex !== null ? "ring-1 ring-accent-dynamic/50" : ""} ${
                draggingIndex === index ? "opacity-70" : ""
              }`}
            >
              <div
                role="button"
                tabIndex={0}
                className="shrink-0 px-2 flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing select-none touch-none"
                style={{ touchAction: "none" }}
                aria-label="Drag to reorder wallet"
                onPointerDown={onReorderHandlePointerDown(index)}
                onPointerMove={onReorderHandlePointerMove}
                onPointerUp={onReorderHandlePointerUp}
                onPointerCancel={onReorderHandlePointerCancel}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                  e.preventDefault();
                  const next =
                    e.key === "ArrowUp" ? Math.max(0, index - 1) : Math.min(localRows.length - 1, index + 1);
                  if (next !== index) commitReorder(index, next);
                }}
              >
                <span className="text-lg leading-none">⋮⋮</span>
              </div>
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
