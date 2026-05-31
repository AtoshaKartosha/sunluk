"use client";

import { useState } from "react";
import type { StoreProduct, CalculatedPrice } from "./types";
import { PriceDisplay } from "./PriceDisplay";
import { VariantSelector } from "./VariantSelector";

interface ProductInfoBlockProps {
  product: StoreProduct;
  price: CalculatedPrice | null;
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

export function ProductInfoBlock({ product, price }: ProductInfoBlockProps) {
  return (
    <div className="flex flex-col gap-6 lg:pt-4">
      {/* Title block */}
      <div>
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#2f6f78] block mb-2">
          АКСЕССУАРЫ SUNLUK
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide text-[#2c211b] uppercase">
          {product.title}
        </h1>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <PriceDisplay price={price} className="text-2xl font-light font-serif text-[#2c211b]" />
        <span className="text-[10px] tracking-wide text-[#2c211b]/50 uppercase font-medium">
          НДС включен
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
            Ручная работа
          </span>
        </div>
        <div className="flex items-center gap-3">
          <TruckIcon />
          <span className="text-[11px] font-medium tracking-wide text-[#2c211b]/80 uppercase">
            Доставка в DE и РФ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <GiftIcon />
          <span className="text-[11px] font-medium tracking-wide text-[#2c211b]/80 uppercase">
            Упаковка в подарок
          </span>
        </div>
      </div>

      {/* Variant Selector */}
      <div className="pt-2">
        <VariantSelector
          options={product.options}
          variants={product.variants}
        />
      </div>

      {/* Collapsible Sections (UX Details) */}
      <div className="mt-4 border-t border-[#2c211b]/10">
        <AccordionItem title="МАТЕРИАЛЫ И УХОД">
          <p>
            Каждое изделие SUNLUK создается вручную нашими мастерами из
            премиальных сертифицированных материалов:
          </p>
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>Износостойкий и гипоаллергенный шнур/цепочка.</li>
            <li>Итальянская премиум фурнитура и фурнитурные карабины.</li>
            <li>Регулируемые силиконовые петли для дужек очков любого размера.</li>
          </ul>
          <p className="mt-2 text-[#2c211b]/50 italic">
            Рекомендация: Избегайте прямого контакта с парфюмерией, лаком для
            волос и водой. Протирайте мягкой салфеткой без химии.
          </p>
        </AccordionItem>

        <AccordionItem title="ДОСТАВКА И ВОЗВРАТ">
          <p>
            Мы отправляем заказы по всему миру из складов в Мюнхене (Германия) и
            Москве (Россия):
          </p>
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>Отправка в течение 24 часов после оплаты.</li>
            <li>
              Бесплатная стандартная доставка при сумме заказа от 5 000 руб или
              50 EUR.
            </li>
            <li>
              Возможность экспресс-доставки курьером до двери за 2-4 рабочих дня.
            </li>
            <li>
              Простой возврат или обмен в течение 14 дней с момента получения.
            </li>
          </ul>
        </AccordionItem>
      </div>
    </div>
  );
}
