import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tribeapp.wtf — Hyperlocal Social Network",
  description: "tribeapp.wtf is the consumer-facing Tribe web client — a hyperlocal social network on Solana. Identity on chain, content in a hub mesh, end-to-end encrypted DMs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
