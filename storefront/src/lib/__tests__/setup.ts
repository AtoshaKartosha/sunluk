import React from "react";
import { vi } from "vitest";
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: vi.fn((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ru",
}));
