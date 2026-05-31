import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, AlertCircle, XCircle, Truck } from "lucide-react";
import { getCustomerOrder, getServerAuthToken } from "@/lib/medusa/customer-server";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

/* ------------------------------------------------------------------ */
/*  Translations (RU primary)                                         */
/* ------------------------------------------------------------------ */

const T = {
  backToCabinet: "В кабинет",
  orderTitle: "Заказ",
  notFound: "Заказ не найден",
  notFoundDesc: "Возможно, он не существует или не принадлежит вашему аккаунту.",
  goToCabinet: "Вернуться в кабинет",
  status: "Статус",
  payment: "Оплата",
  date: "Дата оформления",
  itemsSection: "Товары в заказе",
  quantity: "Кол-во",
  price: "Цена",
  subtotal: "Сумма",
  totalsSection: "Итого",
  itemSubtotal: "Товары",
  shipping: "Доставка",
  tax: "Налог",
  discount: "Скидка",
  total: "Всего",
  shippingAddress: "Адрес доставки",
  billingAddress: "Платёжный адрес",
  noAddress: "Не указан",
  untitledItem: "Товар",
  variant: "Вариант",
} as const;

/* ------------------------------------------------------------------ */
/*  Status helpers (same as cabinet)                                   */
/* ------------------------------------------------------------------ */

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

const ORDER_STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  archived: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  canceled: <XCircle className="w-4 h-4 text-red-500" />,
  requires_action: <AlertCircle className="w-4 h-4 text-orange-500" />,
  processing: <Clock className="w-4 h-4 text-blue-500" />,
  shipped: <Truck className="w-4 h-4 text-blue-500" />,
  delivered: <CheckCircle className="w-4 h-4 text-emerald-500" />,
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  captured: "Оплачен",
  authorized: "Авторизован",
  pending: "Ожидает",
  refunded: "Возвращён",
  partially_refunded: "Частичный возврат",
  canceled: "Отменён",
  requires_action: "Требует действия",
};

function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

function statusIcon(status: string): React.ReactNode {
  return ORDER_STATUS_ICONS[status] ?? <Clock className="w-4 h-4 text-muted-foreground" />;
}

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
    hour: "2-digit",
    minute: "2-digit",
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

interface Address {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  phone?: string | null;
  company?: string | null;
  province?: string | null;
}

function formatAddress(addr: Address | null | undefined): string | null {
  if (!addr) return null;
  const parts: string[] = [];

  const name = [addr.first_name, addr.last_name].filter(Boolean).join(" ");
  if (name) parts.push(name);
  if (addr.company) parts.push(addr.company);
  if (addr.address_1) parts.push(addr.address_1);
  if (addr.address_2) parts.push(addr.address_2);
  const cityRegion = [addr.postal_code, addr.city, addr.province].filter(Boolean).join(", ");
  if (cityRegion) parts.push(cityRegion);
  if (addr.country_code) parts.push(addr.country_code.toUpperCase());
  if (addr.phone) parts.push(addr.phone);

  return parts.join("\n") || null;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  title: string;
  subtitle?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string | null;
  variant?: {
    title?: string | null;
    sku?: string | null;
  } | null;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerAuthToken();
  if (!token) {
    redirect("/login");
  }

  const order = await getCustomerOrder(id);

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-10 text-center max-w-md shadow-sm">
          <Package className="w-12 h-12 text-[#2c211b]/15 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-[#2c211b] mb-2">
            {T.notFound}
          </h1>
          <p className="text-sm text-[#2c211b]/60 mb-6">{T.notFoundDesc}</p>
          <Link
            href="/cabinet"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2f6f78] hover:text-[#2f6f78]/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {T.goToCabinet}
          </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const currencyCode = (order as Record<string, unknown>).currency_code as string | null;
  const items = ((order as Record<string, unknown>).items as OrderItem[]) ?? [];
  const shippingAddress = (order as Record<string, unknown>).shipping_address as Address | null;
  const billingAddress = (order as Record<string, unknown>).billing_address as Address | null;
  const shippingTotal = ((order as Record<string, unknown>).shipping_total as number) ?? 0;
  const taxTotal = ((order as Record<string, unknown>).tax_total as number) ?? 0;
  const discountTotal = ((order as Record<string, unknown>).discount_total as number) ?? 0;
  const subtotal = ((order as Record<string, unknown>).subtotal as number) ?? 0;
  const total = ((order as Record<string, unknown>).total as number) ?? 0;
  const itemTotal = ((order as Record<string, unknown>).item_total as number) ?? 0;
  const displayId = ((order as Record<string, unknown>).display_id as number) ?? 0;
  const orderStatus = ((order as Record<string, unknown>).status as string) ?? "pending";
  const paymentStatus = ((order as Record<string, unknown>).payment_status as string) ?? "pending";
  const createdAt = ((order as Record<string, unknown>).created_at as string) ?? null;

  const shippingAddrStr = formatAddress(shippingAddress);
  const billingAddrStr = formatAddress(billingAddress);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
      <SiteHeader />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        {/* Back link */}
        <Link
          href="/cabinet"
          className="inline-flex items-center gap-2 text-sm text-[#2c211b]/60 hover:text-[#2f6f78] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {T.backToCabinet}
        </Link>

        {/* Order Header */}
        <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#2c211b] tracking-tight">
                {T.orderTitle} #{displayId || id.slice(-8)}
              </h1>
              <p className="text-sm text-[#2c211b]/50 mt-1">
                {formatDate(createdAt)}
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#f4ebe6]/60 rounded-none">
              {statusIcon(orderStatus)}
              <div>
                <p className="text-[10px] font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                  {T.status}
                </p>
                <p className="text-sm font-medium text-[#2c211b]">
                  {statusLabel(orderStatus)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#f4ebe6]/60 rounded-none">
              <CreditCard className="w-4 h-4 text-[#2c211b]/40" />
              <div>
                <p className="text-[10px] font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                  {T.payment}
                </p>
                <p className="text-sm font-medium text-[#2c211b]">
                  {paymentLabel(paymentStatus)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <section className="bg-white rounded-none border border-[#2c211b]/8 shadow-sm mb-6 overflow-hidden">
          <h2 className="px-6 sm:px-8 pt-6 pb-4 text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50">
            {T.itemsSection}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-[#2c211b]/6">
                  <th className="text-left px-6 sm:px-8 py-3 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider w-full">
                    {T.untitledItem}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                    {T.quantity}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                    {T.price}
                  </th>
                  <th className="text-right px-6 sm:px-8 py-3 text-xs font-semibold text-[#2c211b]/50 uppercase tracking-wider">
                    {T.subtotal}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`${
                      idx < items.length - 1 ? "border-b border-[#2c211b]/4" : ""
                    }`}
                  >
                    <td className="px-6 sm:px-8 py-4">
                      <div className="flex items-center gap-4">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-12 rounded-none object-cover border border-[#2c211b]/6"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-none bg-[#f4ebe6] flex items-center justify-center">
                            <Package className="w-5 h-5 text-[#2c211b]/25" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#2c211b]">
                            {item.title || T.untitledItem}
                          </p>
                          {item.variant?.title && (
                            <p className="text-xs text-[#2c211b]/50 mt-0.5">
                              {item.variant.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-[#2c211b]/70">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-[#2c211b]/70 whitespace-nowrap">
                      {formatPrice(item.unit_price, currencyCode)}
                    </td>
                    <td className="px-6 sm:px-8 py-4 text-right font-medium text-[#2c211b] whitespace-nowrap">
                      {formatPrice(item.total, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Addresses */}
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {T.shippingAddress}
            </h2>
            {shippingAddrStr ? (
              <p className="text-sm text-[#2c211b]/70 whitespace-pre-line leading-relaxed">
                {shippingAddrStr}
              </p>
            ) : (
              <p className="text-sm text-[#2c211b]/40 italic">{T.noAddress}</p>
            )}

            {billingAddrStr && billingAddrStr !== shippingAddrStr && (
              <>
                <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mt-6 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {T.billingAddress}
                </h2>
                <p className="text-sm text-[#2c211b]/70 whitespace-pre-line leading-relaxed">
                  {billingAddrStr}
                </p>
              </>
            )}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-none border border-[#2c211b]/8 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#2c211b]/50 mb-4">
              {T.totalsSection}
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-[#2c211b]/60">{T.itemSubtotal}</dt>
                <dd className="text-[#2c211b]">{formatPrice(itemTotal || subtotal, currencyCode)}</dd>
              </div>
              {shippingTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-[#2c211b]/60">{T.shipping}</dt>
                  <dd className="text-[#2c211b]">{formatPrice(shippingTotal, currencyCode)}</dd>
                </div>
              )}
              {taxTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-[#2c211b]/60">{T.tax}</dt>
                  <dd className="text-[#2c211b]">{formatPrice(taxTotal, currencyCode)}</dd>
                </div>
              )}
              {discountTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <dt className="text-red-600">{T.discount}</dt>
                  <dd className="text-red-600">−{formatPrice(discountTotal, currencyCode)}</dd>
                </div>
              )}
              <div className="flex justify-between text-sm pt-3 border-t border-[#2c211b]/8">
                <dt className="font-semibold text-[#2c211b]">{T.total}</dt>
                <dd className="font-semibold text-[#2c211b] text-base">
                  {formatPrice(total, currencyCode)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
