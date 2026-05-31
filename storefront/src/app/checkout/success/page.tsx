"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 lg:py-32">
        <div className="w-full max-w-lg mx-auto text-center my-auto">
          {/* Check icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#2f6f78] text-[#2f6f78] mb-8">
            <CheckIcon className="w-10 h-10" />
          </div>

          {/* Heading */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase mb-4">
            СПАСИБО ЗА ЗАКАЗ!
          </h1>

          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-8" />

          {/* Order ID */}
          {orderId ? (
            <p className="text-sm tracking-widest uppercase text-[#2c211b]/60 mb-3">
              НОМЕР ЗАКАЗА
            </p>
          ) : null}
          {orderId ? (
            <p className="font-mono text-lg font-medium text-[#2c211b] mb-8 tracking-tight">
              {orderId}
            </p>
          ) : (
            <p className="font-mono text-lg font-medium text-[#2c211b] mb-8 tracking-tight">
              —
            </p>
          )}

          {/* Confirmation note */}
          <p className="text-sm leading-relaxed text-[#2c211b]/60 max-w-sm mx-auto mb-12">
            Подтверждение заказа и детали доставки отправлены на вашу
            электронную почту.
          </p>

          {/* CTA */}
          <Link
            href="/products"
            className="inline-flex items-center px-10 py-3.5 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
          >
            ВЕРНУТЬСЯ В КАТАЛОГ
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export                                                        */
/* ------------------------------------------------------------------ */

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
          <SiteHeader />
          <main className="flex-1 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#2f6f78] animate-pulse" />
          </main>
          <SiteFooter />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
