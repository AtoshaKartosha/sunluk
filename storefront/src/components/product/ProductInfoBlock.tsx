"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocale } from "next-intl";
import type { StoreProduct, CalculatedPrice, ProductVariant, StockInfo } from "./types";
import { PriceDisplay, formatPriceValue } from "./PriceDisplay";
import { VariantSelector } from "./VariantSelector";
import Image from "next/image";
import { Package } from "lucide-react";
import { projectAvailability } from "@/lib/price";
export interface ProductInfoBlockLabels {
  brand: string;
  vatIncluded: string;
  handmade: string;
  delivery: string;
  giftWrap: string;
  materialsHeading: string;
  materialsText: string;
  materialsItem1: string;
  materialsItem2: string;
  materialsItem3: string;
  materialsCare: string;
  shippingHeading: string;
  shippingText: string;
  shippingItem1: string;
  shippingItem2: string;
  shippingItem3: string;
  shippingItem4: string;
  materialNames: Record<string, string>;
  /** Labels forwarded to VariantSelector for button text, stock, qty, etc. */
  variantSelector: import("./types").VariantSelectorLabels;
  /** Breadcrumb link label. */
  breadcrumbCatalog: string;
  /** Social proof section labels. */
  socialProof: import("./types").SocialProofLabels;
  /** Product facts heading. */
  factsHeading: string;
  factName: string;
  factMaterial: string;
  factLength: string;
  packagingHeading?: string;
  packagingNone?: string;
  packagingFree?: string;
  packagingOutOfStock?: string;
  packagingComingSoon?: string;
}

export const DEFAULT_LABELS: ProductInfoBlockLabels = {
  brand: "АКСЕССУАРЫ SUNLUK",
  vatIncluded: "НДС включен",
  handmade: "Ручная работа",
  delivery: "Доставка в DE и РФ",
  giftWrap: "Упаковка в подарок",
  materialsHeading: "МАТЕРИАЛЫ И УХОД",
  materialsText: "Каждое изделие SUNLUK создается вручную нашими мастерами из премиальных сертифицированных материалов:",
  materialsItem1: "Износостойкий и гипоаллергенный шнур/цепочка.",
  materialsItem2: "Итальянская премиум фурнитура и фурнитурные карабины.",
  materialsItem3: "Регулируемые силиконовые петли для дужек очков любого размера.",
  materialsCare: "Рекомендация: Избегайте прямого контакта с парфюмерией, лаком для волос и водой. Протирайте мягкой салфеткой без химии.",
  shippingHeading: "ДОСТАВКА И ВОЗВРАТ",
  shippingText: "Мы отправляем заказы по всему миру из складов в Мюнхене (Германия) и Москве (Россия):",
  shippingItem1: "Отправка в течение 24 часов после оплаты.",
  shippingItem2: "Бесплатная стандартная доставка при сумме заказа от 5 000 руб или 50 EUR.",
  shippingItem3: "Возможность экспресс-доставки курьером до двери за 2-4 рабочих дня.",
  shippingItem4: "Простой возврат или обмен в течение 14 дней с момента получения.",
  materialNames: {
    turquoise: "Бирюза",
    leather: "Кожа",
    silver: "Сталь",
    "gold-plated": "Золото",
    Turquoise: "Бирюза",
    Leather: "Кожа",
    Silver: "Сталь",
    "Gold-plated": "Золото",
  },
  variantSelector: {
    selectAllOptions: "Выберите все параметры",
    unavailable: "Недоступно",
    outOfStock: "Нет в наличии",
    preOrder: "Предзаказ",
    invalidQuantity: "Укажите количество",
    addToCart: "В корзину",
    quantity: "Количество",
    decreaseQuantity: "Уменьшить количество",
    increaseQuantity: "Увеличить количество",
    price: "Цена",
    cost: "Стоимость",
    inStock: "В наличии",
    lowStock: "Осталось мало",
    backorderAvailable: "Доступно под заказ",
    notAvailable: "Нет в наличии",
    deliveryPromise: "Бесплатная доставка",
    adding: "Добавление...",
    materialNames: {
      turquoise: "Бирюза",
      leather: "Кожа",
      silver: "Сталь",
      "gold-plated": "Золото",
      Turquoise: "Бирюза",
      Leather: "Кожа",
      Silver: "Сталь",
      "Gold-plated": "Золото",
    },
  },
  breadcrumbCatalog: "КАТАЛОГ",
  socialProof: {
    heading: "ПОКУПАТЕЛИ ГОВОРЯТ",
    placeholder: "Отзывы скоро появятся. Станьте первым!",
  },
  factsHeading: "ХАРАКТЕРИСТИКИ",
  factName: "Название",
  factMaterial: "Материал",
  factLength: "Длина",
  packagingHeading: "УПАКОВКА",
  packagingNone: "Без упаковки",
  packagingFree: "Бесплатно",
  packagingOutOfStock: "Нет в наличии",
  packagingComingSoon: "Скоро в наличии",
};

interface ProductInfoBlockProps {
  product: StoreProduct;
  price: CalculatedPrice | null;
  labels?: ProductInfoBlockLabels;
  packagingProducts?: StoreProduct[];
}

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons for trust badges                                 */
/* ------------------------------------------------------------------ */

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#2f6f78] flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904zM19.071 4.929l-.707 1.95-.195.707-1.95.707 1.95.195.707 1.95.195-1.95 1.95-.707-1.95-.195-.707-1.95z" />
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#2f6f78] flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.75A1.125 1.125 0 012.625 17.5V12m14.25 6.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.5a1.125 1.125 0 001.125-1.125V10.5m-3 8.25h-6M16.5 12h3m-3-3H12m-6.75 3h6" />
  </svg>
);

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#2f6f78] flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.25-9.75h16.5" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Accordion Item component                                           */
/* ------------------------------------------------------------------ */

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#2c211b]/10 py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-serif text-xs font-medium tracking-widest uppercase text-[#2c211b] hover:text-[#2f6f78] transition-colors focus:outline-none"
      >
        <span>{title}</span>
        <span className="text-sm font-light text-[#2c211b]/60 leading-none">
          {isOpen ? "—" : "+"}
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 text-xs leading-relaxed text-[#2c211b]/70 space-y-2 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductInfoBlock main component                                    */
/* ------------------------------------------------------------------ */


export function ProductInfoBlock({
  product,
  price,
  labels: propLabels,
  packagingProducts = [],
}: ProductInfoBlockProps) {
  const locale = useLocale();
  const labels = useMemo(() => {
    const defaultLabels = propLabels || DEFAULT_LABELS;
    if (propLabels) return defaultLabels;
    if (locale === "en") {
      return {
        brand: "SUNLUK ACCESSORIES",
        vatIncluded: "VAT included",
        handmade: "Handmade",
        delivery: "Delivery to DE & Worldwide",
        giftWrap: "Gift wrapping available",
        materialsHeading: "MATERIALS & CARE",
        materialsText: "Each SUNLUK piece is handcrafted by our artisans using premium certified materials:",
        materialsItem1: "Durable and hypoallergenic cord/chain.",
        materialsItem2: "Premium Italian hardware and clasps.",
        materialsItem3: "Adjustable silicone loops for any eyewear temple size.",
        materialsCare: "Care: Avoid direct contact with perfume, hairspray, and water. Wipe gently with a soft, chemical-free cloth.",
        shippingHeading: "SHIPPING & RETURNS",
        shippingText: "We ship worldwide from our warehouses in Munich (Germany) and Moscow (Russia):",
        shippingItem1: "Orders shipped within 24 hours of payment.",
        shippingItem2: "Free standard shipping on orders over 5,000 RUB or 50 EUR.",
        shippingItem3: "Express courier delivery to your door in 2–4 business days.",
        shippingItem4: "Easy returns or exchanges within 14 days of receipt.",
        materialNames: {
          turquoise: "Turquoise",
          leather: "Leather",
          silver: "Silver",
          "gold-plated": "Gold-plated",
          Turquoise: "Turquoise",
          Leather: "Leather",
          Silver: "Silver",
          "Gold-plated": "Gold-plated",
        },
        variantSelector: {
          selectAllOptions: "Select all options",
          unavailable: "Unavailable",
          outOfStock: "Out of stock",
          invalidQuantity: "Enter quantity",
          preOrder: "Pre-order",
          addToCart: "Add to cart",
          quantity: "Quantity",
          decreaseQuantity: "Decrease quantity",
          increaseQuantity: "Increase quantity",
          price: "Price",
          cost: "Total",
          inStock: "In stock",
          lowStock: "Only a few left",
          backorderAvailable: "Available for backorder",
          notAvailable: "Out of stock",
          deliveryPromise: "Free delivery",
          adding: "Adding…",
          materialNames: {
            turquoise: "Turquoise",
            leather: "Leather",
            silver: "Silver",
            "gold-plated": "Gold-plated",
            Turquoise: "Turquoise",
            Leather: "Leather",
            Silver: "Silver",
            "Gold-plated": "Gold-plated",
          },
        },
        breadcrumbCatalog: "CATALOG",
        socialProof: {
          heading: "WHAT OUR CUSTOMERS SAY",
          placeholder: "Reviews coming soon. Be the first!",
        },
        factsHeading: "SPECIFICATIONS",
        factName: "Name",
        factMaterial: "Material",
        factLength: "Length",
        packagingHeading: "PACKAGING",
        packagingNone: "No packaging",
        packagingFree: "Free",
        packagingOutOfStock: "Out of stock",
        packagingComingSoon: "Coming soon",
      };
    }
    return DEFAULT_LABELS;
  }, [propLabels, locale]);


  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [resolvedVariant, setResolvedVariant] = useState<ProductVariant | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [selectionValid, setSelectionValid] = useState(false);
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  // ponytail: default to the free branded pouch (velvet-pouch) — gift-box is disabled, colored pouches are paid
  const [selectedPackaging, setSelectedPackaging] = useState<string>("velvet-pouch");



  const selectedPackagingVariantId = useMemo(() => {
    const pkgProduct = packagingProducts?.find((p) => p.handle === selectedPackaging);
    return pkgProduct?.variants?.[0]?.id ?? null;
  }, [selectedPackaging, packagingProducts]);

  const onOptionChangeRef = useRef<((optionId: string, value: string) => void) | null>(null);

  const handleSelectionChange = useCallback(
    (selection: {
      variantId: string | null;
      quantity: number;
      valid: boolean;
      selectedOptions?: Record<string, string>;
      onOptionChange?: (optionId: string, value: string) => void;
      resolvedVariant?: ProductVariant | null;
      stockInfo?: StockInfo | null;
    }) => {
      if (selection.onOptionChange) {
        onOptionChangeRef.current = selection.onOptionChange;
      }
      if (selection.selectedOptions) {
        const next = selection.selectedOptions;
        setSelectedOptions((prev) => {
          const isSame =
            Object.keys(next).length === Object.keys(prev).length &&
            Object.keys(next).every((k) => prev[k] === next[k]);
          return isSame ? prev : next;
        });
      }
      if (selection.resolvedVariant !== undefined) {
        setResolvedVariant(selection.resolvedVariant);
      }
      if (selection.stockInfo !== undefined) {
        setStockInfo(selection.stockInfo);
      }
      setSelectionValid(selection.valid);
    },
    [],
  );

  // Show mobile sticky bar when scrolled past the regular CTA.
  useEffect(() => {
    const handleScroll = () => {
      // Show mobile bar after 400px of scroll (roughly past the hero image).
      setMobileBarVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Which price to show in the headline: variant price if resolved, else cheapest.
  const headlinePrice: CalculatedPrice | null =
    resolvedVariant?.calculated_price ?? price;

  // ponytail: derive the three characteristics (Name, Material, Length).
  // Match options by base title (EN+RU) since Medusa does not translate
  // product option titles — only the product title/description.
  const materialOption = product.options?.find((o) => {
    const t = o.title.toLowerCase();
    return t === "material" || t === "материал";
  });
  const lengthOption = product.options?.find((o) => {
    const t = o.title.toLowerCase();
    return t === "length" || t === "длина";
  });

  const materialValue = materialOption
    ? selectedOptions[materialOption.id]
    : undefined;
  const lengthValue = lengthOption
    ? selectedOptions[lengthOption.id]
    : undefined;

  const materialDisplay = materialValue
    ? (labels.materialNames[materialValue] ?? materialValue)
    : null;

  return (
    <>
      <div className="flex flex-col gap-6 lg:pt-4">
        {/* Title block — brand + H1, no inline variant controls */}
        <div>
          <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#2f6f78] block mb-2">
            {labels.brand}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide text-[#2c211b] uppercase pb-2 border-b border-[#2c211b]/10">
            {product.title}
          </h1>
        </div>

        {/* Headline Price — variant-driven */}
        <div className="flex items-baseline gap-3">
          <PriceDisplay
            price={headlinePrice}
            className="text-2xl sm:text-3xl font-light font-serif text-[#2c211b]"
          />
          <span className="text-[10px] tracking-wide text-[#2c211b]/50 uppercase font-medium">
            {labels.vatIncluded}
          </span>
        </div>

        {/* Brief description */}
        {product.description && (
          <div className="text-sm text-[#2c211b]/70 leading-relaxed max-w-xl">
            <p>{product.description}</p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-b border-[#2c211b]/10">
          <div className="flex items-center gap-3">
            <SparklesIcon />
            <span className="text-[11px] font-medium tracking-wide text-[#2c211b]/80 uppercase">
              {labels.handmade}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <TruckIcon />
            <span className="text-[11px] font-medium tracking-wide text-[#2c211b]/80 uppercase">
              {labels.delivery}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <GiftIcon />
            <span className="text-[11px] font-medium tracking-wide text-[#2c211b]/80 uppercase">
              {labels.giftWrap}
            </span>
          </div>
        </div>

        {/* Material quick-switch chips (visual, inline with variant selector) */}
        {product.variants && product.variants.length > 1 && product.options?.some((o) => o.title.toLowerCase() === "material") && (
          product.options
            ?.filter((o) => o.title.toLowerCase() === "material")
            .map((opt) => {
              const values =
                opt.values?.map((v) => (typeof v === "string" ? v : v.value)) ?? [];
              return (
                <div key={opt.id} className="flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/60">
                    {opt.title}
                  </span>
                  {values.map((val) => {
                    const isSelected = selectedOptions[opt.id] === val;
                    const displayVal = labels.materialNames[val] || val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onOptionChangeRef.current?.(opt.id, val)}
                        className={[
                          "text-xs sm:text-sm font-serif tracking-wider uppercase border-b transition-all duration-200 cursor-pointer pb-0.5",
                          isSelected
                            ? "border-[#2f6f78] text-[#2f6f78] font-medium"
                            : "border-transparent text-[#2c211b]/40 hover:text-[#2c211b] hover:border-[#2c211b]/30",
                        ].join(" ")}
                      >
                        {displayVal}
                      </button>
                    );
                  })}
                </div>
              );
            })
        )}

        {/* Packaging Options */}
        {packagingProducts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#2c211b]/10 pt-5">
            <span className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/60">
              {labels.packagingHeading}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packagingProducts.map((p) => {
                const variant = p.variants?.[0];
                const isSelected = selectedPackaging === p.handle;
                if (!variant) return null;

                // ponytail: shared availability projection (single source of truth)
                const isInStock = projectAvailability(variant).available;
                // ponytail: gift-box is temporarily unavailable (not produced yet) — show as disabled with 'coming soon' label
                const isComingSoon = p.handle === "gift-box";
                const isSelectable = isInStock && !isComingSoon;

                const amount = variant.calculated_price?.calculated_amount;
                const currency = variant.calculated_price?.currency_code;
                const isFree = !amount;
                const priceText = (isFree || !amount || !currency)
                  ? labels.packagingFree
                  : `+ ${formatPriceValue(amount, currency, locale)}`;

                const displayText = isComingSoon
                  ? labels.packagingComingSoon || (locale === "en" ? "Coming soon" : "Скоро в наличии")
                  : isInStock
                    ? priceText
                    : `${priceText} (${labels.packagingOutOfStock || (locale === "en" ? "Out of stock" : "Нет в наличии")})`;

                const imageUrl = p.thumbnail ?? p.images?.[0]?.url ?? null;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => isSelectable && setSelectedPackaging(p.handle)}
                    disabled={!isSelectable}
                    className={[
                      "relative flex items-center gap-3 w-full p-2.5 text-left border transition-all duration-300 select-none text-[#2c211b]",
                      isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                      isSelected
                        ? "border-[#2f6f78] bg-[#2f6f78]/5 ring-1 ring-[#2f6f78]"
                        : "border-[#2c211b]/15 hover:border-[#2c211b]/40 bg-transparent",
                    ].join(" ")}
                  >
                    <div className="relative w-20 h-20 flex-shrink-0 bg-[#f4ebe6] overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={p.title}
                          fill
                          sizes="80px"
                          unoptimized
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-[#2c211b]/20" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-6 flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wider font-semibold line-clamp-2">
                        {p.title}
                      </span>
                      <span className="text-[#2c211b]/60 font-serif normal-case font-normal text-[11px] truncate">
                        {displayText}
                      </span>
                    </div>
                    {/* Selected indicator */}
                    {isSelected && (
                      <span className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-[#2f6f78] text-white rounded-full p-0.5 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-2.5 h-2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Variant Selector (non-material options + purchase controls) */}
        <div className="pt-2">
          <VariantSelector
            options={product.options}
            variants={product.variants}
            badge={product.metadata?.badge as string | undefined}
            hideOptionButtons={product.options?.length === 1 && product.options[0].title.toLowerCase() === "material"}
            labels={labels.variantSelector}
            selectedPackagingVariantId={selectedPackagingVariantId}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Stock + Delivery near CTA (redundant safety — VariantSelector already shows it) */}
        {stockInfo && !selectionValid && (
          <div className="flex flex-col gap-1 -mt-3">
            <p
              className={[
                "text-xs font-medium",
                stockInfo.available ? "text-[#2f6f78]" : "text-red-600",
              ].join(" ")}
            >
              {stockInfo.message}
            </p>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="border-t border-[#2c211b]/10">
          <AccordionItem title={labels.factsHeading}>
            <dl className="space-y-2">
              <div className="flex justify-between text-xs">
                <dt className="text-[#2c211b]/50 uppercase tracking-wide">{labels.factName}</dt>
                <dd className="text-[#2c211b] font-medium">{product.title}</dd>
              </div>
              {materialDisplay && (
                <div className="flex justify-between text-xs">
                  <dt className="text-[#2c211b]/50 uppercase tracking-wide">{labels.factMaterial}</dt>
                  <dd className="text-[#2c211b] font-medium">{materialDisplay}</dd>
                </div>
              )}
              {lengthValue && (
                <div className="flex justify-between text-xs">
                  <dt className="text-[#2c211b]/50 uppercase tracking-wide">{labels.factLength}</dt>
                  <dd className="text-[#2c211b] font-medium">{lengthValue}</dd>
                </div>
              )}
            </dl>
          </AccordionItem>
          <AccordionItem title={labels.materialsHeading}>
            <p>{labels.materialsText}</p>
            <ul className="list-disc pl-4 space-y-1 mt-2">
              <li>{labels.materialsItem1}</li>
              <li>{labels.materialsItem2}</li>
              <li>{labels.materialsItem3}</li>
            </ul>
            <p className="mt-2 text-[#2c211b]/50 italic">
              {labels.materialsCare}
            </p>
          </AccordionItem>

          <AccordionItem title={labels.shippingHeading}>
            <p>{labels.shippingText}</p>
            <ul className="list-disc pl-4 space-y-1 mt-2">
              <li>{labels.shippingItem1}</li>
              <li>{labels.shippingItem2}</li>
              <li>{labels.shippingItem3}</li>
              <li>{labels.shippingItem4}</li>
            </ul>
          </AccordionItem>
        </div>
      </div>

      {/* ---------- Sticky Mobile CTA Bar ---------- */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-40 bg-[#f4ebe6]/95 backdrop-blur-md border-t border-[#2c211b]/10 px-4 py-3 lg:hidden transition-transform duration-300",
          mobileBarVisible ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            {headlinePrice && (
              <PriceDisplay
                price={headlinePrice}
                className="text-sm font-semibold font-serif text-[#2c211b]"
              />
            )}
            {stockInfo && (
              <span
                className={[
                  "text-[10px] font-medium truncate",
                  stockInfo.available ? "text-[#2f6f78]" : "text-red-600",
                ].join(" ")}
              >
                {stockInfo.message}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!selectionValid || stockInfo?.available === false}
            className={[
              "flex-shrink-0 px-6 py-3 text-xs font-medium tracking-widest uppercase transition-all duration-300",
              selectionValid && stockInfo?.available !== false
                ? "bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2c211b]/90 cursor-pointer"
                : "bg-[#2c211b]/10 text-[#2c211b]/30 cursor-not-allowed",
            ].join(" ")}
            onClick={() => {
              // Scroll to and click the primary CTA.
              const cta = document.getElementById("pdp-primary-cta");
              cta?.scrollIntoView({ behavior: "smooth" });
              cta?.click();
            }}
          >
            {labels.variantSelector.addToCart}
          </button>
        </div>
      </div>
    </>
  );
}
