import type { Locale } from "@/i18n/routing";
import type { SiteContentOverrides } from "./site-content";

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
    description: "Фирменная деталь САНЛУК",
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
  "",
  "",
  "",
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
      { label: "Пользовательское соглашение", href: "/ru/info#terms" },
      { label: "Политика конфиденциальности", href: "/ru/info#privacy" },
      { label: "Условия оформления и покупки товаров", href: "/ru/info#purchase" },
      { label: "Правила доставки", href: "/ru/info#shipping" },
      { label: "Правила возврата товаров", href: "/ru/info#returns" },
      { label: "Реквизиты", href: "/ru/info#requisites" },
    ],
  },
  {
    title: "МАГАЗИН",
    links: [
      { label: "Коллекция", href: "/ru/products" },
    ],
  },
  {
    title: "ВОПРОСЫ",
    links: [
      { label: "Связаться с нами", href: "/ru#contacts" },
      { label: "Telegram", href: "#" },
      { label: "Instagram", href: "https://www.instagram.com/sunluk.accessories/" },
      { label: "Email", href: "mailto:info@sunluk.ru" },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Locale-aware helpers for catalog pages
// ---------------------------------------------------------------------------



export function getNavLinks(
  locale: Locale,
  isLanding = false,
  overrides?: SiteContentOverrides | null
): NavLinkData[] {
  const prefix = isLanding ? "" : `/${locale}`;
  const navOverrides = overrides?.navigation;
  switch (locale) {
    case "en":
      return [
        { href: `${prefix}#collection`, label: navOverrides?.collection ?? "COLLECTION" },
        { href: `${prefix}#about`, label: navOverrides?.details ?? "DETAILS" },
        { href: `${prefix}#contacts`, label: navOverrides?.contacts ?? "CONTACTS" },
      ];
    default:
      return [
        { href: `${prefix}#collection`, label: navOverrides?.collection ?? "КОЛЛЕКЦИЯ" },
        { href: `${prefix}#about`, label: navOverrides?.details ?? "ДЕТАЛИ" },
        { href: `${prefix}#contacts`, label: navOverrides?.contacts ?? "КОНТАКТЫ" },
      ];
  }
}

export function getFooterGroups(
  locale: Locale,
  overrides?: SiteContentOverrides | null
): FooterGroupData[] {
  const f = overrides?.footer;
  if (locale === "en") {
    return [
      {
        title: f?.customerService ?? "CUSTOMER SERVICE",
        links: [
          { label: f?.userAgreement ?? "User Agreement", href: "/en/info#terms" },
          { label: f?.privacyPolicy ?? "Privacy Policy", href: "/en/info#privacy" },
          { label: f?.purchaseTerms ?? "Terms for Placing Orders and Purchasing Goods", href: "/en/info#purchase" },
          { label: f?.deliveryPolicy ?? "Delivery Policy", href: "/en/info#shipping" },
          { label: f?.returnsPolicy ?? "Returns Policy", href: "/en/info#returns" },
          { label: f?.requisites ?? "Requisites", href: "/en/info#requisites" },
        ],
      },
      {
        title: f?.shop ?? "SHOP",
        links: [
          { label: f?.allProducts ?? "All Products", href: "/en/products" },
        ],
      },
      {
        title: f?.questions ?? "QUESTIONS",
        links: [
          { label: f?.contactUs ?? "Contact Us", href: "/en#contacts" },
          { label: f?.telegram ?? "Telegram", href: "#" },
          { label: f?.instagram ?? "Instagram", href: "https://www.instagram.com/sunluk.accessories/" },
          { label: f?.email ?? "Email", href: "mailto:info@sunluk.ru" },
        ],
      },
    ];
  }

  return [
    {
      title: f?.customerService ?? "СЕРВИС КЛИЕНТОВ",
      links: [
        { label: f?.userAgreement ?? "Пользовательское соглашение", href: "/ru/info#terms" },
        { label: f?.privacyPolicy ?? "Политика конфиденциальности", href: "/ru/info#privacy" },
        { label: f?.purchaseTerms ?? "Условия оформления и покупки товаров", href: "/ru/info#purchase" },
        { label: f?.deliveryPolicy ?? "Правила доставки", href: "/ru/info#shipping" },
        { label: f?.returnsPolicy ?? "Правила возврата товаров", href: "/ru/info#returns" },
        { label: f?.requisites ?? "Реквизиты", href: "/ru/info#requisites" },
      ],
    },
    {
      title: f?.shop ?? "МАГАЗИН",
      links: [
        { label: f?.allProducts ?? "Коллекция", href: "/ru/products" },
      ],
    },
    {
      title: f?.questions ?? "ВОПРОСЫ",
      links: [
        { label: f?.contactUs ?? "Связаться с нами", href: "/ru#contacts" },
        { label: f?.telegram ?? "Telegram", href: "#" },
        { label: f?.instagram ?? "Instagram", href: "https://www.instagram.com/sunluk.accessories/" },
        { label: f?.email ?? "Email", href: "mailto:info@sunluk.ru" },
      ],
    },
  ];
}

export function getCopyright(
  locale: Locale,
  overrides?: SiteContentOverrides | null
): string {
  if (overrides?.footer?.copyright) {
    return overrides.footer.copyright;
  }
  switch (locale) {
    case "en":
      return "© 2026 SUNLUK. All rights reserved.";
    default:
      return "© 2026 САНЛУК. Все права защищены.";
  }
}
