"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

export let previousPathname: string | null = null;

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && routing.locales.includes(firstSegment as Locale)) {
    return `/${segments.slice(1).join("/")}`;
  }

  return pathname;
}

export function PathnameHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    previousPathname = pathname;
  }, [pathname]);

  return null;
}
