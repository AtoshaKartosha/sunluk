"use client";

import { useState, useCallback, useRef } from "react";
import type { StoreProduct, CalculatedPrice } from "./types";
import { PriceDisplay } from "./PriceDisplay";
import { VariantSelector } from "./VariantSelector";

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
};

interface ProductInfoBlockProps {
  product: StoreProduct;
  price: CalculatedPrice | null;
  labels?: ProductInfoBlockLabels;
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

export function ProductInfoBlock({ product, price, labels = DEFAULT_LABELS }: ProductInfoBlockProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const onOptionChangeRef = useRef<((optionId: string, value: string) => void) | null>(null);
  const handleSelectionChange = useCallback((selection: {
    variantId: string | null;
    quantity: number;
    valid: boolean;
    selectedOptions?: Record<string, string>;
    onOptionChange?: (optionId: string, value: string) => void;
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
  }, []);
  return (
    <div className="flex flex-col gap-6 lg:pt-4">
      {/* Title block */}
      <div>
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#2f6f78] block mb-2">
          {labels.brand}
        </span>
        <div className="flex justify-between items-baseline gap-4 flex-wrap pb-2 border-b border-[#2c211b]/10">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide text-[#2c211b] uppercase">
            {product.title}
          </h1>
          {/* Material Switchers directly on the right */}
          <div className="flex gap-4 items-center">
            {product.options?.map((opt) => {
              if (opt.title.toLowerCase() !== "material") return null;
              const values =
                opt.values?.map((v) => (typeof v === "string" ? v : v.value)) ?? [];
              return (
                <div key={opt.id} className="flex gap-3">
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
            })}
          </div>
        </div>
      </div>
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <PriceDisplay price={price} className="text-2xl font-light font-serif text-[#2c211b]" />
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
      {/* Trust Badges list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-b border-[#2c211b]/10 my-2">
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
      {/* Variant Selector */}
      <div className="pt-2">
        <VariantSelector
          options={product.options}
          variants={product.variants}
          hideOptionButtons={true}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      {/* Collapsible Sections (UX Details) */}
      <div className="mt-4 border-t border-[#2c211b]/10">
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
  );
}
