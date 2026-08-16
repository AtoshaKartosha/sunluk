import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const defaultRegionList = vi.fn();
const localeRegionList = vi.fn();

vi.mock("../medusa", () => ({
  getMedusaClient: () => ({
    store: { region: { list: defaultRegionList } },
  }),
  getMedusaClientWithLocale: () => ({
    store: { region: { list: localeRegionList } },
  }),
}));

import { getStoreCountries, resolveRegion } from "../medusa/regions";

const region = (id: string, country: string, currency: string) => ({
  id,
  name: id,
  currency_code: currency,
  countries: [{ iso_2: country }],
});

describe("resolveRegion", () => {
  beforeEach(() => {
    defaultRegionList.mockReset();
    localeRegionList.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    defaultRegionList.mockReset();
    localeRegionList.mockReset();
  });

  it("prefers an explicit country over the ru-RU locale", async () => {
    localeRegionList.mockResolvedValue({
      regions: [region("reg_de", "de", "eur"), region("reg_ru", "ru", "rub")],
    });

    await expect(resolveRegion("de", "ru-RU")).resolves.toEqual({
      regionId: "reg_de",
      name: "reg_de",
      currencyCode: "EUR",
      countryCode: "de",
    });
    expect(defaultRegionList).not.toHaveBeenCalled();
  });

  it("uses ru for an omitted country with the ru-RU locale", async () => {
    localeRegionList.mockResolvedValue({
      regions: [region("reg_ru", "ru", "rub")],
    });

    await expect(resolveRegion(undefined, "ru-RU")).resolves.toEqual({
      regionId: "reg_ru",
      name: "reg_ru",
      currencyCode: "RUB",
      countryCode: "ru",
    });
  });

  it("uses NEXT_PUBLIC_DEFAULT_REGION for an omitted non-RU locale", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_REGION", "de");
    localeRegionList.mockResolvedValue({
      regions: [region("reg_de", "de", "eur")],
    });

    await expect(resolveRegion(undefined, "en-US")).resolves.toEqual({
      regionId: "reg_de",
      name: "reg_de",
      currencyCode: "EUR",
      countryCode: "de",
    });
  });

  it("falls back to dk when NEXT_PUBLIC_DEFAULT_REGION is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_REGION", undefined);
    defaultRegionList.mockResolvedValue({
      regions: [region("reg_dk", "dk", "dkk")],
    });

    await expect(resolveRegion()).resolves.toEqual({
      regionId: "reg_dk",
      name: "reg_dk",
      currencyCode: "DKK",
      countryCode: "dk",
    });
  });

  it("returns an unsupported result for an explicit unsupported country", async () => {
    defaultRegionList.mockResolvedValue({
      regions: [region("reg_dk", "dk", "dkk")],
    });

    await expect(resolveRegion("xx")).resolves.toEqual({
      type: "unsupported",
      countryCode: "xx",
    });
  });
});

describe("getStoreCountries", () => {
  it("returns the unique countries supported across every region", async () => {
    defaultRegionList.mockResolvedValue({
      regions: [
        { ...region("reg_eu", "de", "eur"), countries: [{ iso_2: "DE" }, { iso_2: "dk" }] },
        { ...region("reg_ru", "ru", "rub"), countries: [{ iso_2: "ru" }, { iso_2: "de" }] },
      ],
    });

    await expect(getStoreCountries()).resolves.toEqual(["de", "dk", "ru"]);
  });
});
