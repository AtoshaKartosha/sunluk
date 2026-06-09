"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !currency) return "—";
  try {
    return new Intl.NumberFormat("ru-RU", {
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
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#2f6f78] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#2c211b]/60 tracking-wide">
            {t("loading")}
          </p>
        </div>
      </main>
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
      <main className="flex-1 flex items-center justify-center">
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
      </main>
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

// ---------------------------------------------------------------------------
// Main Checkout Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, clearCart, setCart } = useCart();
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tc = useTranslations("checkout.contact");
  const ts = useTranslations("checkout.shipping");
  const tp = useTranslations("checkout.payment");
  const ta = useTranslations("checkout.actions");
  const tsm = useTranslations("checkout.summary");
  const tsteps = useTranslations("checkout.steps");

  // ---- Step state ----
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("contact");
  const [contactForm, setContactForm] = useState<ContactShippingFormState>(EMPTY_ADDRESS);
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // ---- Shipping state ----
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);

  // ---- Payment state ----
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const selectedOrCartShippingId =
    selectedShippingId ?? cart?.shipping_methods?.[0]?.shipping_option_id ?? null;



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

  const handleContactSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cart?.id) return;
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
          phone: contactForm.phone,
        };

        const updatedCart = await updateCart(cart.id, {
          email: contactForm.email,
          shipping_address: address,
          billing_address: address,
        });
        setCart(updatedCart as unknown as StoreCart);

        setCurrentStep("shipping");
      } catch {
        setStepError(t("errors.contactSaveFailed"));
      } finally {
        setStepSubmitting(false);
      }
    },
    [cart, contactForm, setCart, t],
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
          router.push(`/${locale}/checkout/success?order_id=${result.order.id}`);
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
    },
    [],
  );

  // ---- Render states ----

  if (loading) return <LoadingState t={t} locale={locale} />;
  if (!cart || !cart.items || cart.items.length === 0) return <EmptyCartState t={t} locale={locale} />;

  const hasItems = cart.items && cart.items.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased">
      <SiteHeader />
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-10 lg:px-16 py-10 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-12">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78]">
            {t("pageLabel")}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide mt-2">
            {t("pageTitle")}
          </h1>
          <div className="w-16 h-0.5 bg-[#2f6f78] mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20">
          {/* ================================================================ */}
          {/* Left Column — Checkout Steps */}
          {/* ================================================================ */}
          <div>
            <StepIndicator currentStep={currentStep} tsteps={tsteps} />

            {/* ---- Step 1: Contact & Address ---- */}
            {currentStep === "contact" && (
              <form onSubmit={handleContactSubmit} className="space-y-8">
                <div className="space-y-1">
                  <h2 className="font-serif text-xl tracking-wide">
                    {tc("heading")}
                  </h2>
                  <p className="text-sm text-[#2c211b]/50">
                    {tc("desc")}
                  </p>
                </div>

                {/* Email */}
                <fieldset className="space-y-1.5">
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
                    value={contactForm.email}
                    onChange={(e) => updateContactField("email", e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                    placeholder={tc("emailPlaceholder")}
                  />
                </fieldset>

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <fieldset className="space-y-1.5">
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
                      value={contactForm.first_name}
                      onChange={(e) =>
                        updateContactField("first_name", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("firstNamePlaceholder")}
                    />
                  </fieldset>
                  <fieldset className="space-y-1.5">
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
                      value={contactForm.last_name}
                      onChange={(e) =>
                        updateContactField("last_name", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("lastNamePlaceholder")}
                    />
                  </fieldset>
                </div>

                {/* Address */}
                <fieldset className="space-y-1.5">
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
                    value={contactForm.address_1}
                    onChange={(e) =>
                      updateContactField("address_1", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                    placeholder={tc("addressPlaceholder")}
                  />
                </fieldset>

                {/* City / Postal Code / Country / Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <fieldset className="space-y-1.5">
                    <label
                      htmlFor="checkout-city"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("city")} *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      value={contactForm.city}
                      onChange={(e) => updateContactField("city", e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("cityPlaceholder")}
                    />
                  </fieldset>
                  <fieldset className="space-y-1.5">
                    <label
                      htmlFor="checkout-postal"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("postalCode")} *
                    </label>
                    <input
                      id="checkout-postal"
                      type="text"
                      required
                      value={contactForm.postal_code}
                      onChange={(e) =>
                        updateContactField("postal_code", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("postalCodePlaceholder")}
                    />
                  </fieldset>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <fieldset className="space-y-1.5">
                    <label
                      htmlFor="checkout-country"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("countryCode")} *
                    </label>
                    <input
                      id="checkout-country"
                      type="text"
                      required
                      value={contactForm.country_code}
                      onChange={(e) =>
                        updateContactField("country_code", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("countryCodePlaceholder")}
                    />
                  </fieldset>
                  <fieldset className="space-y-1.5">
                    <label
                      htmlFor="checkout-phone"
                      className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/70"
                    >
                      {tc("phone")}
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) =>
                        updateContactField("phone", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-[#2c211b]/15 text-sm text-[#2c211b] placeholder:text-[#2c211b]/30 focus:outline-none focus:border-[#2f6f78] transition-colors"
                      placeholder={tc("phonePlaceholder")}
                    />
                  </fieldset>
                </div>

                {stepError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                    {stepError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={stepSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-3.5 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stepSubmitting ? ta("saving") : ta("continue")}
                </button>
              </form>
            )}

            {/* ---- Step 2: Shipping Method ---- */}
            {currentStep === "shipping" && (
              <form onSubmit={handleShippingSubmit} className="space-y-8">
                <div className="space-y-1">
                  <h2 className="font-serif text-xl tracking-wide">
                    {ts("heading")}
                  </h2>
                  <p className="text-sm text-[#2c211b]/50">
                    {ts("desc")}
                  </p>
                </div>

                {shippingLoading ? (
                  <div className="flex items-center gap-3 py-8">
                    <div className="w-5 h-5 border-2 border-[#2f6f78] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-[#2c211b]/50">
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
                          onChange={() => setSelectedShippingId(option.id)}
                          className="accent-[#2f6f78]"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {option.name}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#2c211b]">
                          {formatPrice(
                            option.amount ?? option.calculated_amount,
                            option.currency_code,
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {stepError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
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
                  <h2 className="font-serif text-xl tracking-wide">
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

                {completionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
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
                    className="inline-flex items-center justify-center px-10 py-3.5 bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2f6f78] text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-[#f4ebe6] border-t-transparent rounded-full animate-spin mr-2" />
                        {ta("processing")}
                      </>
                    ) : (
                      ta("placeOrder")
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ================================================================ */}
          {/* Right Column — Order Summary */}
          {/* ================================================================ */}
          <div className="lg:sticky lg:top-10 self-start">
            <div className="bg-white border border-[#2c211b]/8 p-6 sm:p-8">
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
                    const rowTotal = mainItem.total + (linkedPackaging?.total ?? 0);
                    return (
                      <li key={mainItem.id} className="flex gap-4">
                        {mainItem.thumbnail && (
                          <div className="w-14 h-14 shrink-0 bg-[#f4ebe6] overflow-hidden">
                            <Image
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
                          <p className="text-sm font-medium truncate">
                            {mainItem.title}
                          </p>
                          {mainItem.variant?.title &&
                            mainItem.variant.title !== mainItem.title && (
                              <p className="text-xs text-[#2c211b]/40 mt-0.5 truncate">
                                {mainItem.variant.title}
                              </p>
                            )}
                          {linkedPackaging && (
                            <p className="text-xs text-[#2c211b]/50 mt-1 italic">
                              + {linkedPackaging.title} ({formatPrice(linkedPackaging.unit_price, cart.currency_code)})
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-[#2c211b]/50">
                              × {mainItem.quantity}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatPrice(
                                rowTotal,
                                cart.currency_code ?? "dkk",
                              )}
                            </span>
                          </div>
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
                      cart.subtotal,
                      cart.currency_code ?? "dkk",
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#2c211b]/60">{tsm("shipping")}</dt>
                  <dd className="font-medium">
                    {cart.shipping_total > 0
                      ? formatPrice(
                          cart.shipping_total,
                          cart.currency_code ?? "dkk",
                        )
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#2c211b]/60">{tsm("tax")}</dt>
                  <dd className="font-medium">
                    {cart.tax_total > 0
                      ? formatPrice(
                          cart.tax_total,
                          cart.currency_code ?? "dkk",
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
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
