import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnalyticsConsent,
  AnalyticsConsentSettingsButton,
  ANALYTICS_CONSENT_STORAGE_KEY,
  METRIKA_COUNTER_ID,
  METRIKA_TAG_SRC,
  initMetrika,
  trackMetrikaAddToCart,
  resetMetrikaStateForTesting,
} from "../../components/analytics/analytics-consent";

let currentPathname = "/ru";
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useSearchParams: () => currentSearchParams,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("analytics consent and Yandex Metrika lifecycle", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/ru");
    currentPathname = "/ru";
    currentSearchParams = new URLSearchParams();
    localStorage.clear();
    sessionStorage.clear();
    resetMetrikaStateForTesting();

    // Clean DOM scripts
    document.querySelectorAll(`script[src="${METRIKA_TAG_SRC}"]`).forEach((el) => el.remove());

    // Clean cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });

    delete window.ym;
    delete window.dataLayer;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the counter-bound tag URL and keeps ym callable for queued methods", () => {
    initMetrika();

    expect(METRIKA_TAG_SRC).toBe("https://mc.yandex.ru/metrika/tag.js?id=111719197");
    expect(document.querySelector<HTMLScriptElement>(`script[src="${METRIKA_TAG_SRC}"]`)?.src).toBe(METRIKA_TAG_SRC);
    expect(window.ym).toBeTypeOf("function");
    window.ym!(METRIKA_COUNTER_ID, "reachGoal", "add_to_cart");
    expect(window.ym?.a).toContainEqual([METRIKA_COUNTER_ID, "reachGoal", "add_to_cart"]);
  });

  it("keeps tracking through retained references when tag.js deletes globals", () => {
    initMetrika();
    const command = window.ym!;
    const dataLayer = window.dataLayer!;
    delete window.ym;
    delete window.dataLayer;

    trackMetrikaAddToCart({
      productId: "prod_123",
      sku: "sku_123",
      name: "Test Product",
      price: 1000,
      quantity: 1,
      currencyCode: "rub",
    });

    expect(dataLayer).toEqual([
      {
        ecommerce: {
          currencyCode: "RUB",
          add: {
            products: [{ id: "sku_123", name: "Test Product", price: 1000, quantity: 1 }],
          },
        },
      },
    ]);
    expect(command.a).toContainEqual([METRIKA_COUNTER_ID, "reachGoal", "add_to_cart"]);
  });

  it("unknown consent shows banner, privacy link, and controls without loading tag.js or calling Metrika", () => {
    render(<AnalyticsConsent />);

    // Banner dialog is displayed
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Privacy policy link is present
    const privacyLink = screen.getByRole("link", { name: "privacyPolicy" });
    expect(privacyLink).toHaveAttribute("href", "/ru/info#privacy");

    // Equal accept and reject controls are present
    expect(screen.getByRole("button", { name: "accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reject" })).toBeInTheDocument();

    // No Yandex script injected and no ym queue initialized
    expect(document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)).toBeNull();
    expect(window.ym).toBeUndefined();
  });

  it("accepting consent persists grant, injects tag.js once, initializes counter 111719197 with options, sends current route hit, does not duplicate on rerender, and tracks route changes", () => {
    const ymSpy = vi.fn();
    window.ym = ymSpy;

    const { rerender } = render(<AnalyticsConsent />);

    const acceptButton = screen.getByRole("button", { name: "accept" });
    act(() => {
      fireEvent.click(acceptButton);
    });

    // Stored choice is granted
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");

    // Banner is dismissed
    expect(screen.queryByRole("dialog")).toBeNull();

    // Script tag injected
    const script = document.querySelector<HTMLScriptElement>(`script[src="${METRIKA_TAG_SRC}"]`);
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
    // window.dataLayer initialized
    expect(window.dataLayer).toEqual([]);

    // Counter initialized with approved options
    expect(ymSpy).toHaveBeenCalledWith(METRIKA_COUNTER_ID, "init", {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: "dataLayer",
      ssr: true,
    });

    const initCalls = ymSpy.mock.calls.filter((call) => call[1] === "init");
    expect(initCalls).toHaveLength(1);

    // Initial page hit sent
    expect(ymSpy).toHaveBeenCalledWith(
      METRIKA_COUNTER_ID,
      "hit",
      expect.any(String),
      expect.objectContaining({
        title: expect.any(String),
      })
    );

    const hitCallsBeforeRerender = ymSpy.mock.calls.filter((call) => call[1] === "hit");
    expect(hitCallsBeforeRerender).toHaveLength(1);

    // Rerender with unchanged URL does not duplicate hit or init
    rerender(<AnalyticsConsent />);

    const initCallsAfterRerender = ymSpy.mock.calls.filter((call) => call[1] === "init");
    expect(initCallsAfterRerender).toHaveLength(1);

    const hitCallsAfterRerender = ymSpy.mock.calls.filter((call) => call[1] === "hit");
    expect(hitCallsAfterRerender).toHaveLength(1);
    // Distinct route change sends exactly one second SPA hit
    act(() => {
      window.history.pushState({}, "", "/ru/products?category=cases");
    });
    currentPathname = "/ru/products";
    currentSearchParams = new URLSearchParams("category=cases");
    rerender(<AnalyticsConsent />);
    const hitCallsAfterRouteChange = ymSpy.mock.calls.filter((call) => call[1] === "hit");
    expect(hitCallsAfterRouteChange).toHaveLength(2);
    expect(hitCallsAfterRouteChange[1][2]).toContain("/ru/products?category=cases");
  });

  it("rejecting consent persists denial, hides banner, and blocks tag injection and ym calls", () => {
    const ymSpy = vi.fn();
    window.ym = ymSpy;

    render(<AnalyticsConsent />);

    const rejectButton = screen.getByRole("button", { name: "reject" });
    act(() => {
      fireEvent.click(rejectButton);
    });

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)).toBeNull();
    expect(ymSpy).not.toHaveBeenCalled();
  });

  it("previously denied consent keeps analytics disabled on mount and throughout route changes", () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");

    const ymSpy = vi.fn();
    window.ym = ymSpy;

    const { rerender } = render(<AnalyticsConsent />);

    // No dialog shown
    expect(screen.queryByRole("dialog")).toBeNull();
    // No script injected
    expect(document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)).toBeNull();
    // Route change
    act(() => {
      window.history.pushState({}, "", "/ru/products");
    });
    currentPathname = "/ru/products";
    rerender(<AnalyticsConsent />);
    expect(document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)).toBeNull();
    expect(ymSpy).not.toHaveBeenCalled();
  });

  it("reopening settings from footer allows withdrawing consent, calling destruct, purging storage/cookies, and blocking later hits", () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    localStorage.setItem("_ym_synced", "true");
    sessionStorage.setItem("_ym_debug", "true");
    document.cookie = "_ym_uid=12345; path=/";
    document.cookie = "gdpr=1; path=/";

    const ymMock = vi.fn();
    window.ym = ymMock;

    const { rerender } = render(
      <>
        <AnalyticsConsent />
        <AnalyticsConsentSettingsButton />
      </>
    );

    // Banner is not open initially for granted user
    expect(screen.queryByRole("dialog")).toBeNull();

    // Click manage settings button
    const settingsButton = screen.getByRole("button", { name: "manage" });
    act(() => {
      fireEvent.click(settingsButton);
    });

    // Reopened dialog appears
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("statusGranted")).toBeInTheDocument();

    // Click withdraw button
    const withdrawButton = screen.getByRole("button", { name: "withdraw" });
    act(() => {
      fireEvent.click(withdrawButton);
    });

    // Status is updated to denied
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");

    // destruct was called on counter
    expect(ymMock).toHaveBeenCalledWith(METRIKA_COUNTER_ID, "destruct");

    // Local and session storage entries starting with _ym are cleared
    expect(localStorage.getItem("_ym_synced")).toBeNull();
    expect(sessionStorage.getItem("_ym_debug")).toBeNull();

    // Dialog is closed
    expect(screen.queryByRole("dialog")).toBeNull();

    // Subsequent route change does not trigger any new hit or ym call after withdrawal
    const totalCallsAfterWithdrawal = ymMock.mock.calls.length;
    act(() => {
      window.history.pushState({}, "", "/ru/products?sort=price");
    });
    currentPathname = "/ru/products";
    currentSearchParams = new URLSearchParams("sort=price");
    rerender(
      <>
        <AnalyticsConsent />
        <AnalyticsConsentSettingsButton />
      </>
    );

    expect(ymMock.mock.calls.length).toBe(totalCallsAfterWithdrawal);
  });

  it("cross-tab storage event updates consent state and triggers lifecycle transitions", () => {
    const ymSpy = vi.fn();
    window.ym = ymSpy;

    render(<AnalyticsConsent />);

    // Simulate another tab granting consent
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: ANALYTICS_CONSENT_STORAGE_KEY,
          newValue: "granted",
        })
      );
    });

    expect(document.querySelector(`script[src="${METRIKA_TAG_SRC}"]`)).not.toBeNull();
    expect(ymSpy).toHaveBeenCalledWith(METRIKA_COUNTER_ID, "init", expect.any(Object));

    // Simulate another tab withdrawing consent
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: ANALYTICS_CONSENT_STORAGE_KEY,
          newValue: "denied",
        })
      );
    });

    expect(ymSpy).toHaveBeenCalledWith(METRIKA_COUNTER_ID, "destruct");
  });

  it("storage read/write failures gracefully degrade without crashing the UI", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    render(<AnalyticsConsent />);

    const acceptButton = screen.getByRole("button", { name: "accept" });
    expect(() => {
      act(() => {
        fireEvent.click(acceptButton);
      });
    }).not.toThrow();

    expect(screen.queryByRole("dialog")).toBeNull();
    setItemSpy.mockRestore();
  });
});
