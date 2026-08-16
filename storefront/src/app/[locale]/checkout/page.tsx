"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import type { StoreCart } from "@/components/cart/types";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import {
  updateCart,
  getShippingOptions,
  addShippingMethod,
  createPaymentSessions,
  completeCart,
  clearCartId,
} from "@/lib/medusa/cart";
import { getStoreCountries } from "@/lib/medusa/regions";
import { getClientCustomer } from "@/lib/medusa/customer";
import { getPackagingName } from "@/lib/medusa/packaging-names";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckoutStep = "contact" | "shipping" | "payment";

interface ShippingOption {
  id: string;
  name: string;
  amount?: number;
  price_type?: string;
  calculated_amount?: number;
  currency_code?: string;
}


interface ContactShippingFormState {
  email: string;
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
}

const EMPTY_ADDRESS: ContactShippingFormState = {
  email: "",
  first_name: "",
  last_name: "",
  address_1: "",
  city: "",
  postal_code: "",
  country_code: "dk",
  phone: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PHONE_RE = /^\+[1-9]\d{6,14}$/;

function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, "");
}


const REQUIRED_FIELDS: (keyof ContactShippingFormState)[] = [
  "email",
  "first_name",
  "last_name",
  "address_1",
  "city",
  "postal_code",
  "country_code",
  "phone",
];

const FIELD_IDS: Record<keyof ContactShippingFormState, string> = {
  email: "checkout-email",
  first_name: "checkout-first-name",
  last_name: "checkout-last-name",
  address_1: "checkout-address",
  city: "checkout-city",
  postal_code: "checkout-postal",
  country_code: "checkout-country",
  phone: "checkout-phone",
};

// Major-city suggestions per supported country (datalist hints; free text always allowed).
// Keyed by ISO-2 (lowercase) of the store's region countries.
const CITY_SUGGESTIONS: Record<string, string[]> = {
  dk: ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
  fr: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Bordeaux"],
  de: ["Berlin", "München", "Hamburg", "Köln", "Frankfurt am Main", "Stuttgart", "Düsseldorf"],
  it: ["Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna"],
  es: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga"],
  se: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås"],
  gb: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Edinburgh"],
  ru: ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Краснодар"],
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// ponytail: duplicated from PriceDisplay.tsx to avoid complex import chain
function formatPrice(amount: number | null | undefined, currency: string | null | undefined, locale?: string): string {
  if (amount == null || !currency) return "—";
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


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingState({
  t,
  locale,
}: {
  t: ReturnType<typeof useTranslations<"checkout">>;
  locale: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div aria-hidden="true" className="w-8 h-8 border-2 border-[#2f6f78] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
          <p role="status" aria-live="polite" className="text-sm text-[#2c211b]/60 tracking-wide">
            {t("loading")}
          </p>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}

function EmptyCartState({
  t,
  locale,
}: {
  t: ReturnType<typeof useTranslations<"checkout">>;
  locale: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4 py-16">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-light tracking-wide mb-4">
            {t("emptyTitle")}
          </h1>
          <p className="text-sm text-[#2c211b]/60 mb-8">
            {t("emptyDesc")}
          </p>
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center px-8 py-3 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
          >
            {t("emptyCta")}
          </Link>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}

function StepIndicator({
  currentStep,
  tsteps,
}: {
  currentStep: CheckoutStep;
  tsteps: ReturnType<typeof useTranslations<"checkout.steps">>;
}) {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "contact", label: tsteps("contact") },
    { key: "shipping", label: tsteps("shipping") },
    { key: "payment", label: tsteps("payment") },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-3 mb-10">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 ${
              i <= currentIdx ? "text-[#2c211b]" : "text-[#2c211b]/30"
            }`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border ${
                i < currentIdx
                  ? "bg-[#2f6f78] border-[#2f6f78] text-white"
                  : i === currentIdx
                    ? "border-[#2c211b] text-[#2c211b]"
                    : "border-[#2c211b]/30 text-[#2c211b]/30"
              }`}
            >
              {i < currentIdx ? "✓" : i + 1}
            </span>
            <span className="text-[10px] font-medium tracking-[0.2em]">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px ${
                i < currentIdx ? "bg-[#2f6f78]" : "bg-[#2c211b]/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Styled "type or pick" city field: a text input plus a custom suggestion
// dropdown that matches the country <select> look (the native <datalist> is
// dark, icon-laden and unstyleable). Free text is always allowed.
function CityCombobox({
  id,
  value,
  suggestions,
  placeholder,
  describedBy,
  invalid,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  suggestions: string[];
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    return q ? suggestions.filter((s) => s.toLowerCase().includes(q)) : suggestions;
  }, [value, suggestions]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const choose = (city: string) => {
    onChange(city);
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && highlight >= 0 && filtered[highlight]) {
        e.preventDefault();
        choose(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  };

  const listId = `${id}-listbox`;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        required
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined}
        autoComplete="address-level2"
        enterKeyHint="next"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full px-4 py-3 pr-10 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2c211b]/50"
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-[#2c211b]/15 bg-white shadow-lg"
        >
          {filtered.map((city, i) => (
            <li
              key={city}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(city);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-4 py-2.5 text-sm text-[#2c211b] ${
                i === highlight ? "bg-[#2f6f78]/10" : "hover:bg-[#2f6f78]/5"
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Checkout Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, clearCart, setCart, applyPromotion, mutating } = useCart();
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tc = useTranslations("checkout.contact");
  const tpromo = useTranslations("checkout.promotion");
  const ts = useTranslations("checkout.shipping");
  const tp = useTranslations("checkout.payment");
  const ta = useTranslations("checkout.actions");
  const tsm = useTranslations("checkout.summary");
  const tsteps = useTranslations("checkout.steps");

  // ---- Step state ----
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("contact");
  const [contactForm, setContactForm] = useState<ContactShippingFormState>({
    ...EMPTY_ADDRESS,
    country_code: locale === "ru" ? "ru" : EMPTY_ADDRESS.country_code,
  });
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactShippingFormState, string>>
  >({});

  // ---- Promotion state ----
  const [promoCode, setPromoCode] = useState("");
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const promoSubmittingRef = useRef(false);
  const appliedPromotion = cart?.promotions?.find((p) => p.code) ?? cart?.promotions?.[0] ?? null;

  const handlePromotionSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (promoSubmittingRef.current || mutating) return;

      const trimmed = promoCode.trim();
      if (!trimmed) {
        setPromoError(tpromo("validation.required"));
        setPromoSuccess(null);
        return;
      }

      promoSubmittingRef.current = true;
      setPromoSubmitting(true);
      setPromoError(null);
      setPromoSuccess(null);

      try {
        await applyPromotion(trimmed);
        setPromoCode("");
        setPromoSuccess(tpromo("applied"));
      } catch {
        setPromoError(tpromo("errors.failed"));
      } finally {
        promoSubmittingRef.current = false;
        setPromoSubmitting(false);
      }
    },
    [promoCode, mutating, applyPromotion, tpromo],
  );

  // ---- Shipping state ----
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);

  // ---- Payment state ----
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const selectedOrCartShippingId =
    selectedShippingId ?? cart?.shipping_methods?.[0]?.shipping_option_id ?? null;

  // ---- Country list (sourced from the cart's region) ----
  const [countries, setCountries] = useState<string[]>([]);
  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);

  // ---- Mobile order-summary disclosure ----
  const [summaryOpen, setSummaryOpen] = useState(false);

  // ---- Refs ----
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shippingReqRef = useRef(0);
  const ranOnceRef = useRef(false);

  // ---- Fetch shipping options when shipping step becomes active ----
  useEffect(() => {
    if (currentStep !== "shipping" || !cart?.id) return;
    if (shippingOptions.length > 0) return;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setShippingLoading(true);
    });
    getShippingOptions(cart.id)
      .then((options) => {
        if (!cancelled) setShippingOptions(options);
      })
      .catch(() => {
        if (!cancelled) setStepError(t("errors.shippingOptionsFailed"));
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentStep, cart?.id, shippingOptions.length, t]);

  const validateField = useCallback(
    (field: keyof ContactShippingFormState, value: string): string | undefined => {
      if (field === "phone" && !E164_PHONE_RE.test(normalizePhone(value))) {
        return tc("validation.phone");
      }
      if (REQUIRED_FIELDS.includes(field) && !value.trim()) {
        return tc("validation.required");
      }
      if (field === "email" && value.trim() && !EMAIL_RE.test(value.trim())) {
        return tc("validation.email");
      }
      return undefined;
    },
    [tc],
  );

  const handleContactSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cart?.id) return;

      const errors: Partial<Record<keyof ContactShippingFormState, string>> = {};
      for (const field of REQUIRED_FIELDS) {
        const msg = validateField(field, contactForm[field]);
        if (msg) errors[field] = msg;
      }
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        const firstInvalid = REQUIRED_FIELDS.find((f) => errors[f]);
        if (firstInvalid) {
          document.getElementById(FIELD_IDS[firstInvalid])?.focus();
        }
        return;
      }
      setFieldErrors({});

      setStepSubmitting(true);
      setStepError(null);

      try {
        const address = {
          first_name: contactForm.first_name,
          last_name: contactForm.last_name,
          address_1: contactForm.address_1,
          city: contactForm.city,
          postal_code: contactForm.postal_code,
          country_code: contactForm.country_code,
          phone: normalizePhone(contactForm.phone),
        };

        const updatedCart = await updateCart(cart.id, {
          email: contactForm.email,
          shipping_address: address,
          billing_address: address,
        });
        setCart(updatedCart as unknown as StoreCart);

        setShippingOptions([]);
        setSelectedShippingId(null);
        setCurrentStep("shipping");
      } catch {
        setStepError(t("errors.contactSaveFailed"));
      } finally {
        setStepSubmitting(false);
      }
    },
    [cart, contactForm, setCart, t, validateField],
  );

  const handleShippingSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cart?.id || !selectedOrCartShippingId) return;
      setStepSubmitting(true);
      setStepError(null);

      try {
        const updatedCart = await addShippingMethod(cart.id, selectedOrCartShippingId);
        setCart(updatedCart as unknown as StoreCart);
        setCurrentStep("payment");
      } catch {
        setStepError(t("errors.shippingSelectFailed"));
      } finally {
        setStepSubmitting(false);
      }
    },
    [cart, selectedOrCartShippingId, setCart, t],
  );

  // ---- Persist a shipping selection immediately so totals refresh ----
  const handleSelectShipping = useCallback(
    async (optionId: string) => {
      if (!cart?.id) return;
      setSelectedShippingId(optionId);
      setStepError(null);
      const reqId = ++shippingReqRef.current;
      try {
        const updatedCart = await addShippingMethod(cart.id, optionId);
        if (reqId !== shippingReqRef.current) return; // a newer selection won
        setCart(updatedCart as unknown as StoreCart);
      } catch {
        if (reqId === shippingReqRef.current) {
          setStepError(t("errors.shippingSelectFailed"));
        }
      }
    },
    [cart, setCart, t],
  );

  const handlePaymentSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cart?.id) return;
      setCompleting(true);
      setCompletionError(null);

      try {
        await createPaymentSessions(cart.id);

        const result = await completeCart(cart.id);

        if (result.type === "order" && result.order) {
          clearCartId();
          clearCart();
          router.push(`/${locale}/checkout/success?order_number=${result.order.display_id}`);
        } else {
          const errMsg =
            (result as { error?: { message?: string } }).error?.message ??
            t("errors.orderCompletionFailed");
          setCompletionError(errMsg);
        }
      } catch {
        setCompletionError(t("errors.orderCompletionError"));
      } finally {
        setCompleting(false);
      }
    },
    [cart, router, locale, clearCart, t],
  );

  const updateContactField = useCallback(
    (field: keyof ContactShippingFormState, value: string) => {
      setContactForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        if (!prev[field] || validateField(field, value)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [validateField],
  );

  const handleFieldBlur = useCallback(
    (field: keyof ContactShippingFormState) => {
      const msg = validateField(field, contactForm[field]);
      setFieldErrors((prev) => {
        if (msg === prev[field]) return prev;
        const next = { ...prev };
        if (msg) next[field] = msg;
        else delete next[field];
        return next;
      });
    },
    [validateField, contactForm],
  );

  const fieldErrorEl = (field: keyof ContactShippingFormState) =>
    fieldErrors[field] ? (
      <p id={`${FIELD_IDS[field]}-error`} className="text-xs text-red-600 mt-1">
        {fieldErrors[field]}
      </p>
    ) : null;

  // ---- Load every country supported by the store ----
  useEffect(() => {
    if (countries.length > 0) return;

    let cancelled = false;
    getStoreCountries()
      .then((list) => {
        if (cancelled) return;
        setCountries(list);
        setContactForm((prev) =>
          list.length > 0 && !list.includes(prev.country_code)
            ? { ...prev, country_code: list[0] }
            : prev,
        );
      })
      .catch(() => {
        /* selector keeps showing the loading placeholder */
      });

    return () => {
      cancelled = true;
    };
  }, [countries.length]);

  // ---- Move focus to the active step heading on step change ----
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  // ---- Prefill the contact form from the logged-in customer (once) ----
  useEffect(() => {
    if (ranOnceRef.current) return;
    ranOnceRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const customer = await getClientCustomer();
        if (cancelled || !customer) return;

        const addr =
          customer.addresses?.find((a) => a.is_default_shipping) ??
          customer.addresses?.[0] ??
          null;

        const fill = (
          current: string,
          ...candidates: (string | null | undefined)[]
        ): string => {
          if (current.trim()) return current;
          const found = candidates.find((c) => c && c.trim());
          return found ?? current;
        };

        setContactForm((prev) => ({
          ...prev,
          email: fill(prev.email, customer.email),
          first_name: fill(prev.first_name, addr?.first_name, customer.first_name),
          last_name: fill(prev.last_name, addr?.last_name, customer.last_name),
          address_1: fill(prev.address_1, addr?.address_1),
          city: fill(prev.city, addr?.city),
          postal_code: fill(prev.postal_code, addr?.postal_code),
          country_code: fill(prev.country_code, addr?.country_code?.toLowerCase()),
          phone: fill(prev.phone, addr?.phone, customer.phone),
        }));
      } catch {
        /* guests / errors: leave the empty form unchanged */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Render states ----

  if (loading) return <LoadingState t={t} locale={locale} />;
  if (!cart || !cart.items || cart.items.length === 0) return <EmptyCartState t={t} locale={locale} />;

  const hasItems = cart.items && cart.items.length > 0;
  const displaySubtotal = cart.subtotal;
  const displayDiscount = cart.discount_total;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
      <SiteHeader />
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-10 lg:px-16 py-10 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide">
            {t("pageTitle")}
          </h1>
          <div className="w-16 h-0.5 bg-[#2f6f78] mt-4" />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
          {/* ================================================================ */}
          {/* Left Column — Checkout Steps */}
          {/* ================================================================ */}
          <div className="order-2 lg:order-1">
            <StepIndicator currentStep={currentStep} tsteps={tsteps} />
      
            {/* ---- Step 1: Contact & Address ---- */}
            {currentStep === "contact" && (
              <form onSubmit={handleContactSubmit} className="space-y-8">
                <div className="space-y-1">
                  <h2 ref={headingRef} tabIndex={-1} className="font-serif text-xl tracking-wide focus:outline-none">
                    {tc("heading")}
                  </h2>
                  <p className="text-sm text-[#2c211b]/50">
                    {tc("desc")}
                  </p>
                </div>
      
                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-email"
                    className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                  >
                    {tc("email")} *
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    autoComplete="email"
                    enterKeyHint="next"
                    value={contactForm.email}
                    onChange={(e) => updateContactField("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    aria-invalid={!!fieldErrors.email || undefined}
                    aria-describedby={fieldErrors.email ? "checkout-email-error" : undefined}
                    className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                    placeholder={tc("emailPlaceholder")}
                  />
                  {fieldErrorEl("email")}
                </div>
      
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-first-name"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("firstName")} *
                    </label>
                    <input
                      id="checkout-first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      enterKeyHint="next"
                      value={contactForm.first_name}
                      onChange={(e) =>
                        updateContactField("first_name", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("first_name")}
                      aria-invalid={!!fieldErrors.first_name || undefined}
                      aria-describedby={fieldErrors.first_name ? "checkout-first-name-error" : undefined}
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("firstNamePlaceholder")}
                    />
                    {fieldErrorEl("first_name")}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-last-name"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("lastName")} *
                    </label>
                    <input
                      id="checkout-last-name"
                      type="text"
                      required
                      autoComplete="family-name"
                      enterKeyHint="next"
                      value={contactForm.last_name}
                      onChange={(e) =>
                        updateContactField("last_name", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("last_name")}
                      aria-invalid={!!fieldErrors.last_name || undefined}
                      aria-describedby={fieldErrors.last_name ? "checkout-last-name-error" : undefined}
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("lastNamePlaceholder")}
                    />
                    {fieldErrorEl("last_name")}
                  </div>
                </div>
      
                {/* Address */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-address"
                    className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                  >
                    {tc("address")} *
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    required
                    autoComplete="street-address"
                    enterKeyHint="next"
                    value={contactForm.address_1}
                    onChange={(e) =>
                      updateContactField("address_1", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("address_1")}
                    aria-invalid={!!fieldErrors.address_1 || undefined}
                    aria-describedby={fieldErrors.address_1 ? "checkout-address-error" : undefined}
                    className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                    placeholder={tc("addressPlaceholder")}
                  />
                  {fieldErrorEl("address_1")}
                </div>
      
                {/* Country / City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-country"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("country")} *
                    </label>
                    <div className="relative">
                      <select
                        id="checkout-country"
                        required
                        autoComplete="country"
                        value={contactForm.country_code}
                        onChange={(e) => {
                          const code = e.target.value;
                          // Reset city when the country changes so it always matches
                          // the selected country (and its suggestion list).
                          setContactForm((prev) => ({ ...prev, country_code: code, city: "" }));
                          setFieldErrors((prev) => {
                            if (!prev.country_code && !prev.city) return prev;
                            const next = { ...prev };
                            delete next.country_code;
                            delete next.city;
                            return next;
                          });
                        }}
                        onBlur={() => handleFieldBlur("country_code")}
                        aria-invalid={!!fieldErrors.country_code || undefined}
                        aria-describedby={fieldErrors.country_code ? "checkout-country-error" : undefined}
                        className="w-full appearance-none px-4 py-3 pr-10 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] focus:outline-none focus:border-[#2f6f78] transition-colors"
                      >
                        {countries.length === 0 ? (
                          <option value={contactForm.country_code} disabled>
                            {tc("countryLoading")}
                          </option>
                        ) : (
                          countries.map((code) => (
                            <option key={code} value={code}>
                              {regionNames?.of(code.toUpperCase()) ?? code.toUpperCase()}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2c211b]/50"
                      />
                    </div>
                    {fieldErrorEl("country_code")}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-city"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("city")} *
                    </label>
                    <CityCombobox
                      id="checkout-city"
                      value={contactForm.city}
                      suggestions={CITY_SUGGESTIONS[contactForm.country_code] ?? []}
                      placeholder={tc("cityPlaceholder")}
                      invalid={!!fieldErrors.city}
                      describedBy={fieldErrors.city ? "checkout-city-error" : undefined}
                      onChange={(v) => updateContactField("city", v)}
                      onBlur={() => handleFieldBlur("city")}
                    />
                    {fieldErrorEl("city")}
                  </div>
                </div>
      
                {/* Postal Code / Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-postal"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("postalCode")} *
                    </label>
                    <input
                      id="checkout-postal"
                      type="text"
                      inputMode="numeric"
                      required
                      autoComplete="postal-code"
                      enterKeyHint="next"
                      value={contactForm.postal_code}
                      onChange={(e) =>
                        updateContactField("postal_code", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("postal_code")}
                      aria-invalid={!!fieldErrors.postal_code || undefined}
                      aria-describedby={fieldErrors.postal_code ? "checkout-postal-error" : undefined}
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("postalCodePlaceholder")}
                    />
                    {fieldErrorEl("postal_code")}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="checkout-phone"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("phone")} *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      aria-required="true"
                      autoComplete="tel"
                      enterKeyHint="done"
                      value={contactForm.phone}
                      onChange={(e) =>
                        updateContactField("phone", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("phone")}
                      aria-invalid={!!fieldErrors.phone || undefined}
                      aria-describedby={fieldErrors.phone ? "checkout-phone-error" : undefined}
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("phonePlaceholder")}
                    />
                    {fieldErrorEl("phone")}
                  </div>
                </div>

                {/* Promotion section */}
                <div className="space-y-2 border-t border-[#2c211b]/10 pt-6">
                  <label
                    htmlFor="checkout-promo-code"
                    className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                  >
                    {tpromo("label")}
                  </label>
                  {appliedPromotion ? (
                    <div className="flex items-center justify-between p-3.5 bg-white border border-[#2f6f78]/30">
                      <span className="text-sm font-medium text-[#2f6f78] uppercase">
                        {appliedPromotion.code ?? tpromo("applied")}
                      </span>
                      <span role="status" aria-live="polite" className="text-xs text-[#2f6f78] font-medium">
                        {tpromo("applied")}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <input
                          id="checkout-promo-code"
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            if (promoError) setPromoError(null);
                          }}
                          disabled={promoSubmitting || mutating}
                          aria-invalid={!!promoError || undefined}
                          aria-describedby={
                            promoError
                              ? "checkout-promo-error"
                              : promoSuccess
                                ? "checkout-promo-success"
                                : undefined
                          }
                          className="flex-1 px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors disabled:opacity-50"
                          placeholder={tpromo("placeholder")}
                        />
                        <button
                          type="button"
                          onClick={() => handlePromotionSubmit()}
                          disabled={promoSubmitting || mutating}
                          className="px-6 py-3 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {promoSubmitting ? ta("saving") : tpromo("apply")}
                        </button>
                      </div>
                      {promoError && (
                        <p
                          id="checkout-promo-error"
                          role="alert"
                          aria-live="assertive"
                          className="text-xs text-red-600 mt-1"
                        >
                          {promoError}
                        </p>
                      )}
                      {promoSuccess && (
                        <p
                          id="checkout-promo-success"
                          role="status"
                          aria-live="polite"
                          className="text-xs text-[#2f6f78] mt-1 font-medium"
                        >
                          {promoSuccess}
                        </p>
                      )}
                    </>
                  )}
                </div>
      
                {stepError && (
                  <div
                    id="checkout-contact-error"
                    role="alert"
                    aria-live="assertive"
                    className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs"
                  >
                    {stepError}
                  </div>
                )}
      
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={stepSubmitting}
                    aria-describedby="checkout-contact-error"
                    className="inline-flex items-center justify-center px-10 py-3.5 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {stepSubmitting ? ta("saving") : ta("continue")}
                  </button>
                  <Link
                    href={`/${locale}/products`}
                    className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/50 hover:text-[#2c211b] transition-colors"
                  >
                    {ta("cancel")}
                  </Link>
                </div>
              </form>
            )}
      
            {/* ---- Step 2: Shipping Method ---- */}
            {currentStep === "shipping" && (
              <form onSubmit={handleShippingSubmit} className="space-y-8">
                <div className="space-y-1">
                  <h2 ref={headingRef} tabIndex={-1} className="font-serif text-xl tracking-wide focus:outline-none">
                    {ts("heading")}
                  </h2>
                  <p className="text-sm text-[#2c211b]/50">
                    {ts("desc")}
                  </p>
                </div>
      
                {shippingLoading ? (
                  <div className="flex items-center gap-3 py-8">
                    <div aria-hidden="true" className="w-5 h-5 border-2 border-[#2f6f78] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
                    <span role="status" aria-live="polite" className="text-sm text-[#2c211b]/50">
                      {ts("loading")}
                    </span>
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <p className="text-sm text-[#2c211b]/50 py-4">
                    {ts("noneAvailable")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                          selectedOrCartShippingId === option.id
                            ? "border-[#2f6f78] bg-[#2f6f78]/5"
                            : "border-[#2c211b]/10 bg-white hover:border-[#2c211b]/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_option"
                          value={option.id}
                          checked={selectedOrCartShippingId === option.id}
                          onChange={() => handleSelectShipping(option.id)}
                          className="accent-[#2f6f78]"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {option.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#2c211b]">
                          {(option.amount ?? option.calculated_amount) === 0
                            ? t("summary.shippingFree")
                            : formatPrice(
                                option.amount ?? option.calculated_amount,
                                option.currency_code,
                                locale,
                              )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
      
                {stepError && (
                  <div
                    id="checkout-shipping-error"
                    role="alert"
                    aria-live="assertive"
                    className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs"
                  >
                    {stepError}
                  </div>
                )}
      
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("contact")}
                    className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/50 hover:text-[#2c211b] transition-colors"
                  >
                    {ta("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={stepSubmitting || !selectedOrCartShippingId}
                    aria-describedby="checkout-shipping-error"
                    className="inline-flex items-center justify-center px-10 py-3.5 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {stepSubmitting
                      ? ta("saving")
                      : ta("continueToPayment")}
                  </button>
                </div>
              </form>
            )}
      
            {/* ---- Step 3: Payment ---- */}
            {currentStep === "payment" && (
              <form onSubmit={handlePaymentSubmit} className="space-y-8">
                <div className="space-y-1">
                  <h2 ref={headingRef} tabIndex={-1} className="font-serif text-xl tracking-wide focus:outline-none">
                    {tp("heading")}
                  </h2>
                  <p className="text-sm text-[#2c211b]/50">
                    {tp("desc")}
                  </p>
                </div>
      
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border border-[#2f6f78] bg-[#2f6f78]/5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      defaultChecked
                      className="accent-[#2f6f78]"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {tp("methodLabel")}
                      </span>
                      <p className="text-xs text-[#2c211b]/40 mt-0.5">
                        {tp("methodDesc")}
                      </p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center rounded border border-[#2c211b]/15">
                      <svg
                        aria-hidden="true"
                        focusable="false"
                        className="w-5 h-5 text-[#2c211b]/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                    </div>
                  </label>
                </div>
      
                <p className="flex items-center gap-1.5 text-xs text-[#2c211b]/50">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6.75a2.25 2.25 0 012.25-2.25z"
                    />
                  </svg>
                  {tp("secureNote")}
                </p>
      
                {completionError && (
                  <div
                    id="checkout-payment-error"
                    role="alert"
                    aria-live="assertive"
                    className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs"
                  >
                    {completionError}
                  </div>
                )}
      
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep("shipping")}
                    disabled={completing}
                    className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/50 hover:text-[#2c211b] transition-colors disabled:opacity-30"
                  >
                    {ta("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={completing}
                    aria-describedby="checkout-payment-error"
                    className="inline-flex items-center justify-center px-10 py-3.5 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? (
                      <>
                        <span aria-hidden="true" className="w-4 h-4 border-2 border-[#f4ebe6] border-t-transparent rounded-full animate-spin motion-reduce:animate-none mr-2" />
                        <span role="status" aria-live="polite">{ta("processing")}</span>
                      </>
                    ) : (
                      ta("placeOrderWithTotal", {
                        total: formatPrice(cart.total, cart.currency_code ?? "dkk", locale),
                      })
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
      
          {/* ================================================================ */}
          {/* Right Column — Order Summary */}
          {/* ================================================================ */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-10 self-start">
            <div className="bg-white border border-[#2c211b]/8 p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setSummaryOpen((open) => !open)}
                aria-expanded={summaryOpen}
                aria-controls="order-summary-content"
                className="flex w-full items-center justify-between lg:hidden mb-4"
              >
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#2f6f78]">
                  {summaryOpen ? tsm("hideSummary") : tsm("showSummary")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {formatPrice(cart.total, cart.currency_code ?? "dkk", locale)}
                  </span>
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className={`w-4 h-4 text-[#2c211b]/50 transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </span>
              </button>
              <div
                id="order-summary-content"
                className={`${summaryOpen ? "block" : "hidden"} lg:block`}
              >
              <h3 className="font-serif text-lg tracking-wide mb-6">
                {tsm("yourOrder")}
              </h3>
      
              {/* Line items */}
              {hasItems ? (
                <ul className="space-y-4 mb-6 pb-6 border-b border-[#2c211b]/8">
                  {(cart.items?.filter((item) => !item.metadata?.parent_line_item_id) ?? []).map((mainItem) => {
                    const linkedPackaging = cart.items?.find(
                      (item) => item.metadata?.parent_line_item_id === mainItem.id
                    );
                    const calcPrice = mainItem.metadata?.calculated_price;
                    const hasDiscount =
                      calcPrice?.original_amount != null &&
                      calcPrice.currency_code === cart.currency_code &&
                      calcPrice.original_amount > mainItem.unit_price;
                    return (
                      <li key={mainItem.id} className="flex gap-4">
                        {mainItem.thumbnail && (
                          <div className="w-14 h-14 shrink-0 bg-[#f4ebe6] overflow-hidden">
                            <ProductImage
                              src={mainItem.thumbnail}
                              alt={mainItem.title || "Product thumbnail"}
                              width={56}
                              height={56}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {mainItem.product?.title ?? mainItem.title}
                              {mainItem.quantity > 1 && (
                                <span className="text-xs text-[#2c211b]/50 ml-1">× {mainItem.quantity}</span>
                              )}
                            </p>
                            <span className="text-sm font-semibold shrink-0 flex items-baseline">
                              {hasDiscount && (
                                <span className="line-through text-[#2c211b]/40 mr-1.5 text-xs font-normal">
                                  {formatPrice(
                                    calcPrice.original_amount! * mainItem.quantity,
                                    cart.currency_code ?? "dkk",
                                    locale,
                                  )}
                                </span>
                              )}
                              <span>
                                {formatPrice(
                                  mainItem.total,
                                  cart.currency_code ?? "dkk",
                                  locale,
                                )}
                              </span>
                              {hasDiscount && (
                                <span className="ml-1.5 text-[10px] font-bold text-[#b85c3a]">
                                  −{Math.round((1 - mainItem.unit_price / calcPrice.original_amount!) * 100)}%
                                </span>
                              )}
                            </span>
                          </div>
                          {mainItem.variant?.title &&
                            mainItem.variant.title !== mainItem.title && (
                              <p className="text-xs text-[#2c211b]/40 mt-0.5 truncate">
                                {mainItem.variant.title}
                              </p>
                            )}
                          {linkedPackaging && (
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#2c211b]/6">
                              <span className="text-xs text-[#2c211b]/50 italic truncate">
                                + {getPackagingName(
                                    linkedPackaging.product,
                                    locale,
                                    linkedPackaging.title,
                                  )}
                              </span>
                              <span className="text-xs text-[#2c211b]/60 font-medium whitespace-nowrap">
                                {formatPrice(linkedPackaging.total, cart.currency_code ?? "dkk", locale)}
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-[#2c211b]/50 mb-6">
                  {t("noItems")}
                </p>
              )}
      
              {/* Totals */}
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#2c211b]/60">{tsm("subtotal")}</dt>
                  <dd className="font-medium">
                    {formatPrice(
                      displaySubtotal,
                      cart.currency_code ?? "dkk",
                      locale,
                    )}
                  </dd>
                </div>
                {displayDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#2c211b]/60">{tsm("discount")}</dt>
                    <dd className="font-medium text-[#b85c3a]">
                      −{formatPrice(displayDiscount, cart.currency_code ?? "dkk", locale)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#2c211b]/60">{tsm("shipping")}</dt>
                  <dd className="font-medium">
                    {cart.shipping_methods && cart.shipping_methods.length > 0
                      ? cart.shipping_total > 0
                        ? formatPrice(
                            cart.shipping_total,
                            cart.currency_code ?? "dkk",
                            locale,
                          )
                        : tsm("shippingFree")
                      : tsm("shippingPending")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#2c211b]/60">{tsm("tax")}</dt>
                  <dd className="font-medium">
                    {cart.tax_total > 0
                      ? formatPrice(
                          cart.tax_total,
                          cart.currency_code ?? "dkk",
                          locale,
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#2c211b]/15 text-base">
                  <dt className="font-semibold">{tsm("total")}</dt>
                  <dd className="font-bold">
                    {formatPrice(
                      cart.total,
                      cart.currency_code ?? "dkk",
                      locale,
                    )}
                  </dd>
                </div>
              </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
