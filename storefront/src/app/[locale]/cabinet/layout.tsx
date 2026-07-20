import type { Metadata } from "next";
import type { ReactNode } from "react";

// Cabinet and order details are private: functional, but excluded from the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return children;
}
