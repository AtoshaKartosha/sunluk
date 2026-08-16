import { getMedusaClient, getMedusaClientWithLocale } from "../medusa";

// ---- Types ----

export interface RegionResult {
  regionId: string;
  name: string;
  currencyCode: string;
  countryCode: string;
}

export interface RegionUnsupported {
  type: "unsupported";
  countryCode: string;
}

export type ResolvedRegion = RegionResult | RegionUnsupported;

// ---- Helpers ----

/**
 * Resolve a region by the given country code.
 *
 * - `countryCode` defaults to `NEXT_PUBLIC_DEFAULT_REGION` or `"dk"`.
 * - Lists all store regions and matches the first region containing the code.
 * - Returns a discriminated `RegionUnsupported` when no region matches.
 *   Callers MUST handle the unsupported case; no silent fallback.
 */
export async function resolveRegion(
  countryCode?: string,
  medusaLocale?: string,
): Promise<ResolvedRegion> {
  // ponytail: RU locale forces RUB currency via the "ru" country. Other
  // locales fall back to the env default (e.g. "dk"/"de").
  const defaultCountry =
    medusaLocale === "ru-RU" ? "ru" : (process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "dk");
  const code = countryCode ?? defaultCountry;

  const sdk = medusaLocale
    ? getMedusaClientWithLocale(medusaLocale)
    : getMedusaClient();

  const { regions } = (await sdk.store.region.list({
    fields: "id,name,currency_code,*countries",
    limit: 250, // regions are typically few; generous bound avoids pagination
  })) as unknown as {
    regions: Array<{
      id: string;
      name: string;
      currency_code: string;
      countries: Array<{ iso_2: string }> | null;
    }>;
  };

  const match = regions.find((r) =>
    r.countries?.some(
      (c) => c.iso_2?.toLowerCase() === code.toLowerCase(),
    ),
  );

  if (!match) {
    return { type: "unsupported", countryCode: code };
  }

  return {
    regionId: match.id,
    name: match.name,
    currencyCode: match.currency_code.toUpperCase(),
    countryCode: code,
  };
}

/**
 * List every ISO-2 country code (lowercased) supported by a store region.
 */
export async function getStoreCountries(): Promise<string[]> {
  const sdk = getMedusaClient();

  const { regions } = (await sdk.store.region.list({
    fields: "id,name,currency_code,*countries",
    limit: 250,
  })) as unknown as {
    regions: Array<{
      id: string;
      countries: Array<{ iso_2: string }> | null;
    }>;
  };

  return [
    ...new Set(
      regions.flatMap(
        (region) =>
          region.countries
            ?.map((country) => country.iso_2?.toLowerCase())
            .filter((code): code is string => Boolean(code)) ?? [],
      ),
    ),
  ];
}
