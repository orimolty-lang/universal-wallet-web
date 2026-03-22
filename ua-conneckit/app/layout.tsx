import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ParticleConnectkit } from "./components/ParticleProvider";
import { WalletVisibilityProvider } from "./context/WalletVisibilityContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "OMNI - Universal Wallet",
  description: "One Balance. Any Chain. Trade Tokens & Perps. Call Contracts.",
  icons: {
    icon: [
      { url: '/universal-wallet-web/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/universal-wallet-web/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/universal-wallet-web/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/universal-wallet-web/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OMNI',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#0a0a0a]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a]`}
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <WalletVisibilityProvider>
          <ParticleConnectkit>{children}</ParticleConnectkit>
        </WalletVisibilityProvider>
      </body>
    </html>
  );
}
