import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Occasions – Nie wieder einen Anlass vergessen",
  description: "Dein persönliches Netzwerk für Geburtstage, Jubiläen und besondere Momente",
  themeColor: "#c4704a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full"><Providers>{children}</Providers></body>
    </html>
  );
}
