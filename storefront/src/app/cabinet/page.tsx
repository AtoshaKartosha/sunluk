import { redirect } from "next/navigation";
import Link from "next/link";
import { User, ChevronRight, Clock, CheckCircle, AlertCircle, XCircle, ShoppingBag } from "lucide-react";
import { getCustomer, getCustomerOrders } from "@/lib/medusa/customer-server";
import { LogoutButton } from "./LogoutButton";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

/* ------------------------------------------------------------------ */
/*  Translations (RU primary)                                         */
/* ------------------------------------------------------------------ */
const T = {
  title: "Личный кабинет",
  greeting: "Здравствуйте",
  profileSection: "Профиль",
  emailLabel: "Email",
  nameLabel: "Имя",
  noName: "Не указано",
  ordersSection: "Мои заказы",
  noOrders: "У вас пока нет заказов.",
  browseCatalog: "Перейти в каталог",
  orderId: "Заказ №",
  date: "Дата",
  status: "Статус",
  payment: "Оплата",
  total: "Сумма",
  viewDetails: "Подробнее",
} as const;

/* ------------------------------------------------------------------ */
/*  Status helpers                                                    */
/* ------------------------------------------------------------------ */

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  archived: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  canceled: <XCircle className="w-4 h-4 text-red-500" />,
  requires_action: <AlertCircle className="w-4 h-4 text-orange-500" />,
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  completed: "Завершён",
  archived: "Архивирован",
  canceled: "Отменён",
  requires_action: "Требует действия",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
};

function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function statusIcon(status: string): React.ReactNode {
  return ORDER_STATUS_ICONS[status] ?? <Clock className="w-4 h-4 text-muted-foreground" />;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  captured: "Оплачен",
  authorized: "Авторизован",
  pending: "Ожидает",
  refunded: "Возвращён",
  partially_refunded: "Частичный возврат",
  canceled: "Отменён",
  requires_action: "Требует действия",
};

function paymentLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
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

export default async function CabinetPage() {
  const customer = await getCustomer();
  if (!customer) {
    redirect("/login");
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
              {T.title}
            </h1>
            <p className="text-sm text-[#2c211b]/60 mt-1">
              {T.greeting},{" "}
              <span className="font-medium text-[#2c211b]/80">
                {customer.first_name || customer.last_name
                  ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
                  : T.noName}
              </span>
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Profile Card */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mb-4">
            {T.profileSection}
          </h2>
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#2c211b]/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[#2c211b]/50 uppercase tracking-wide mb-0.5">
                    {T.nameLabel}
                  </p>
                  <p className="text-sm font-medium text-[#2c211b]">
                    {customer.first_name || customer.last_name
                      ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
                      : T.noName}
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
                    {T.emailLabel}
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
            {T.ordersSection}
          </h2>
          {!ordersResult || ordersResult.orders.length === 0 ? (
            <div className="bg-white rounded-none border border-[#2c211b]/8 p-12 text-center shadow-sm">
              <ShoppingBag className="w-12 h-12 text-[#2c211b]/15 mx-auto mb-4" />
              <p className="text-sm text-[#2c211b]/60 mb-4">{T.noOrders}</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2f6f78] hover:text-[#2f6f78]/80 transition-colors"
              >
                {T.browseCatalog}
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
                        {T.orderId}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {T.date}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {T.status}
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {T.payment}
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                        {T.total}
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
                            href={`/cabinet/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#2f6f78] hover:text-[#2f6f78]/80 transition-colors"
                          >
                            {T.viewDetails}
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
      <SiteFooter />
    </div>
  );
}
