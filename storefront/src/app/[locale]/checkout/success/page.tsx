"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function CheckIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Content (uses useSearchParams, so must be inside Suspense)         */
/* ------------------------------------------------------------------ */

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  const locale = useLocale();
  const t = useTranslations("checkout.success");

  const primaryCta = (
    <Link
      href={`/${locale}/products`}
      className="inline-flex items-center px-10 py-3.5 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
    >
      {t("backToCatalog")}
    </Link>
  );

  const contactCta = (
    <Link
      href={`/${locale}#contacts`}
      className="inline-flex items-center text-xs font-medium tracking-widest uppercase text-[#2f6f78] underline underline-offset-4 hover:text-[#2c211b] transition-colors duration-300"
    >
      {t("contactCta")}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />

      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 lg:py-32">
        {orderNumber ? (
          <div className="w-full max-w-lg mx-auto text-center my-auto">
            {/* Check icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#2f6f78] text-[#2f6f78] mb-8">
              <CheckIcon className="w-10 h-10" />
            </div>
      
            {/* Heading */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase mb-4">
              {t("title")}
            </h1>
      
            <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-8" aria-hidden="true" />
      
            {/* Order number */}
            <p className="text-sm tracking-widest uppercase text-[#2c211b]/60 mb-3">
              {t("orderNumber")}
            </p>
            <p className="font-mono text-lg font-medium text-[#2c211b] mb-8 tracking-tight">
              #{orderNumber}
            </p>
      
            {/* Confirmation note */}
            <p className="text-sm leading-relaxed text-[#2c211b]/60 max-w-sm mx-auto mb-8">
              {t("confirmation")}
            </p>
      
            {/* What's next */}
            <div className="max-w-sm mx-auto text-left mb-12 border-t border-[#2c211b]/10 pt-6">
              <p className="text-xs tracking-widest uppercase text-[#2c211b]/60 mb-3">
                {t("nextTitle")}
              </p>
              <ul className="space-y-2 text-sm leading-relaxed text-[#2c211b]/60">
                <li>{t("nextContact")}</li>
                <li>{t("nextProcessing")}</li>
                <li>{t("nextSupport")}</li>
              </ul>
            </div>
      
            {/* CTAs */}
            <div className="flex flex-col items-center gap-5">
              {primaryCta}
              {contactCta}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg mx-auto text-center my-auto">
            {/* Heading */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase mb-4">
              {t("missingTitle")}
            </h1>
      
            <div className="w-16 h-0.5 bg-[#2c211b]/20 mx-auto mb-8" aria-hidden="true" />
      
            {/* Description */}
            <p className="text-sm leading-relaxed text-[#2c211b]/60 max-w-sm mx-auto mb-12">
              {t("missingDesc")}
            </p>
      
            {/* CTAs */}
            <div className="flex flex-col items-center gap-5">
              {contactCta}
              {primaryCta}
            </div>
          </div>
        )}
      </div>

      <SiteFooter locale={locale} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export                                                        */
/* ------------------------------------------------------------------ */

export default function CheckoutSuccessPage() {
  const locale = useLocale();
  const t = useTranslations("checkout");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
          <SiteHeader />
          <div className="flex-1 flex items-center justify-center"
          role="status"
          aria-live="polite">
            <div
              className="w-20 h-20 rounded-full border-2 border-[#2f6f78] animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span className="sr-only">{t("loading")}</span>
          </div>
          <SiteFooter locale={locale} />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
