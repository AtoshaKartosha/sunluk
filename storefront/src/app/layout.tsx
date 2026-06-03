import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const montserratSerif = Montserrat({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const fontClasses = `${montserrat.variable} ${montserratSerif.variable} ${geistMono.variable}`;

export const metadata: Metadata = {
  title: "SUNLUK — Аксессуары для очков",
  description:
    "Аксессуары для очков, которые становятся частью вашего стиля. SUNLUK — меняй себя, выражай себя.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
