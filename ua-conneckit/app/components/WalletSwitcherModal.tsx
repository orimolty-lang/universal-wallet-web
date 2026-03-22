"use client";

import BottomSheet from "../../components/BottomSheet";
import { MAX_PRIVY_EMBEDDED_WALLETS, useWalletAppearance } from "@/app/lib/connectkit-compat";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WalletSwitcherModal({ isOpen, onClose }: Props) {
  const {
    embeddedWalletRows,
    switchWallet,
    createAdditionalWallet,
    canCreateWallet,
    isCreatingWallet,
  } = useWalletAppearance();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} dark>
      <div className="px-4 pb-8 max-h-[min(78vh,560px)] overflow-y-auto">
        <h2 className="text-white text-xl font-bold mb-1 text-center pt-1 pb-3 border-b border-[#252525]">
          Your wallets
        </h2>
        <p className="text-gray-500 text-xs text-center mb-4">
          Up to {MAX_PRIVY_EMBEDDED_WALLETS} embedded wallets. Each has its own Omni profile, UA, and balances.
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {embeddedWalletRows.map((row) => (
            <button
              key={row.address}
              type="button"
              onClick={() => {
                switchWallet(row.address);
                onClose();
              }}
              className={`flex items-center gap-3 w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                row.isActive
                  ? "border-accent-dynamic bg-accent-dynamic/10"
                  : "border-[#333] bg-[#1a1a1a] hover:bg-[#252525]"
              }`}
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
