"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import BottomSheet from "../../components/BottomSheet";
import { MAX_PRIVY_EMBEDDED_WALLETS, useWalletAppearance, type EmbeddedWalletRow } from "@/app/lib/connectkit-compat";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const FLIP_MS = 220;
const FLIP_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

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
  /** Source index in `localRows` while dragging. */
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  /** Target visual index (same as reorderRows `to`) while dragging. */
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rowElByAddress = useRef<Map<string, HTMLDivElement>>(new Map());
  const displayRowsRef = useRef<EmbeddedWalletRow[]>([]);
  const hoverIndexRef = useRef<number>(-1);
  const pendingFlipRef = useRef<Map<string, DOMRect> | null>(null);
  const flipClearTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const dragSession = useRef<{ pointerId: number; lastOver: number; fromIndex: number } | null>(null);

  const displayRows = useMemo(() => {
    if (dragFrom === null || hoverIndex === null) return localRows;
    return reorderRows(localRows, dragFrom, hoverIndex);
  }, [localRows, dragFrom, hoverIndex]);

  displayRowsRef.current = displayRows;

  useEffect(() => {
    setLocalRows(embeddedWalletRows);
  }, [embeddedWalletRows]);

  const clearRowFlipStyles = useCallback(() => {
    for (const t of Array.from(flipClearTimersRef.current.values())) clearTimeout(t);
    flipClearTimersRef.current.clear();
    for (const el of Array.from(rowElByAddress.current.values())) {
      el.style.transition = "";
      el.style.transform = "";
    }
  }, []);

  /** After hover order changes, slide rows from old layout to new (FLIP). */
  useLayoutEffect(() => {
    if (dragFrom === null) return;
    const pending = pendingFlipRef.current;
    if (!pending || pending.size === 0) return;
    pendingFlipRef.current = null;

    const draggedAddr = localRows[dragFrom]?.address;

    for (const [addr, oldRect] of Array.from(pending.entries())) {
      // Let the grabbed row follow the reorder without a competing FLIP transform.
      if (draggedAddr && addr === draggedAddr) continue;

      const el = rowElByAddress.current.get(addr);
      if (!el) continue;
      const newRect = el.getBoundingClientRect();
      const dy = oldRect.top - newRect.top;
      if (Math.abs(dy) < 0.5) continue;

      const prevT = flipClearTimersRef.current.get(addr);
      if (prevT) clearTimeout(prevT);

      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      void el.offsetHeight;
      el.style.transition = `transform ${FLIP_MS}ms ${FLIP_EASE}`;
      el.style.transform = "translateY(0)";

      flipClearTimersRef.current.set(
        addr,
        setTimeout(() => {
          el.style.transition = "";
          el.style.transform = "";
          flipClearTimersRef.current.delete(addr);
        }, FLIP_MS + 40),
      );
    }
  }, [displayRows, dragFrom, localRows]);

  const commitReorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0) return;
      clearRowFlipStyles();
      setLocalRows((prev) => {
        const next = reorderRows(prev, from, to);
        reorderEmbeddedWallets(next.map((r) => r.address.toLowerCase()));
        return next;
      });
    },
    [reorderEmbeddedWallets, clearRowFlipStyles],
  );

  const endDrag = useCallback(() => {
    dragSession.current = null;
    setDragFrom(null);
    setHoverIndex(null);
    hoverIndexRef.current = -1;
    pendingFlipRef.current = null;
    clearRowFlipStyles();
  }, [clearRowFlipStyles]);

  const onReorderHandlePointerDown = useCallback(
    (row: EmbeddedWalletRow) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const from = localRows.findIndex((r) => r.address === row.address);
      if (from < 0) return;
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      dragSession.current = { pointerId: e.pointerId, lastOver: from, fromIndex: from };
      hoverIndexRef.current = from;
      setDragFrom(from);
      setHoverIndex(from);
    },
    [localRows],
  );

  const onReorderHandlePointerMove = useCallback((e: React.PointerEvent) => {
    const s = dragSession.current;
    if (!s || e.pointerId !== s.pointerId) return;
    e.preventDefault();
    const rows = displayRowsRef.current;
    const len = rows.length;
    const els = rows.map((r) => rowElByAddress.current.get(r.address) ?? null);
    const idx = indexAtClientY(els, e.clientY, len);
    if (idx >= 0 && idx !== hoverIndexRef.current) {
      const m = new Map<string, DOMRect>();
      for (const r of rows) {
        const el = rowElByAddress.current.get(r.address);
        if (el) m.set(r.address, el.getBoundingClientRect());
      }
      pendingFlipRef.current = m;
      s.lastOver = idx;
      hoverIndexRef.current = idx;
      setHoverIndex(idx);
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
      const fromIndex = s.fromIndex;
      const rows = displayRowsRef.current;
      const len = rows.length;
      const els = rows.map((r) => rowElByAddress.current.get(r.address) ?? null);
      let to = indexAtClientY(els, e.clientY, len);
      if (to < 0) to = s.lastOver;
      endDrag();
      if (to >= 0 && fromIndex !== to) commitReorder(fromIndex, to);
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

  const draggingAddress =
    dragFrom !== null && dragFrom < localRows.length ? localRows[dragFrom].address : null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} dark>
      <div className="px-4 pb-8 max-h-[min(78vh,560px)] overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-1 text-center pt-1 pb-3 border-b border-[#252525]">
          Your wallets
        </h2>

        <div className="flex flex-col gap-2 mb-4 mt-3">
          {displayRows.map((row) => {
            const isDraggingRow = draggingAddress === row.address;
            return (
              <div
                key={row.address}
                ref={(el) => {
                  if (el) rowElByAddress.current.set(row.address, el);
                  else rowElByAddress.current.delete(row.address);
                }}
                className={`flex items-stretch gap-1 w-full rounded-xl border ${
                  row.isActive ? "border-accent-dynamic bg-accent-dynamic/10" : "border-[#333] bg-[#1a1a1a]"
                } ${
                  isDraggingRow && dragFrom !== null
                    ? "z-10 shadow-lg shadow-black/40 ring-1 ring-accent-dynamic/40 opacity-95"
                    : ""
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="shrink-0 px-2 flex items-center justify-center text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing select-none touch-none"
                  style={{ touchAction: "none" }}
                  aria-label="Drag to reorder wallet"
                  onPointerDown={onReorderHandlePointerDown(row)}
                  onPointerMove={onReorderHandlePointerMove}
                  onPointerUp={onReorderHandlePointerUp}
                  onPointerCancel={onReorderHandlePointerCancel}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                    e.preventDefault();
                    const i = localRows.findIndex((r) => r.address === row.address);
                    if (i < 0) return;
                    const next =
                      e.key === "ArrowUp" ? Math.max(0, i - 1) : Math.min(localRows.length - 1, i + 1);
                    if (next !== i) commitReorder(i, next);
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
            );
          })}
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
