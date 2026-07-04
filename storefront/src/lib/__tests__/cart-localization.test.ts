import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPackagingName, RU_PACKAGING_NAMES, EN_PACKAGING_NAMES } from "../medusa/packaging-names";

// Mock the medusa client SDK functions before importing regions.ts
const listMock = vi.fn();
vi.mock("../medusa", () => ({
  getMedusaClient: () => ({
    store: {
      region: {
        list: listMock,
      },
    },
  }),
  getMedusaClientWithLocale: () => ({
    store: {
      region: {
        list: listMock,
      },
    },
  }),
}));

import { resolveRegion } from "../medusa/regions";

describe("getPackagingName", () => {
  it("resolves RU packaging names from handle map when locale is RU", () => {
    for (const [handle, ruName] of Object.entries(RU_PACKAGING_NAMES)) {
      const result = getPackagingName({ handle }, "ru");
      expect(result).toBe(ruName);
      // It should not be the English version
      expect(result).not.toBe(EN_PACKAGING_NAMES[handle]);
    }
  });

  it("resolves EN packaging names from handle map when locale is EN", () => {
    for (const [handle, enName] of Object.entries(EN_PACKAGING_NAMES)) {
      const result = getPackagingName({ handle }, "en");
      expect(result).toBe(enName);
      // It should not be the Russian version
      expect(result).not.toBe(RU_PACKAGING_NAMES[handle]);
    }
  });

  it("falls back to snapshot if handle is not in the map", () => {
    const result = getPackagingName({ handle: "unknown-handle" }, "ru", "Снапшот");
    expect(result).toBe("Снапшот");
  });

  it("falls back to product title if no snapshot is available and handle is not mapped", () => {
    const result = getPackagingName({ handle: "unknown-handle", title: "Base Title" }, "ru");
    expect(result).toBe("Base Title");
  });

  it("is null-safe and returns empty string if no info is available", () => {
    expect(getPackagingName(null, "ru")).toBe("");
    expect(getPackagingName(undefined, "ru")).toBe("");
    expect(getPackagingName(undefined, "ru", "Snap")).toBe("Snap");
  });
});

describe("resolveRegion", () => {
  beforeEach(() => {
    listMock.mockReset();
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_REGION", "dk");
  });

  it("resolves RU region mapping to RUB", async () => {
    listMock.mockResolvedValue({
      regions: [
        {
          id: "reg_ru",
          name: "Russia",
          currency_code: "rub",
          countries: [{ iso_2: "ru" }],
        },
        {
          id: "reg_eu",
          name: "Europe",
          currency_code: "eur",
          countries: [{ iso_2: "de" }],
        },
      ],
    });

    const result = await resolveRegion(undefined, "ru-RU");
    expect(result).toEqual({
      regionId: "reg_ru",
      name: "Russia",
      currencyCode: "RUB",
      countryCode: "ru",
    });
  });

  it("resolves non-RU region mapping to default region via NEXT_PUBLIC_DEFAULT_REGION", async () => {
    listMock.mockResolvedValue({
      regions: [
        {
          id: "reg_dk",
          name: "Denmark",
          currency_code: "dkk",
          countries: [{ iso_2: "dk" }],
        },
        {
          id: "reg_ru",
          name: "Russia",
          currency_code: "rub",
          countries: [{ iso_2: "ru" }],
        },
      ],
    });

    const result = await resolveRegion(undefined, "en-US");
    expect(result).toEqual({
      regionId: "reg_dk",
      name: "Denmark",
      currencyCode: "DKK",
      countryCode: "dk",
    });
  });

  it("returns unsupported status when region is not found", async () => {
    listMock.mockResolvedValue({
      regions: [
        {
          id: "reg_dk",
          name: "Denmark",
          currency_code: "dkk",
          countries: [{ iso_2: "dk" }],
        },
      ],
    });

    const result = await resolveRegion("xx", "en-US");
    expect(result).toEqual({
      type: "unsupported",
      countryCode: "xx",
    });
  });
});
