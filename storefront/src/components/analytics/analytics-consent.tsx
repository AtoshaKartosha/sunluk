"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export const ANALYTICS_CONSENT_STORAGE_KEY = "sunluk_analytics_consent";
export const METRIKA_COUNTER_ID = 111719197;
export const METRIKA_TAG_SRC = "https://mc.yandex.ru/metrika/tag.js?id=111719197";
export const REOPEN_ANALYTICS_EVENT = "sunluk:reopen-analytics-consent";

export type ConsentState = "unknown" | "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    ym?: {
      (...args: unknown[]): void;
      a?: unknown[][];
      l?: number;
    };
  }
}

export function getStoredConsent(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (val === "granted" || val === "denied") {
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  } catch {
    // Graceful fallback for restricted storage environments
  }
}

export function clearYandexStorage(): void {
  if (typeof window === "undefined") return;

  // Clear localStorage keys starting with _ym
  try {
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("_ym")) {
        localKeysToRemove.push(key);
      }
    }
    for (const key of localKeysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Restricted storage
  }

  // Clear sessionStorage keys starting with _ym
  try {
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("_ym")) {
        sessionKeysToRemove.push(key);
      }
    }
    for (const key of sessionKeysToRemove) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Restricted storage
  }

  // Clear accessible cookies starting with _ym or named gdpr
  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    const host = window.location.hostname;
    const hostParts = host.split(".");
    const domains = [
      "",
      `; domain=${host}`,
      `; domain=.${host}`,
      ...(hostParts.length > 1 ? [`; domain=.${hostParts.slice(-2).join(".")}`] : []),
    ];

    for (const cookie of cookies) {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("_ym") || name === "gdpr") {
        for (const domain of domains) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
        }
      }
    }
  } catch {
    // Cookie access restricted
  }
}

let isMetrikaInitialized = false;

export function initMetrika(counterId = METRIKA_COUNTER_ID): void {
  if (typeof window === "undefined") return;
  if (isMetrikaInitialized) return;

  // dataLayer container
  window.dataLayer = window.dataLayer || [];

  // ym stub queue
  window.ym =
    window.ym ||
    function (...args: unknown[]) {
      (window.ym!.a = window.ym!.a || []).push(args);
    };
  window.ym.l = 1 * new Date().getTime();

  // Inject tag.js script tag if not already injected
  if (!document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = METRIKA_TAG_SRC;
    script.onerror = () => {
      // Script failure is non-blocking; do not throw or misreport consent
    };
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  // Init counter with approved configuration
  window.ym(counterId, "init", {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: "dataLayer",
    ssr: true,
  });

  isMetrikaInitialized = true;
}

export function destructMetrika(counterId = METRIKA_COUNTER_ID): void {
  if (typeof window === "undefined") return;
  if (isMetrikaInitialized) {
    try {
      if (typeof window.ym === "function") {
        window.ym(counterId, "destruct");
      }
    } catch {
      // Safe no-op on failure
    }
  }
  isMetrikaInitialized = false;
  clearYandexStorage();
}

export function hitMetrika(
  url: string,
  referer?: string,
  counterId = METRIKA_COUNTER_ID
): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.ym === "function") {
      window.ym(counterId, "hit", url, {
        title: typeof document !== "undefined" ? document.title : "",
        referer: referer ?? (typeof document !== "undefined" ? document.referrer : undefined),
      });
    }
  } catch {
    // Safe no-op on failure
  }
}

export function openAnalyticsConsentSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REOPEN_ANALYTICS_EVENT));
}

export function resetMetrikaStateForTesting(): void {
  isMetrikaInitialized = false;
}

function RouteHitTracker({ consent }: { consent: ConsentState }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastHitUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "granted") {
      lastHitUrlRef.current = null;
      return;
    }

    // Ensure counter is initialized before hit
    initMetrika();

    const search = searchParams?.toString();
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : search
          ? `${pathname}?${search}`
          : pathname;

    if (currentUrl && currentUrl !== lastHitUrlRef.current) {
      const prevUrl = lastHitUrlRef.current;
      lastHitUrlRef.current = currentUrl;
      hitMetrika(
        currentUrl,
        prevUrl || (typeof document !== "undefined" ? document.referrer : undefined)
      );
    }
  }, [pathname, searchParams, consent]);

  return null;
}

const emptySubscribe = () => () => {};

export function AnalyticsConsent() {
  const t = useTranslations("analytics");
  const locale = useLocale();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [consent, setConsent] = useState<ConsentState>(() => getStoredConsent() ?? "unknown");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    function handleReopen() {
      setSettingsOpen(true);
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === ANALYTICS_CONSENT_STORAGE_KEY) {
        if (e.newValue === "granted") {
          setConsent("granted");
          initMetrika();
        } else if (e.newValue === "denied") {
          setConsent("denied");
          destructMetrika();
        } else {
          setConsent("unknown");
          destructMetrika();
        }
      }
    }

    window.addEventListener(REOPEN_ANALYTICS_EVENT, handleReopen);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(REOPEN_ANALYTICS_EVENT, handleReopen);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleAccept = useCallback(() => {
    setStoredConsent("granted");
    setConsent("granted");
    setSettingsOpen(false);
    initMetrika();
  }, []);

  const handleReject = useCallback(() => {
    setStoredConsent("denied");
    setConsent("denied");
    setSettingsOpen(false);
    destructMetrika();
  }, []);

  const handleClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const isOpen = consent === "unknown" || settingsOpen;
  const isReopened = consent !== "unknown";
  return (
    <>
      <Suspense fallback={null}>
        <RouteHitTracker consent={consent} />
      </Suspense>

      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-desc"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-3xl mx-auto bg-[#f4ebe6] border border-[#2c211b]/15 shadow-2xl rounded-sm p-5 sm:p-6 pointer-events-auto text-[#2c211b]">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="analytics-consent-title"
                  className="font-serif text-lg sm:text-xl font-medium tracking-wide uppercase text-[#2c211b]"
                >
                  {isReopened ? t("settingsTitle") : t("title")}
                </h2>
                {isReopened && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-[#2c211b]/60 hover:text-[#2c211b] p-1 transition-colors"
                    aria-label={t("close")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <p id="analytics-consent-desc" className="text-xs sm:text-sm text-[#2c211b]/80 leading-relaxed">
                {isReopened ? t("settingsDescription") : t("description")}{" "}
                <Link
                  href={`/${locale}/info#privacy`}
                  className="text-[#2f6f78] underline hover:text-[#275c64] transition-colors ml-1"
                >
                  {t("privacyPolicy")}
                </Link>
              </p>

              {isReopened && (
                <div className="text-xs font-medium text-[#2c211b]/70">
                  {consent === "granted" ? t("statusGranted") : t("statusDenied")}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-5 py-2.5 text-xs font-medium tracking-wider uppercase border border-[#2c211b]/30 text-[#2c211b] hover:bg-[#2c211b]/5 transition-colors rounded-sm text-center"
                >
                  {isReopened && consent === "granted" ? t("withdraw") : t("reject")}
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="px-5 py-2.5 text-xs font-medium tracking-wider uppercase bg-[#2f6f78] text-white hover:bg-[#275c64] transition-colors rounded-sm text-center"
                >
                  {isReopened && consent === "granted" ? t("grant") : t("accept")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AnalyticsConsentSettingsButton({
  className = "hover:text-[#2f6f78] transition-colors text-left",
}: {
  className?: string;
}) {
  const t = useTranslations("analytics");

  return (
    <button
      type="button"
      onClick={openAnalyticsConsentSettings}
      className={className}
    >
      {t("manage")}
    </button>
  );
}
