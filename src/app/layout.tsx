import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
  weight: ["300", "400", "500", "600"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Occasions – Nie wieder einen Anlass vergessen",
  description: "Dein persönliches Netzwerk für Geburtstage, Jubiläen und besondere Momente",
  themeColor: "#c4704a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
