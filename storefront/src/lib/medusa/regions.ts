import { getMedusaClient } from "../medusa";

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
): Promise<ResolvedRegion> {
  const code =
    countryCode ?? process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "dk";

  const sdk = getMedusaClient();

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
