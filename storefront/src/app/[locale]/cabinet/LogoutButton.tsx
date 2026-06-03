"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { LogOut, Loader2 } from "lucide-react";
import { logoutCustomer, removeAuthCookie } from "@/lib/medusa/customer";

export function LogoutButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("cabinet");
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logoutCustomer();
    } catch {
      // proceed with local cleanup even if remote logout fails
    }
    removeAuthCookie();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2c211b]/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      {t("logout")}
    </button>
  );
}
