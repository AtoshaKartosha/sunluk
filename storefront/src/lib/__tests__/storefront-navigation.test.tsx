import type { AnchorHTMLAttributes } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteHeader from "../../components/landing/SiteHeader";
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));


vi.mock("@/components/cart/CartContext", () => ({
  useCart: () => ({ itemCount: 0, openCart: vi.fn() }),
}));

vi.mock("@/components/product", () => ({
  LocaleSwitcher: () => <button type="button">locale control</button>,
}));

let resizeHandler: ((event: MediaQueryListEvent) => void) | undefined;

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "openMenu" }));
  const menu = document.getElementById("mobile-navigation-menu");
  expect(menu).toBeInTheDocument();
  return menu as HTMLElement;
}

describe("storefront mobile navigation", () => {
  beforeEach(() => {
    resizeHandler = undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addEventListener: (
          type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          if (type === "change") resizeHandler = listener;
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("opens from an accessible trigger and exposes the controlled menu", () => {
    render(<SiteHeader />);

    const trigger = screen.getByRole("button", { name: "openMenu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "mobile-navigation-menu");

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "closeMenu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(document.getElementById("mobile-navigation-menu")).toBeInTheDocument();
  });

  it("closes on the backdrop without activating underlying content", () => {
    const activateUnderlying = vi.fn();
    render(
      <>
        <SiteHeader />
        <button type="button" onClick={activateUnderlying}>
          underlying content
        </button>
      </>,
    );
    openMenu();
    const trigger = screen.getByRole("button", { name: "closeMenu" });
    const backdrop = screen.getByTestId("mobile-menu-backdrop");

    fireEvent.pointerDown(backdrop);
    fireEvent.mouseDown(backdrop);
    fireEvent.pointerUp(backdrop);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("mobile-navigation-menu")).not.toBeInTheDocument();
    expect(activateUnderlying).not.toHaveBeenCalled();
  });

  it("keeps the menu open for an inside non-link interaction", () => {
    render(<SiteHeader />);
    const menu = openMenu();

    fireEvent.click(within(menu).getByRole("button", { name: "locale control" }));

    expect(document.getElementById("mobile-navigation-menu")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    render(<SiteHeader />);
    openMenu();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.getElementById("mobile-navigation-menu")).not.toBeInTheDocument();
  });

  it("uses the current locale destination and closes after link activation", () => {
    render(<SiteHeader />);
    const menu = openMenu();
    const collectionLink = within(menu).getByRole("link", { name: "КОЛЛЕКЦИЯ" });

    expect(collectionLink).toHaveAttribute("href", "/ru#collection");
    fireEvent.click(collectionLink);

    expect(document.getElementById("mobile-navigation-menu")).not.toBeInTheDocument();
  });

  it("resets the menu when the viewport reaches the md breakpoint", () => {
    render(<SiteHeader />);
    openMenu();

    act(() => resizeHandler?.({ matches: true } as MediaQueryListEvent));

    expect(document.getElementById("mobile-navigation-menu")).not.toBeInTheDocument();
  });
});
