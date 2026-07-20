import type { Metadata } from "next";
import type { ReactNode } from "react";

// Authentication is private: functional, but excluded from the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
