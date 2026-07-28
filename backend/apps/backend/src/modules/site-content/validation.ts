// ponytail: validation rules for Site Content API

export const ALLOWED_NAVIGATION_KEYS: Record<string, boolean> = {
  collection: true,
  details: true,
  contacts: true
};

export const ALLOWED_FOOTER_KEYS: Record<string, boolean> = {
  customerService: true,
  userAgreement: true,
  privacyPolicy: true,
  purchaseTerms: true,
  deliveryPolicy: true,
  returnsPolicy: true,
  requisites: true,
  shop: true,
  allProducts: true,
  questions: true,
  contactUs: true,
  telegram: true,
  instagram: true,
  email: true,
  copyright: true
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getDepth(obj: unknown): number {
  if (!isPlainObject(obj)) {
    return 0;
  }
  let max = 0;
  for (const key of Object.keys(obj)) {
    max = Math.max(max, getDepth(obj[key]));
  }
  return max + 1;
}

function validateJsonStringTree(obj: unknown): boolean {
  if (!isPlainObject(obj)) {
    return false;
  }
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === "string") {
      continue;
    }
    if (isPlainObject(value)) {
      if (!validateJsonStringTree(value)) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export function validateLocale(locale: string): locale is "ru" | "en" {
  return locale === "ru" || locale === "en";
}

export function validateOverrides(overrides: unknown): { valid: boolean; error?: string } {
  if (!isPlainObject(overrides)) {
    return { valid: false, error: "Overrides must be a plain object" };
  }

  // 1. Serialization size check (max 64KiB)
  let serialized: string;
  try {
    serialized = JSON.stringify(overrides);
  } catch (e) {
    return { valid: false, error: "Failed to serialize overrides" };
  }
  if (Buffer.byteLength(serialized, "utf8") > 65536) {
    return { valid: false, error: "Overrides payload size exceeds 64KiB" };
  }

  // 2. Max depth check (max 8)
  if (getDepth(overrides) > 8) {
    return { valid: false, error: "Overrides nesting depth exceeds 8" };
  }

  // 3. Allowed top keys check
  const topKeys = Object.keys(overrides);
  for (const key of topKeys) {
    if (key !== "messages" && key !== "navigation" && key !== "footer") {
      return { valid: false, error: `Forbidden top-level key: ${key}` };
    }
  }

  // 4. Validate messages namespace
  if (Object.prototype.hasOwnProperty.call(overrides, "messages")) {
    const messages = overrides.messages;
    if (!isPlainObject(messages)) {
      return { valid: false, error: "messages must be a plain object" };
    }
    for (const key of Object.keys(messages)) {
      if (key !== "home" && key !== "info") {
        return { valid: false, error: `Forbidden messages sub-key: ${key}` };
      }
      const val = messages[key];
      if (!validateJsonStringTree(val)) {
        return { valid: false, error: `Invalid JsonStringTree structure in messages.${key}` };
      }
    }
  }

  // 5. Validate navigation namespace
  if (Object.prototype.hasOwnProperty.call(overrides, "navigation")) {
    const navigation = overrides.navigation;
    if (!isPlainObject(navigation)) {
      return { valid: false, error: "navigation must be a plain object" };
    }
    for (const key of Object.keys(navigation)) {
      if (!Object.prototype.hasOwnProperty.call(ALLOWED_NAVIGATION_KEYS, key)) {
        return { valid: false, error: `Forbidden navigation key: ${key}` };
      }
      if (typeof navigation[key] !== "string") {
        return { valid: false, error: `navigation.${key} must be a string` };
      }
    }
  }

  // 6. Validate footer namespace
  if (Object.prototype.hasOwnProperty.call(overrides, "footer")) {
    const footer = overrides.footer;
    if (!isPlainObject(footer)) {
      return { valid: false, error: "footer must be a plain object" };
    }
    for (const key of Object.keys(footer)) {
      if (!Object.prototype.hasOwnProperty.call(ALLOWED_FOOTER_KEYS, key)) {
        return { valid: false, error: `Forbidden footer key: ${key}` };
      }
      if (typeof footer[key] !== "string") {
        return { valid: false, error: `footer.${key} must be a string` };
      }
    }
  }

  return { valid: true };
}

export function assertOverrides(overrides: unknown): asserts overrides is Record<string, unknown> {
  const validation = validateOverrides(overrides);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid overrides payload");
  }
}
