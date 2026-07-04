import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { PathnameHistoryTracker } from "@/components/navigation/pathname-history";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "../globals.css";

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

/* ------------------------------------------------------------------ */
/*  Locale layout                                                      */
/* ------------------------------------------------------------------ */

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};


export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for the locale
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontClasses} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <PathnameHistoryTracker />
            <main className="flex-1">{children}</main>
            <CartDrawer />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
