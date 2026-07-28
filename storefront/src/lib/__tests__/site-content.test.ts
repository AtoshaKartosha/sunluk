import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isValidJsonStringTree,
  isValidSiteContentOverrides,
  deepMerge,
  mergeMessages,
  fetchSiteContent,
} from "../site-content";
import { getNavLinks, getFooterGroups } from "../landing-data";

describe("site-content validation", () => {
  it("isValidJsonStringTree accepts valid trees", () => {
    expect(isValidJsonStringTree({ key1: "value1", key2: { sub: "value2" } })).toBe(true);
  });

  it("isValidJsonStringTree rejects arrays and non-string primitives", () => {
    expect(isValidJsonStringTree({ key: 123 })).toBe(false);
    expect(isValidJsonStringTree({ key: ["array"] })).toBe(false);
    expect(isValidJsonStringTree({ key: null })).toBe(false);
  });

  it("isValidJsonStringTree accepts depth 8 nesting", () => {
    let deep: unknown = "leaf";
    for (let i = 0; i < 8; i++) {
      deep = { key: deep };
    }
    expect(isValidJsonStringTree(deep)).toBe(true);
  });

  it("isValidJsonStringTree rejects depth 9 nesting", () => {
    let deep: unknown = "leaf";
    for (let i = 0; i < 9; i++) {
      deep = { key: deep };
    }
    expect(isValidJsonStringTree(deep)).toBe(false);
  });

  it("isValidSiteContentOverrides validation", () => {
    const valid = {
      messages: {
        home: {
          hero: { title: "New Title" }
        }
      },
      navigation: {
        collection: "New Coll"
      },
      footer: {
        copyright: "New Copy"
      }
    };
    expect(isValidSiteContentOverrides(valid)).toBe(true);

    const invalidKey = { ...valid, unknownKey: {} };
    expect(isValidSiteContentOverrides(invalidKey)).toBe(false);

    const invalidMsgKey = {
      messages: {
        unsupported: { val: "text" }
      }
    };
    expect(isValidSiteContentOverrides(invalidMsgKey)).toBe(false);

    const invalidNavKey = {
      navigation: {
        nonexistent: "text"
      }
    };
    expect(isValidSiteContentOverrides(invalidNavKey)).toBe(false);

    const invalidNavVal = {
      navigation: {
        collection: 123
      }
    };
    expect(isValidSiteContentOverrides(invalidNavVal)).toBe(false);
  });
});

describe("deepMerge and mergeMessages", () => {
  it("deepMerge merges strings and objects correctly", () => {
    const target = {
      a: "original",
      b: {
        c: "original-c",
        d: "original-d"
      }
    };
    const source = {
      b: {
        c: "new-c"
      }
    };
    const merged = deepMerge(target, source) as Record<string, unknown>;
    expect(merged.a).toBe("original");
    const mergedB = merged.b as Record<string, unknown>;
    expect(mergedB.c).toBe("new-c");
    expect(mergedB.d).toBe("original-d");
  });

  it("mergeMessages merges home and info only", () => {
    const local = {
      home: { title: "Local Title", desc: "Local Desc" },
      info: { title: "Local Info" },
      other: { data: "Unchanged" }
    };
    const overrides = {
      messages: {
        home: { title: "Remote Title" },
        info: { title: "Remote Info" },
        other: { data: "Remote Other" }
      }
    };
    const merged = mergeMessages(local, overrides) as Record<string, Record<string, unknown>>;
    expect(merged.home.title).toBe("Remote Title");
    expect(merged.home.desc).toBe("Local Desc");
    expect(merged.info.title).toBe("Remote Info");
    expect(merged.other.data).toBe("Unchanged");
  });
});

describe("fetchSiteContent client adapter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "http://test-backend");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns overrides on successful 200 response with valid schema", async () => {
    const fakeOverrides = {
      navigation: { collection: "Collection Override" }
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        site_content: {
          id: "1",
          locale: "en",
          overrides: fakeOverrides,
          updated_at: "2026-07-28"
        }
      })
    });

    const result = await fetchSiteContent("en");
    expect(result).toEqual(fakeOverrides);
  });

  it("passes publishable key header when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "pk_test123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        site_content: {
          overrides: {}
        }
      })
    });
    global.fetch = mockFetch;

    await fetchSiteContent("en");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/store/site-content/en"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-publishable-api-key": "pk_test123"
        })
      })
    );
  });

  it("falls back to null and does not throw on status != 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
    });

    const result = await fetchSiteContent("en");
    expect(result).toBeNull();
  });

  it("falls back to null and does not throw on invalid JSON structure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        site_content: {
          overrides: {
            invalidKey: "not allowed"
          }
        }
      })
    });

    const result = await fetchSiteContent("en");
    expect(result).toBeNull();
  });

  it("falls back to null and does not throw on fetch timeout / abort", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

    const result = await fetchSiteContent("en");
    expect(result).toBeNull();
  });
});

describe("unchanged route hrefs", () => {
  const overrides = {
    navigation: {
      collection: "Overridden Collection",
      details: "Overridden Details",
      contacts: "Overridden Contacts"
    },
    footer: {
      customerService: "Overridden Service",
      userAgreement: "Overridden Agreement"
    }
  };

  it("preserves navigation hrefs", () => {
    const original = getNavLinks("en", true);
    const overridden = getNavLinks("en", true, overrides);
    expect(overridden.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      expect(overridden[i].href).toBe(original[i].href);
    }
  });

  it("preserves footer link hrefs and verifies override behavior", () => {
    const original = getFooterGroups("en");
    const overridden = getFooterGroups("en", overrides);
    expect(overridden.length).toBe(original.length);

    // Overridden group title and link label change
    expect(overridden[0].title).toBe("Overridden Service");
    expect(overridden[0].links[0].label).toBe("Overridden Agreement");

    // Omitted titles and labels remain default
    expect(overridden[0].links[1].label).toBe(original[0].links[1].label);
    expect(overridden[1].title).toBe(original[1].title);
    expect(overridden[2].title).toBe(original[2].title);

    // Hrefs are preserved
    for (let i = 0; i < original.length; i++) {
      expect(overridden[i].links.length).toBe(original[i].links.length);
      for (let j = 0; j < original[i].links.length; j++) {
        expect(overridden[i].links[j].href).toBe(original[i].links[j].href);
      }
    }
  });
});
