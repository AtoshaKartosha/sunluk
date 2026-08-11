"use client";

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import type { StoreCart, StoreCartLineItem } from "@/components/cart/types";
import { getPackagingName } from "@/lib/medusa/packaging-names";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ponytail: duplicated from PriceDisplay.tsx to avoid complex import chain
function formatPrice(amount: number | null | undefined, currency: string, locale?: string): string {
  if (amount == null) return "—";
  try {
    const bcp47 = locale === "en" ? "en-US" : "ru-RU";
    return new Intl.NumberFormat(bcp47, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}


function lineItemOptionLabel(item: StoreCartLineItem, materialNames?: Record<string, string>): string | null {
  const options = item.variant?.options;
  if (!options || options.length === 0) return null;
  return options
    .map((o) => (materialNames?.[o.value] ?? materialNames?.[o.value?.toLowerCase?.()] ?? o.value))
    .filter(Boolean)
    .join(" / ");
}

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring" as const, damping: 26, stiffness: 280, mass: 0.6 },
  },
  exit: {
    x: "100%",
    transition: { type: "spring" as const, damping: 26, stiffness: 300, mass: 0.6 },
  },
};

// ---------------------------------------------------------------------------
// CartDrawer
// ---------------------------------------------------------------------------

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    updateItem,
    removeItem,
    mutating,
    itemCount,
  } = useCart();
  const locale = useLocale();
  const t = useTranslations("cart");

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const currency = cart?.currency_code ?? "dkk";

  const handleUpdate = useCallback(
    (lineItemId: string, qty: number) => {
      updateItem(lineItemId, qty);
    },
    [updateItem],
  );

  const handleRemove = useCallback(
    (lineItemId: string) => {
      removeItem(lineItemId);
    },
    [removeItem],
  );

  const items = cart?.items ?? [];
  const mainItems = items.filter((item) => {
    const parentId = item.metadata?.parent_line_item_id;
    if (!parentId) return true;
    return !items.some((i) => i.id === parentId);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="cart-overlay"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="cart-panel"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[#faf8f5] shadow-2xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
          >
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between border-b border-[#2c211b]/10 px-5 py-4">
              <h2 className="font-serif text-lg font-medium tracking-wide text-[#2c211b]">
                {t("title")}
                {itemCount > 0 && (
                  <span className="ml-2 text-sm text-[#2c211b]/50">
                    ({itemCount})
                  </span>
                )}
              </h2>
              <button
                onClick={closeCart}
                className="p-2 text-[#2c211b]/60 transition-colors hover:bg-[#2c211b]/5 hover:text-[#2c211b]"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ---- Body ---- */}
            <div className="flex-1 overflow-y-auto">
              {mainItems.length === 0 ? (
                <EmptyState />
              ) : (
                <ul className="divide-y divide-[#2c211b]/5">
                  {mainItems.map((item) => {
                    const linkedItems = items.filter(
                      (i) => i.metadata?.parent_line_item_id === item.id
                    );
                    return (
                      <CartLineItem
                        key={item.id}
                        item={item}
                        linkedItems={linkedItems}
                        currency={currency}
                        disabled={mutating}
                        onUpdate={handleUpdate}
                        onRemove={handleRemove}
                      />
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ---- Footer ---- */}
            {mainItems.length > 0 && (
              <CartFooter
                cart={cart as StoreCart | null}
                currency={currency}
                disabled={mutating}
                locale={locale}
                closeCart={closeCart}
              />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const t = useTranslations("cart");
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <ShoppingBag className="mb-4 h-12 w-12 text-[#2c211b]/20" strokeWidth={1} />
      <p className="text-sm font-medium tracking-wide text-[#2c211b]/40">
        {t("emptyTitle")}
      </p>
      <p className="mt-1 text-xs text-[#2c211b]/30">
        {t("emptyDesc")}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line item
// ---------------------------------------------------------------------------

interface CartLineItemProps {
  item: StoreCartLineItem;
  linkedItems?: StoreCartLineItem[];
  currency: string;
  disabled: boolean;
  onUpdate: (lineItemId: string, quantity: number) => void;
  onRemove: (lineItemId: string) => void;
}

function CartLineItem({
  item,
  linkedItems = [],
  currency,
  disabled,
  onUpdate,
  onRemove,
}: CartLineItemProps) {
  const pt = useTranslations("product");
  const t = useTranslations("cart");
  const locale = useLocale();
  const thumbnail = item.thumbnail;
  const unitPrice = item.unit_price;
  const calcPrice = item.metadata?.calculated_price;
  const hasDiscount =
    calcPrice?.original_amount != null &&
    calcPrice.currency_code === currency &&
    calcPrice.original_amount > item.unit_price;
  const packagingTotal = linkedItems.reduce((sum, li) => sum + (li.unit_price ?? 0), 0);
  const rowTotal = ((unitPrice ?? 0) + packagingTotal) * item.quantity;
  const materialNames: Record<string, string> = {
    Azure: pt("azure"),
    Dune: pt("dune"),
    Luna: pt("luna"),
    Silk: pt("silk"),
    Amethyst: pt("amethyst"),
    Lagoon: pt("lagoon")
  };
  const optionLabel = lineItemOptionLabel(item, materialNames);
  // Use the line-item snapshot (set with the locale at add time, so it
  // carries the Medusa translation) as the source of truth, with the
  // explicit handle map as the primary override. The product join's
  // title is the last-resort fallback because Medusa's cart expand
  // doesn't apply x-medusa-locale to it.
  const decrement = () => {
    if (item.quantity <= 1) return;
    onUpdate(item.id, item.quantity - 1);
  };

  const increment = () => {
    onUpdate(item.id, item.quantity + 1);
  };

  return (
    <li className="flex gap-4 px-5 py-4">
      {/* Thumbnail */}
      {thumbnail ? (
        <ProductImage
          src={thumbnail}
          alt={item.title || "Product thumbnail"}
          width={80}
          height={80}
          unoptimized
          className="h-20 w-20 flex-shrink-0 border border-[#2c211b]/10 object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center border border-[#2c211b]/10 bg-[#2c211b]/3">
          <ShoppingBag className="h-6 w-6 text-[#2c211b]/15" />
        </div>
      )}

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium leading-snug text-[#2c211b]">
            {item.product?.title ?? item.title}
          </h3>
          {item.subtitle && (
            <p className="mt-0.5 text-xs text-[#2c211b]/50">{item.subtitle}</p>
          )}
          {optionLabel && (
            <p className="mt-0.5 text-xs text-[#2c211b]/40">{optionLabel}</p>
          )}
          {unitPrice != null && (
            <div className="mt-1 flex items-baseline gap-1.5 text-xs text-[#2c211b]/70">
              {hasDiscount && (
                <span className="line-through text-[#2c211b]/40">
                  {formatPrice(calcPrice.original_amount! * item.quantity, currency, locale)}
                </span>
              )}
              <span className="font-medium">
                {formatPrice(unitPrice * item.quantity, currency, locale)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] font-bold text-[#b85c3a]">
                  −{Math.round((1 - unitPrice / calcPrice.original_amount!) * 100)}%
                </span>
              )}
            </div>
          )}
          {linkedItems.map((linkedItem) => {
            const linkedName = getPackagingName(linkedItem.product, locale, linkedItem.title);
            return (
              <div key={linkedItem.id} className="mt-1.5 flex items-center gap-1.5 text-xs text-[#2c211b]/60">
                <span className="font-medium text-[#2f6f78]">
                  + {linkedName}
                </span>
                <span className="text-[#2c211b]/40">
                  ({linkedItem.unit_price === 0 || !linkedItem.unit_price
                    ? pt("packaging.free").toLowerCase()
                    : `+ ${formatPrice(linkedItem.unit_price * item.quantity, currency, locale)}`})
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-0.5 border border-[#2c211b]/15 bg-white">
            <button
              onClick={decrement}
              disabled={disabled || item.quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-[#2c211b]/60 transition-colors hover:text-[#2c211b] disabled:opacity-30"
              aria-label={t("decrease")}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-8 min-w-[2rem] items-center justify-center text-sm font-medium tabular-nums text-[#2c211b]">
              {item.quantity}
            </span>
            <button
              onClick={increment}
              disabled={disabled}
              className="flex h-8 w-8 items-center justify-center text-[#2c211b]/60 transition-colors hover:text-[#2c211b] disabled:opacity-30"
              aria-label={t("increase")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Combined row total */}
            <span className="text-sm font-semibold tabular-nums text-[#2c211b]">
              {unitPrice != null ? formatPrice(rowTotal, currency, locale) : "—"}
            </span>
            {/* Remove */}
            <button
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              className="p-1 text-[#2c211b]/30 transition-colors hover:bg-[#2c211b]/5 hover:text-destructive disabled:opacity-30"
              aria-label={`${t("remove")} ${item.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Footer: totals + CTA
// ---------------------------------------------------------------------------

interface CartFooterProps {
  cart: StoreCart | null;
  currency: string;
  disabled: boolean;
  locale: string;
  closeCart: () => void;
}
function CartFooter({ cart, currency, disabled, locale, closeCart }: CartFooterProps) {
  const t = useTranslations("cart");

  if (!cart) return null;

  const subtotal = cart.subtotal;
  const taxTotal = cart.tax_total;
  const shippingTotal = cart.shipping_total;
  const discountTotal = cart.discount_total;
  const total = cart.total;

  const rows: { label: string; value: number | null | undefined; positive?: boolean }[] = [];

  rows.push({ label: t("subtotal"), value: subtotal });

  if (discountTotal != null && discountTotal !== 0) {
    rows.push({ label: t("discount"), value: discountTotal, positive: false });
  }

  if (taxTotal != null && taxTotal !== 0) {
    rows.push({ label: t("tax"), value: taxTotal });
  }

  if (shippingTotal != null) {
    rows.push({ label: t("shipping"), value: shippingTotal });
  }

  return (
    <div className="border-t border-[#2c211b]/10 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Totals */}
      <div className="space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-[#2c211b]/60">{row.label}</span>
            <span
              className={cn(
                "tabular-nums text-[#2c211b]",
                row.positive === false && "text-destructive",
              )}
            >
              {row.value != null
                ? `${row.positive === false ? "−" : ""}${formatPrice(
                    row.positive === false ? Math.abs(row.value) : row.value,
                    currency,
                    locale,
                  )}`
                : "—"}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[#2c211b]/10 pt-2 text-base font-semibold">
          <span className="text-[#2c211b]">{t("total")}</span>
          <span className="tabular-nums text-[#2c211b]">
            {total != null ? formatPrice(total, currency, locale) : "—"}
          </span>
        </div>
      </div>

      <Link
        href={`/${locale}/products`}
        onClick={closeCart}
        className="mt-4 flex w-full items-center justify-center px-6 py-3 text-sm font-medium tracking-widest uppercase text-[#2c211b] transition-colors hover:bg-[#2c211b]/5"
      >
        {t("continueShopping")}
      </Link>
      {/* CTA */}
      <Link
        href={`/${locale}/checkout`}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          closeCart();
        }}
        className={cn(
          "mt-4 flex w-full items-center justify-center px-6 py-3 text-sm font-medium tracking-widest uppercase transition-all duration-300",
          "bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2c211b]/90 active:scale-[0.98]",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {t("checkout")}
      </Link>
    </div>
  );
}
