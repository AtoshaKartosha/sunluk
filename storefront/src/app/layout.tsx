import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
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
    <html
      lang="ru"
      className={`${montserrat.variable} ${montserratSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <main className="flex-1">{children}</main>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
