"use client";

export type WalletActivityToastKind = "copied" | "send" | "converted" | "deposited";

type Props = {
  payload: { kind: WalletActivityToastKind; key: number } | null;
};

export default function WalletActivityToast({ payload }: Props) {
  if (!payload) return null;
  const { kind, key } = payload;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[250] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div
        key={key}
        className="pointer-events-auto flex max-w-[min(100%,22rem)] items-center gap-2 rounded-full border border-white/12 bg-black/90 px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-200"
      >
        {kind === "copied" && <span>Copied!</span>}
        {kind === "send" && (
          <>
            <span className="text-lg leading-none" aria-hidden>
              ✈️
            </span>
            <span>Confirmed</span>
          </>
        )}
        {(kind === "converted" || kind === "deposited") && (
          <>
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
              aria-hidden
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                <path
                  className="wallet-toast-check-stroke"
                  d="M3 7.2 5.8 10 11 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{kind === "converted" ? "Converted" : "Deposited"}</span>
          </>
        )}
      </div>
    </div>
  );
}
