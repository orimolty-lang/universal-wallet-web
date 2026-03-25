"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getTokenComments,
  type ClickerComment,
  normalizeChainForClicker,
  formatAddress,
  formatUsd,
  timeAgo,
} from "../lib/clickerService";

interface ClickerCommentsProps {
  /** Token contract address */
  tokenAddress?: string;
  /** Our internal blockchain name (e.g. "base", "ethereum", "solana") */
  blockchain?: string;
  /** For copy-intent: addresses of users who will copy this trade */
  onCopyIntent?: (commentId: string) => void;
}

const CHAIN_ICONS: Record<string, string> = {
  ethereum: "⟠",
  base: "🔵",
  solana: "◎",
};

// Chain badge colors
const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  base: "#0052FF",
  solana: "#9945FF",
};

// Trader avatar with fallback
const TraderAvatar = ({
  trader,
  size = 32,
}: {
  trader: ClickerComment["trader"];
  size?: number;
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = trader.displayName?.[0] || trader.username?.[0] || "?";
  const bgColor = "#a855f7"; // Default purple

  if (trader.avatarUrl && !imgError) {
    return (
      <img
        src={trader.avatarUrl}
        alt={trader.displayName || trader.username || "Trader"}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-bold select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.4,
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
};

// Single comment card
const CommentCard = ({
  comment,
  onCopyIntent,
  index,
}: {
  comment: ClickerComment;
  onCopyIntent?: (commentId: string) => void;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const chainColor = CHAIN_COLORS[comment.chain] || "#888";

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <TraderAvatar trader={comment.trader} size={36} />

        <div className="flex-1 min-w-0">
          {/* Name + address + time */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium text-sm">
              {comment.trader.displayName || comment.trader.username || "Trader"}
            </span>
            <span className="text-gray-500 text-xs font-mono">
              {formatAddress(comment.trader.traderAddress || comment.trader.addresses?.[0] || "")}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${chainColor}22`,
                color: chainColor,
              }}
            >
              {CHAIN_ICONS[comment.chain] || ""}{" "}
              {comment.chain.charAt(0).toUpperCase() + comment.chain.slice(1)}
            </span>
          </div>

          {/* Trade info row */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            {comment.side && (
              <span
                className={`font-medium ${
                  comment.side === "buy" ? "text-green-400" : "text-red-400"
                }`}
              >
                {comment.side === "buy" ? "↑ Bought" : "↓ Sold"}
              </span>
            )}
            {comment.valueUsd != null && (
              <span>{formatUsd(comment.valueUsd)}</span>
            )}
            {comment.pnlPercent != null && (
              <span
                className={
                  comment.pnlPercent >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {comment.pnlPercent >= 0 ? "+" : ""}
                {comment.pnlPercent.toFixed(1)}% PnL
              </span>
            )}
            {comment.copyCount != null && comment.copyCount > 0 && (
              <span className="text-purple-400">
                👥 {comment.copyCount} copier
                {comment.copyCount !== 1 ? "s" : ""}
              </span>
            )}
            <span className="ml-auto">{timeAgo(comment.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Comment text */}
      <div className="mt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-300 text-sm leading-relaxed text-left w-full"
        >
          <span className={expanded ? "" : "line-clamp-2"}>
            {comment.comment}
          </span>
          {comment.comment.length > 120 && (
            <span className="text-accent-dynamic text-xs ml-1">
              {expanded ? " Show less" : " Read more"}
            </span>
          )}
        </button>
      </div>

      {/* Action row */}
      {onCopyIntent && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onCopyIntent(comment.id)}
            className="flex-1 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition-colors"
          >
            📋 Copy this trade
          </button>
        </div>
      )}
    </div>
  );
};

// Loading skeleton
const CommentSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-1/3" />
            <div className="h-2 bg-white/10 rounded w-1/2" />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 bg-white/10 rounded w-full" />
          <div className="h-2 bg-white/10 rounded w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

// Error state
const ErrorState = ({
  onRetry,
}: {
  onRetry: () => void;
}) => (
  <div className="text-center py-6 text-gray-400">
    <div className="text-2xl mb-2">💬</div>
    <p className="text-sm">Couldn&apos;t load trader comments</p>
    <button
      onClick={onRetry}
      className="mt-2 text-accent-dynamic text-xs hover:underline"
    >
      Try again
    </button>
  </div>
);

// Empty state
const EmptyState = () => (
  <div className="text-center py-6 text-gray-500">
    <div className="text-2xl mb-2">📝</div>
    <p className="text-sm">No trader comments for this token yet</p>
    <p className="text-xs mt-1 text-gray-600">
      Be the first to share your trade reasoning on Clicker
    </p>
  </div>
);

// Main component
export const ClickerComments = ({
  tokenAddress,
  blockchain,
  onCopyIntent,
}: ClickerCommentsProps) => {
  const [comments, setComments] = useState<ClickerComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const chain = blockchain
    ? normalizeChainForClicker(blockchain)
    : null;

  const loadComments = useCallback(async () => {
    if (!tokenAddress || !chain) return;

    setLoading(true);
    setError(false);

    try {
      const results = await getTokenComments(tokenAddress, chain, 20);
      setComments(results);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chain, retryCount]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  const handleCopyIntent = (commentId: string) => {
    onCopyIntent?.(commentId);
  };

  if (!tokenAddress || !chain) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-purple-400 text-sm font-medium">
          💬 Trader Comments
        </span>
        {comments.length > 0 && (
          <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
            {comments.length}
          </span>
        )}
        <span className="text-xs text-gray-600">via Clicker</span>
      </div>

      {/* Content states */}
      {loading && <CommentSkeleton />}

      {error && !loading && <ErrorState onRetry={handleRetry} />}

      {!loading && !error && comments.length === 0 && <EmptyState />}

      {!loading && !error && comments.length > 0 && (
        <>
          <div className="space-y-2">
            {comments.map((comment, i) => (
              <CommentCard
                key={comment.id || i}
                comment={comment}
                onCopyIntent={onCopyIntent ? handleCopyIntent : undefined}
                index={i}
              />
            ))}
          </div>

          {/* Attribution footer */}
          <p className="text-center text-gray-600 text-xs">
            Comments are trader-submitted. Not financial advice.{" "}
            <a
              href="https://clicker.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              Learn more
            </a>
          </p>
        </>
      )}
    </div>
  );
};

export default ClickerComments;
