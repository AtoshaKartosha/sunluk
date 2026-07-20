import type { Metadata } from "next";
import type { ReactNode } from "react";

// Checkout is transactional: functional, but excluded from the search index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
