"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// ponytail: gate framer-motion entrance `initial` on client mount + reduced
// motion. Returns false during SSR and the first client render so server HTML
// never paints content at opacity:0; flips true pre-paint on the client
// (isomorphic layout effect -> no flash) unless the user prefers reduced
// motion, in which case entrances stay disabled and content stays visible.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useEntrance(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useIsoLayoutEffect(() => {
    setMounted(true);
  }, []);
  return mounted && !reduce;
}
