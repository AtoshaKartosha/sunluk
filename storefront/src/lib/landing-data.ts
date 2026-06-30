import type { Locale } from "@/i18n/routing";

export const BRAND = {
  name: "SUNLUK",
  subtitle: "АКСЕССУАРЫ ДЛЯ ОЧКОВ",
} as const;

export interface NavLinkData {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLinkData[] = [
  { href: "/ru/products", label: "КАТАЛОГ" },
  { href: "#collection", label: "КОЛЛЕКЦИЯ" },
  { href: "#about", label: "О НАС" },
  { href: "#contacts", label: "КОНТАКТЫ" },
];

export interface ProductData {
  image: string;
  ariaLabel: string;
  title: string;
  colorDot: string;
  material: string;
  description: string;
}

export const PRODUCTS: ProductData[] = [
  {
    image: "/images/product-turquoise.webp",
    ariaLabel: "Бирюза",
    title: "Бирюза",
    colorDot: "bg-[#2f6f78]",
    material: "Цвет",
    description: "Акцентный цвет и природные мотивы",
  },
  {
    image: "/images/product-leather.webp",
    ariaLabel: "Leather Loop",
    title: "Leather Loop",
    colorDot: "bg-[#5a3828]",
    material: "Кожа",
    description: "Натуральная кожа и премиальный металл",
  },
  {
    image: "/images/product-silver.webp",
    ariaLabel: "Silver Chain",
    title: "Silver Chain",
    colorDot: "bg-[#a3b8bc]",
    material: "Сталь",
    description: "Минимализм, строгость и лёгкий блеск",
  },
  {
    image: "/images/product-sand.webp",
    ariaLabel: "Sand Chain",
    title: "Sand Chain",
    colorDot: "bg-[#d4af37]",
    material: "Золото",
    description: "Тёплый металл и морской песчаный оттенок",
  },
];

export type FeatureIcon = "S" | "gem" | "leaf" | "shield" | "modules";

export interface FeatureData {
  icon: FeatureIcon;
  title: string;
  description: string;
}

export const FEATURES: FeatureData[] = [
  {
    icon: "S",
    title: "S-элемент",
    description: "Фирменная деталь SUNLUK",
  },
  {
    icon: "modules",
    title: "Модульность",
    description: "Сменные модули под любой образ.",
  },
  {
    icon: "leaf",
    title: "Лёгкие",
    description: "Комфортные на весь день.",
  },
  {
    icon: "gem",
    title: "Премиальные материалы",
    description: "Отборные материалы, которые служат долго.",
  },
];

/**
 * Feature border classes by grid position (2x2, 0-based):
 * top-left, top-right, bottom-left, bottom-right.
 */
export const FEATURE_BORDER_CLASSES = [
  "border-r border-b border-[#2c211b]/15",
  "border-b border-[#2c211b]/15",
  "border-r border-[#2c211b]/15",
  "",
] as const;

export interface FooterLinkData {
  label: string;
  href: string;
}

export interface FooterGroupData {
  title: string;
  links: FooterLinkData[];
}

export const FOOTER_GROUPS: FooterGroupData[] = [
  {
    title: "СЕРВИС КЛИЕНТОВ",
    links: [
      { label: "Наша история", href: "#" },
      { label: "Доставка и возврат", href: "#" },
      { label: "Условия и положения", href: "#" },
      { label: "Политика конфиденциальности", href: "#" },
    ],
  },
  {
    title: "МАГАЗИН",
    links: [
      { label: "Все товары", href: "#" },
      { label: "Подарочные карты", href: "#" },
    ],
  },
  {
    title: "ВОПРОСЫ",
    links: [
      { label: "Связаться с нами", href: "#" },
      { label: "Telegram", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "Email", href: "mailto:info@sunluk.ru" },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Locale-aware helpers for catalog pages
// ---------------------------------------------------------------------------



export function getNavLinks(locale: Locale): NavLinkData[] {
  switch (locale) {
    case "en":
      return [
        { href: "#collection", label: "COLLECTION" },
        { href: "#about", label: "DETAILS" },
        { href: "#contacts", label: "CONTACTS" },
      ];
    default:
      return [
        { href: "#collection", label: "КОЛЛЕКЦИЯ" },
        { href: "#about", label: "ДЕТАЛИ" },
        { href: "#contacts", label: "КОНТАКТЫ" },
      ];
  }
}


export function getFooterGroups(locale: Locale): FooterGroupData[] {
  if (locale === "en") {
    return [
      {
        title: "CUSTOMER SERVICE",
        links: [
          { label: "Our Story", href: "#" },
          { label: "Shipping & Returns", href: "#" },
          { label: "Terms & Conditions", href: "#" },
          { label: "Privacy Policy", href: "#" },
        ],
      },
      {
        title: "SHOP",
        links: [
          { label: "All Products", href: "#" },
          { label: "Gift Cards", href: "#" },
        ],
      },
      {
        title: "QUESTIONS",
        links: [
          { label: "Contact Us", href: "#" },
          { label: "Telegram", href: "#" },
          { label: "Instagram", href: "#" },
          { label: "Email", href: "mailto:info@sunluk.ru" },
        ],
      },
    ];
  }

  return FOOTER_GROUPS;
}

export function getCopyright(locale: Locale): string {
  switch (locale) {
    case "en":
      return "© 2026 SUNLUK. All rights reserved.";
    default:
      return "© 2026 SUNLUK. Все права защищены.";
  }
}
