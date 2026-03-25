/**
 * Clicker API Client
 * Docs: https://docs.clicker.xyz
 *
 * Supported chains: base, ethereum, solana
 *
 * Comment Rewards flow:
 * 1. Trader posts a comment on a swap tx on-chain
 * 2. App fetches comments for a token via getTokenComments()
 * 3. When user copy-trades, call fireCopySwapIntent() to record the intent
 *    so Comment Rewards can track and split fees
 */

const CLICKER_PROXY_BASE =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_CLICKER_PROXY_URL
    ? process.env.NEXT_PUBLIC_CLICKER_PROXY_URL
    : "/clicker";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ClickerTrader {
  uid: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  addresses?: string[];
  /** Primary wallet address (EVM or Sol) */
  traderAddress?: string;
}

export interface ClickerComment {
  id: string;
  /** Trader who posted the comment */
  trader: ClickerTrader;
  /** Token contract address */
  tokenAddress: string;
  /** Clicker chain slug */
  chain: string;
  /** Swap transaction hash */
  txHash: string;
  /** The actual comment text */
  comment: string;
  /** USD value of the swap */
  valueUsd?: number;
  /** PnL % if closed position */
  pnlPercent?: number;
  pnlUsd?: number;
  /** Unix timestamp (seconds) */
  createdAt: number;
  /** "buy" | "sell" */
  side?: "buy" | "sell";
  copyCount?: number;
  copyVolume?: string;
}

export interface CopySwapIntent {
  commentId: string;
  tokenAddress: string;
  chain: string;
  userAddresses: string[];
  txHash?: string;
}

// ─── Chain normalization ───────────────────────────────────────────────────────

/** Normalize our internal blockchain name → Clicker chain slug */
const TO_CLICKER_CHAIN: Record<string, string> = {
  base: "base",
  ethereum: "ethereum",
  solana: "solana",
  // Common aliases
  eth: "ethereum",
  ether: "ethereum",
  "goerli": "ethereum",
  "sepolia": "ethereum",
};

/** Map Clicker chain slug → our internal name */
const FROM_CLICKER_CHAIN: Record<string, string> = {
  base: "base",
  ethereum: "ethereum",
  solana: "solana",
};

export function normalizeChainForClicker(blockchain: string): string {
  const raw = (blockchain || "").trim().toLowerCase();
  return TO_CLICKER_CHAIN[raw] || raw;
}

export function normalizeChainFromClicker(chain: string): string {
  return FROM_CLICKER_CHAIN[chain.toLowerCase()] || chain;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function clickerFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${CLICKER_PROXY_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Clicker API error ${res.status}: ${text}`.slice(0, 200));
  }

  return res.json() as Promise<T>;
}

// ─── Internal response types ───────────────────────────────────────────────────

interface SwapComment {
  uid: string;
  transactionHash: string;
  chain: string;
  tokenAddress: string;
  commentText: string;
  signerAddress: string;
  timestamp: number;
  isAppUserComment: boolean;
  metrics: {
    copyCount: number;
    copyVolume: string;
  };
}

interface Trade {
  transactionHash: string;
  timestamp: number;
  tokenAmount: number;
  usdCost: number;
  direction: "buy" | "sell";
  intent?: string;
  comments: SwapComment[];
}

interface PositionMetadata {
  tokenChain: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  trades: Trade[];
  positionStats?: {
    boughtUSD: number;
    soldUSD: number;
    realizedGainsUSD: number;
    isOpen: boolean;
  };
}

interface TraderPosition {
  itemId: string;
  itemTitle: string;
  transactionHash: string;
  timestamp: number;
  actor: {
    type: string;
    address: string;
    name: string;
    profile: {
      id: string;
      name: string;
      images: { raw?: string; sm?: string; xs?: string };
      addresses?: string[];
      metadata?: {
        ensName?: string;
        twitterHandle?: string;
        farcasterUsername?: string;
      };
    };
  };
  metadata: PositionMetadata;
}

// ─── Token Comments ────────────────────────────────────────────────────────────

/**
 * Get trader comments for a specific token.
 * Uses GET /v1/tokens/{chain}/{contractAddress}/positions/closed
 * and extracts trades that have comments.
 *
 * @param tokenAddress - Token contract address
 * @param chain - Our internal blockchain name (base | ethereum | solana)
 * @param limit - Max positions to fetch (default 20)
 */
export async function getTokenComments(
  tokenAddress: string,
  chain: string,
  limit = 20
): Promise<ClickerComment[]> {
  const normalizedChain = normalizeChainForClicker(chain);
  if (!normalizedChain) return [];

  try {
    // Fetch closed positions (recent exits = the most comment-worthy trades)
    const data = await clickerFetch<TraderPosition[]>(
      `/v1/tokens/${normalizedChain}/${tokenAddress}/positions/closed?limit=${limit}`
    );

    if (!Array.isArray(data)) return [];

    const comments: ClickerComment[] = [];

    for (const position of data) {
      const metadata = position.metadata;
      const actor = position.actor;
      const profile = actor?.profile;

      for (const trade of metadata?.trades || []) {
        if (!trade.comments?.length) continue;

        for (const c of trade.comments) {
          comments.push({
            id: c.uid,
            trader: {
              uid: profile?.id || c.signerAddress,
              displayName: profile?.name || actor?.name || "",
              username: profile?.metadata?.twitterHandle || profile?.metadata?.ensName || profile?.name || actor?.name,
              avatarUrl: profile?.images?.xs || profile?.images?.sm || profile?.images?.raw,
              addresses: profile?.addresses,
              traderAddress: c.signerAddress,
            },
            tokenAddress: c.tokenAddress || metadata.tokenAddress,
            chain: normalizeChainFromClicker(c.chain || metadata.tokenChain),
            txHash: c.transactionHash,
            comment: c.commentText,
            valueUsd: Math.abs(trade.usdCost),
            side: trade.direction === "buy" || trade.direction === "sell"
              ? trade.direction
              : undefined,
            createdAt: c.timestamp * 1000,
            copyCount: c.metrics?.copyCount,
            copyVolume: c.metrics?.copyVolume,
          });
        }
      }
    }

    return comments;
  } catch (err) {
    console.warn("[Clicker] getTokenComments failed:", err);
    return [];
  }
}

// ─── Copy-swap Intent ─────────────────────────────────────────────────────────

/**
 * Fire a copy-swap intent when a user acts on a trader's comment.
 * This records the intent so Comment Rewards can track and split fees.
 *
 * @param commentId - The comment UID being copied
 * @param tokenAddress - Token being bought
 * @param chain - Clicker chain slug
 * @param userAddresses - Wallet addresses that will receive the copy-trade
 */
export async function fireCopySwapIntent(
  commentId: string,
  tokenAddress: string,
  chain: string,
  userAddresses: string[]
): Promise<{ success: boolean; intentId?: string; error?: string }> {
  const normalizedChain = normalizeChainForClicker(chain);
  if (!normalizedChain) return { success: false, error: "Unsupported chain" };

  try {
    const data = await clickerFetch<{
      success?: boolean;
      uid?: string;
      error?: string;
    }>(`/v1/swap-comment/${commentId}/copyswap`, {
      method: "POST",
      body: JSON.stringify({
        token_address: tokenAddress,
        chain: normalizedChain,
        user_addresses: userAddresses,
      }),
    });

    return {
      success: data?.success ?? true,
      intentId: data?.uid,
      error: data?.error,
    };
  } catch (err) {
    console.warn("[Clicker] fireCopySwapIntent failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Trader Profile ────────────────────────────────────────────────────────────

/**
 * Get a trader's profile by address or profile UID.
 * identifier can be a wallet address (0x... or Sol address) or profile UUID.
 */
export async function getTraderProfile(
  identifier: string
): Promise<{
  trader: ClickerTrader;
  stats?: {
    totalPnlUsd?: number;
    winRate?: number;
    totalTrades?: number;
    followerCount?: number;
    commentCount?: number;
  };
} | null> {
  try {
    const data = await clickerFetch<{
      id: string;
      name: string;
      images: { raw?: string; sm?: string; xs?: string };
      addresses?: string[];
      metadata?: {
        pnl30d?: number;
        winRate30d?: number;
        tradeCount30d?: number;
        commentCount30d?: number;
        ensName?: string;
        twitterHandle?: string;
        farcasterUsername?: string;
      };
      metrics?: {
        allPartners?: { followerCount?: number; followingCount?: number };
        comments?: { commentCount30d?: number; commentCountAllTime?: number };
      };
    }>(`/v1/addresses/${encodeURIComponent(identifier)}/profile`);

    if (!data?.id) return null;

    return {
      trader: {
        uid: data.id,
        displayName: data.name,
        username: data.metadata?.twitterHandle || data.metadata?.ensName,
        avatarUrl: data.images?.xs || data.images?.sm || data.images?.raw,
        addresses: data.addresses,
        followerCount: data.metrics?.allPartners?.followerCount,
        followingCount: data.metrics?.allPartners?.followingCount,
      },
      stats: {
        totalPnlUsd: data.metadata?.pnl30d,
        winRate: data.metadata?.winRate30d,
        totalTrades: data.metadata?.tradeCount30d,
        commentCount: data.metrics?.comments?.commentCount30d,
        followerCount: data.metrics?.allPartners?.followerCount,
      },
    };
  } catch (err) {
    console.warn("[Clicker] getTraderProfile failed:", err);
    return null;
  }
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  trader: ClickerTrader;
  chain: string;
  totalPnlUsd?: number;
  roiPercent?: number;
  winRate?: number;
  totalTrades?: number;
  commentCount?: number;
  reason?: { title: string; value: string; format: string };
}

/**
 * Get top traders from V1 leaderboard (section-based, includes "reason" badges).
 * This is the recommended endpoint for leaderboard display.
 */
export async function getLeaderboard(
  chain?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: { limit?: number }
): Promise<{ section: string; title: string; entries: LeaderboardEntry[] }[]> {
  const params = new URLSearchParams();
  if (chain) {
    const nc = normalizeChainForClicker(chain);
    if (nc) params.set("chain", nc);
  }

  const path = `/v1/leaderboard${params.toString() ? `?${params}` : ""}`;

  try {
    const data = await clickerFetch<{
      sections: Array<{
        key: string;
        title: string;
        description?: string;
        commenters: Array<{
          id: string;
          name: string;
          images: { raw?: string; sm?: string; xs?: string };
          addresses?: string[];
          metadata?: {
            ensName?: string;
            twitterHandle?: string;
            farcasterUsername?: string;
            pnl30d?: number;
            roiPercent30d?: number;
            winRate30d?: number;
            tradeCount30d?: number;
            commentCount30d?: number;
          };
          reason?: { title: string; value: string; format: string };
          metrics?: {
            comments?: { commentCount30d?: number };
            allPartners?: { followerCount?: number };
          };
        }>;
      }>;
    }>(path);

    const sections = data?.sections || [];
    return sections.map((section) => ({
      section: section.key,
      title: section.title,
      entries: (section.commenters || []).map((commenter, idx) => ({
        rank: idx + 1,
        trader: {
          uid: commenter.id,
          displayName: commenter.name,
          username: commenter.metadata?.twitterHandle || commenter.metadata?.ensName,
          avatarUrl: commenter.images?.xs || commenter.images?.sm || commenter.images?.raw,
          addresses: commenter.addresses,
          followerCount: commenter.metrics?.allPartners?.followerCount,
        },
        chain: chain || "all",
        totalPnlUsd: commenter.metadata?.pnl30d,
        roiPercent: commenter.metadata?.roiPercent30d,
        winRate: commenter.metadata?.winRate30d,
        totalTrades: commenter.metadata?.tradeCount30d,
        commentCount: commenter.metadata?.commentCount30d,
        reason: commenter.reason,
      })),
    }));
  } catch (err) {
    console.warn("[Clicker] getLeaderboard failed:", err);
    return [];
  }
}

// ─── V2 Leaderboard ────────────────────────────────────────────────────────

/**
 * Get top traders from V2 leaderboard (flat list).
 */
export async function getLeaderboardV2(
  chain?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: { limit?: number; onlyWithComments?: boolean }
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (chain) {
    const nc = normalizeChainForClicker(chain);
    if (nc) params.set("chain", nc);
  }
  if (_options?.limit) params.set("limit", String(_options.limit));
  if (_options?.onlyWithComments) params.set("onlyWithComments", "true");

  const path = `/v2/leaderboard${params.toString() ? `?${params}` : ""}`;

  try {
    const data = await clickerFetch<{
      traders: Array<{
        profile: {
          id: string;
          name: string;
          images: { raw?: string; sm?: string; xs?: string };
          addresses?: string[];
          metadata?: {
            ensName?: string;
            twitterHandle?: string;
            farcasterUsername?: string;
            pnl30d?: number;
            roiPercent30d?: number;
            winRate30d?: number;
            tradeCount30d?: number;
            commentCount30d?: number;
          };
          metrics?: {
            allPartners?: { followerCount?: number };
            comments?: { commentCount30d?: number };
          };
        };
      }>;
    }>(path);

    const traders = data?.traders || [];
    return traders.map((t, idx) => {
      const p = t.profile;
      return {
        rank: idx + 1,
        trader: {
          uid: p.id,
          displayName: p.name,
          username: p.metadata?.twitterHandle || p.metadata?.ensName,
          avatarUrl: p.images?.xs || p.images?.sm || p.images?.raw,
          addresses: p.addresses,
          followerCount: p.metrics?.allPartners?.followerCount,
        },
        chain: chain || "all",
        totalPnlUsd: p.metadata?.pnl30d,
        roiPercent: p.metadata?.roiPercent30d,
        winRate: p.metadata?.winRate30d,
        totalTrades: p.metadata?.tradeCount30d,
        commentCount: p.metadata?.commentCount30d,
      };
    });
  } catch (err) {
    console.warn("[Clicker] getLeaderboardV2 failed:", err);
    return [];
  }
}

// ─── Follow / Unfollow ───────────────────────────────────────────────────────

export async function followTrader(
  addressOrUid: string
): Promise<{ success: boolean }> {
  try {
    const data = await clickerFetch<{ success?: boolean }>(
      `/v1/addresses/${encodeURIComponent(addressOrUid)}/follow`,
      { method: "PUT" }
    );
    return { success: data?.success ?? true };
  } catch (err) {
    console.warn("[Clicker] followTrader failed:", err);
    return { success: false };
  }
}

export async function unfollowTrader(
  addressOrUid: string
): Promise<{ success: boolean }> {
  try {
    const data = await clickerFetch<{ success?: boolean }>(
      `/v1/addresses/${encodeURIComponent(addressOrUid)}/follow`,
      { method: "DELETE" }
    );
    return { success: data?.success ?? true };
  } catch (err) {
    console.warn("[Clicker] unfollowTrader failed:", err);
    return { success: false };
  }
}

// ─── Search Traders ───────────────────────────────────────────────────────────

export async function searchTraders(
  query: string,
  chain?: string
): Promise<ClickerTrader[]> {
  try {
    const params = new URLSearchParams({ q: query });
    if (chain) {
      const nc = normalizeChainForClicker(chain);
      if (nc) params.set("chain", nc);
    }

    const data = await clickerFetch<{
      actors: Array<{
        id: string;
        name: string;
        images: { raw?: string; sm?: string; xs?: string };
        addresses?: string[];
        metadata?: {
          ensName?: string;
          twitterHandle?: string;
          farcasterUsername?: string;
        };
      }>;
    }>(`/v1/search?${params}`);

    return (data?.actors || []).map((a) => ({
      uid: a.id,
      displayName: a.name,
      username: a.metadata?.twitterHandle || a.metadata?.ensName,
      avatarUrl: a.images?.xs || a.images?.sm || a.images?.raw,
      addresses: a.addresses,
    }));
  } catch (err) {
    console.warn("[Clicker] searchTraders failed:", err);
    return [];
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Format a wallet address for display (0x... → 0x1234...abcd) */
export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Format a USD value compactly */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (abs >= 1) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
}

/** Relative time string (e.g. "2h ago", "3d ago") */
export function timeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 12) return `${weeks}w ago`;
  return new Date(timestampMs).toLocaleDateString();
}
