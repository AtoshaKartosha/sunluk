import type { Metadata } from "next";
import type { ReactNode } from "react";

// Registration is private: functional, but excluded from the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
