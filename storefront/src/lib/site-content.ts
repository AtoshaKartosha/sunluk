export type JsonStringTree = { [key: string]: string | JsonStringTree };

export type SiteContentOverrides = {
  messages?: {
    home?: JsonStringTree;
    info?: JsonStringTree;
  };
  navigation?: Partial<Record<"collection" | "details" | "contacts", string>>;
  footer?: Partial<Record<
    | "customerService"
    | "userAgreement"
    | "privacyPolicy"
    | "purchaseTerms"
    | "deliveryPolicy"
    | "returnsPolicy"
    | "requisites"
    | "shop"
    | "allProducts"
    | "questions"
    | "contactUs"
    | "telegram"
    | "instagram"
    | "email"
    | "copyright",
    string
  >>;
};

export function isValidJsonStringTree(val: unknown, depth = 0): boolean {
  if (depth >= 8) return false;
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  const obj = val as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const item = obj[key];
    if (typeof item === "string") {
      continue;
    }
    if (typeof item === "object" && item !== null && !Array.isArray(item)) {
      if (!isValidJsonStringTree(item, depth + 1)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export function isValidSiteContentOverrides(val: unknown): val is SiteContentOverrides {
  if (typeof val !== "object" || val === null || Array.isArray(val)) return false;
  const obj = val as Record<string, unknown>;

  const allowedTopKeys = ["messages", "navigation", "footer"];
  for (const key of Object.keys(obj)) {
    if (!allowedTopKeys.includes(key)) return false;
  }

  if ("messages" in obj && obj.messages !== undefined) {
    const messages = obj.messages;
    if (typeof messages !== "object" || messages === null || Array.isArray(messages)) return false;
    const msgObj = messages as Record<string, unknown>;
    for (const key of Object.keys(msgObj)) {
      if (key !== "home" && key !== "info") return false;
      const sub = msgObj[key];
      if (sub !== undefined) {
        if (!isValidJsonStringTree(sub)) return false;
      }
    }
  }

  if ("navigation" in obj && obj.navigation !== undefined) {
    const navigation = obj.navigation;
    if (typeof navigation !== "object" || navigation === null || Array.isArray(navigation)) return false;
    const navObj = navigation as Record<string, unknown>;
    const allowedNavKeys = ["collection", "details", "contacts"];
    for (const key of Object.keys(navObj)) {
      if (!allowedNavKeys.includes(key)) return false;
      if (typeof navObj[key] !== "string") return false;
    }
  }

  if ("footer" in obj && obj.footer !== undefined) {
    const footer = obj.footer;
    if (typeof footer !== "object" || footer === null || Array.isArray(footer)) return false;
    const footObj = footer as Record<string, unknown>;
    const allowedFooterKeys = [
      "customerService",
      "userAgreement",
      "privacyPolicy",
      "purchaseTerms",
      "deliveryPolicy",
      "returnsPolicy",
      "requisites",
      "shop",
      "allProducts",
      "questions",
      "contactUs",
      "telegram",
      "instagram",
      "email",
      "copyright",
    ];
    for (const key of Object.keys(footObj)) {
      if (!allowedFooterKeys.includes(key)) return false;
      if (typeof footObj[key] !== "string") return false;
    }
  }

  return true;
}

export function deepMerge(target: unknown, source: unknown): unknown {
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return typeof source === "string" ? source : target;
  }
  let baseTarget: Record<string, unknown> = {};
  if (typeof target === "object" && target !== null && !Array.isArray(target)) {
    baseTarget = { ...(target as Record<string, unknown>) };
  }
  const sourceObj = source as Record<string, unknown>;
  const result = { ...baseTarget };
  for (const key of Object.keys(sourceObj)) {
    const val = sourceObj[key];
    if (typeof val === "string") {
      result[key] = val;
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      result[key] = deepMerge(baseTarget[key], val);
    }
  }
  return result;
}

export function mergeMessages(
  local: Record<string, unknown>,
  remoteOverrides: unknown
): Record<string, unknown> {
  if (!local || typeof local !== "object" || Array.isArray(local)) {
    return local;
  }
  const localObj = local as Record<string, unknown>;
  if (!remoteOverrides || typeof remoteOverrides !== "object" || Array.isArray(remoteOverrides)) {
    return local;
  }
  const remoteObj = remoteOverrides as Record<string, unknown>;
  if (!("messages" in remoteObj) || !remoteObj.messages || typeof remoteObj.messages !== "object" || Array.isArray(remoteObj.messages)) {
    return local;
  }
  const messagesObj = remoteObj.messages as Record<string, unknown>;
  const result = { ...localObj };
  const remoteHome = messagesObj.home;
  if (remoteHome && typeof remoteHome === "object" && !Array.isArray(remoteHome)) {
    result.home = deepMerge(localObj.home, remoteHome) as Record<string, unknown>;
  }
  const remoteInfo = messagesObj.info;
  if (remoteInfo && typeof remoteInfo === "object" && !Array.isArray(remoteInfo)) {
    result.info = deepMerge(localObj.info, remoteInfo) as Record<string, unknown>;
  }
  return result;
}

export async function fetchSiteContent(locale: string): Promise<SiteContentOverrides | null> {
  if (locale !== "ru" && locale !== "en") {
    return null;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "");
  const url = `${baseUrl}/store/site-content/${locale}`;

  const headers: Record<string, string> = {};
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch site content for locale ${locale}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data || typeof data !== "object") {
      console.error(`Invalid response format from site content API for locale ${locale}`);
      return null;
    }

    const dataObj = data as Record<string, unknown>;
    if (!("site_content" in dataObj)) {
      console.error(`Missing site_content in response for locale ${locale}`);
      return null;
    }

    const siteContent = dataObj.site_content;
    if (siteContent === null) {
      return null;
    }

    if (typeof siteContent !== "object" || Array.isArray(siteContent)) {
      console.error(`Invalid site_content format for locale ${locale}`);
      return null;
    }

    const siteContentObj = siteContent as Record<string, unknown>;
    if (!("overrides" in siteContentObj)) {
      console.error(`Missing overrides in site_content for locale ${locale}`);
      return null;
    }

    const overrides = siteContentObj.overrides;
    if (overrides === null || overrides === undefined) {
      return null;
    }

    if (!isValidSiteContentOverrides(overrides)) {
      console.error(`Invalid site content overrides format for locale ${locale}`);
      return null;
    }

    return overrides;
  } catch (error) {
    console.error(`Error fetching site content for locale ${locale}:`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
