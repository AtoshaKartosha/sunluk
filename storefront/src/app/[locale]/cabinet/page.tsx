import { redirect } from "next/navigation";
import Link from "next/link";
import { User, ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCustomer, getCustomerOrders } from "@/lib/medusa/customer-server";
import { LogoutButton } from "./LogoutButton";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

/* ------------------------------------------------------------------ */
/*  Status helpers                                                    */
/* ------------------------------------------------------------------ */

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  archived: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  canceled: <XCircle className="w-4 h-4 text-red-500" />,
  requires_action: <AlertCircle className="w-4 h-4 text-orange-500" />,
  processing: <Clock className="w-4 h-4 text-blue-500" />,
  shipped: <CheckCircle className="w-4 h-4 text-blue-500" />,
  delivered: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  received: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  confirmed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  declined: <XCircle className="w-4 h-4 text-red-500" />,
};

function statusIcon(status: string): React.ReactNode {
  return ORDER_STATUS_ICONS[status] ?? <Clock className="w-4 h-4 text-muted-foreground" />;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !currency) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function CabinetPage({
  params,
}: {
  params: Promise<{ locale: string; id?: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "cabinet" });
  const ts = await getTranslations({ locale, namespace: "cabinet.orderStatus" });
  const tp = await getTranslations({ locale, namespace: "cabinet.paymentStatus" });

  function statusLabel(status: string): string {
    return ts(status as Parameters<typeof ts>[0]) ?? status;
  }

  function paymentLabel(status: string): string {
    return tp(status as Parameters<typeof tp>[0]) ?? status;
  }

  const customer = await getCustomer();
  if (!customer) {
    redirect(`/${locale}/login`);
  }

  const ordersResult = await getCustomerOrders(20, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
      <SiteHeader />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#2c211b] tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-[#2c211b]/60 mt-1">
              {t("greeting")},{" "}
              <span className="font-medium text-[#2c211b]/80">
                {customer.first_name || customer.last_name
                  ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
                  : t("noName")}
              </span>
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Profile Card */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mb-4">
            {t("profileSection")}
          </h2>
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#2c211b]/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#2c211b]/50 uppercase tracking-wide mb-0.5">
                    {t("nameLabel")}
                  </p>
                  <p className="text-sm font-medium text-[#2c211b]">
                    {customer.first_name || customer.last_name
                      ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
                      : t("noName")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#2c211b]/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-[#2c211b]/50 uppercase tracking-wide mb-0.5">
                    {t("emailLabel")}
                  </p>
                  <p className="text-sm font-medium text-[#2c211b]">
                    {customer.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Orders Section */}
        <section>
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mb-4">
            {t("ordersSection")}
          </h2>
          {!ordersResult || ordersResult.orders.length === 0 ? (
            <div className="bg-white rounded-none border border-[#2c211b]/8 p-12 text-center shadow-sm">
              <ShoppingBag className="w-12 h-12 text-[#2c211b]/15 mx-auto mb-4" />
              <p className="text-sm text-[#2c211b]/60 mb-4">{t("noOrders")}</p>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2f6f78] hover:text-[#2f6f78]/80 transition-colors"
              >
                {t("browseCatalog")}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-none border border-[#2c211b]/8 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2c211b]/6">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {t("orderId")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {t("date")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {t("status")}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {t("payment")}
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {t("total")}
                      </th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {ordersResult.orders.map((order, idx) => (
                      <tr
                        key={order.id}
                        className={`border-b border-[#2c211b]/4 hover:bg-[#f4ebe6]/40 transition-colors ${
                          idx === ordersResult.orders.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium text-[#2c211b]">
                            #{order.display_id ?? order.id.slice(-8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#2c211b]/70 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {statusIcon(order.status)}
                            <span className="text-[#2c211b]/80">
                              {statusLabel(order.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#2c211b]/70">
                            {paymentLabel(order.payment_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[#2c211b] whitespace-nowrap">
                          {formatPrice(order.total, order.currency_code)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/${locale}/cabinet/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#2f6f78] hover:text-[#2f6f78]/80 transition-colors"
                          >
                            {t("viewDetails")}
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ordersResult.count > 20 && (
                <div className="px-6 py-4 text-center text-xs text-[#2c211b]/50 border-t border-[#2c211b]/6">
                  Показаны последние 20 из {ordersResult.count} заказов
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
