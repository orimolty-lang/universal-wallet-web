/**
 * Per–Privy-user, per–EOA profile storage (name, emoji, avatar) for up to 5 embedded wallets.
 */

export type WalletSlotProfile = {
  displayName: string;
  emoji: string;
  customImage: string | null;
  backgroundColor: string;
};

export function defaultWalletSlotProfile(): WalletSlotProfile {
  return {
    displayName: "Wallet",
    emoji: "🍊",
    customImage: null,
    backgroundColor: "#f97316",
  };
}

const MAP_PREFIX = "omni_wallet_profiles_map_v1";

export function profilesMapStorageKey(userId: string) {
  return `${MAP_PREFIX}_${userId}`;
}

export function readProfilesMap(userId: string): Record<string, WalletSlotProfile> {
  try {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(profilesMapStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, WalletSlotProfile> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      out[k.toLowerCase()] = {
        ...defaultWalletSlotProfile(),
        displayName: typeof o.displayName === "string" ? o.displayName : "Wallet",
        emoji: typeof o.emoji === "string" ? o.emoji : "🍊",
        customImage: typeof o.customImage === "string" ? o.customImage : null,
        backgroundColor: typeof o.backgroundColor === "string" ? o.backgroundColor : "#f97316",
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function writeProfilesMap(userId: string, map: Record<string, WalletSlotProfile>) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(profilesMapStorageKey(userId), JSON.stringify(map));
  } catch {
    // no-op
  }
}

export function getProfileForAddress(userId: string | undefined, address: string | undefined): WalletSlotProfile {
  if (!userId || !address) return defaultWalletSlotProfile();
  const map = readProfilesMap(userId);
  const row = map[address.toLowerCase()];
  return row ? { ...defaultWalletSlotProfile(), ...row } : defaultWalletSlotProfile();
}

export function setProfileForAddress(userId: string, address: string, profile: WalletSlotProfile) {
  const map = readProfilesMap(userId);
  map[address.toLowerCase()] = profile;
  writeProfilesMap(userId, map);
}
