// ponytail: unit tests for site-content validation rules
import { validateLocale, validateOverrides } from "../validation";

describe("site-content validation", () => {
  describe("validateLocale", () => {
    it("should accept supported locales", () => {
      expect(validateLocale("ru")).toBe(true);
      expect(validateLocale("en")).toBe(true);
    });

    it("should reject unsupported locales", () => {
      expect(validateLocale("fr")).toBe(false);
      expect(validateLocale("es")).toBe(false);
      expect(validateLocale("")).toBe(false);
    });
  });

  describe("validateOverrides", () => {
    it("should accept valid overrides with all allowed sections", () => {
      const valid = {
        messages: {
          home: {
            title: "Welcome",
            subtitle: "To our shop",
            nested: {
              key: "value"
            }
          },
          info: {
            text: "Information page"
          }
        },
        navigation: {
          collection: "Collection Title",
          details: "Details Title"
        },
        footer: {
          copyright: "© 2026 SUNLUK",
          privacyPolicy: "Privacy Policy Link text"
        }
      };

      expect(validateOverrides(valid)).toEqual({ valid: true });
    });

    it("should accept a valid partial override", () => {
      const partial = {
        navigation: {
          contacts: "Contacts"
        }
      };

      expect(validateOverrides(partial)).toEqual({ valid: true });
    });

    it("should accept an empty overrides object", () => {
      expect(validateOverrides({})).toEqual({ valid: true });
    });

    it("should reject non-object values", () => {
      expect(validateOverrides(null)).toEqual({
        valid: false,
        error: "Overrides must be a plain object"
      });
      expect(validateOverrides([])).toEqual({
        valid: false,
        error: "Overrides must be a plain object"
      });
      expect(validateOverrides("invalid")).toEqual({
        valid: false,
        error: "Overrides must be a plain object"
      });
    });

    it("should reject forbidden top-level keys", () => {
      const invalid = {
        messages: {
          home: { title: "Welcome" }
        },
        unknownKey: "value"
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden top-level key: unknownKey"
      });
    });

    it("should reject forbidden messages sub-keys", () => {
      const invalid = {
        messages: {
          home: { title: "Welcome" },
          contact: { phone: "123" }
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden messages sub-key: contact"
      });
    });

    it("should reject non-string/non-object leaves in messages", () => {
      const invalid = {
        messages: {
          home: {
            title: "Welcome",
            count: 42 as unknown as string
          }
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Invalid JsonStringTree structure in messages.home"
      });
    });

    it("should reject forbidden keys in navigation", () => {
      const invalid = {
        navigation: {
          collection: "Collection",
          aboutUs: "About"
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden navigation key: aboutUs"
      });
    });

    it("should reject prototype/inherited keys in navigation", () => {
      const invalid = {
        navigation: {
          toString: "value"
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden navigation key: toString"
      });
    });

    it("should reject non-string values in navigation", () => {
      const invalid = {
        navigation: {
          collection: { text: "Collection" } as unknown as string
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "navigation.collection must be a string"
      });
    });

    it("should reject forbidden keys in footer", () => {
      const invalid = {
        footer: {
          copyright: "© 2026",
          extraLinks: "Extra"
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden footer key: extraLinks"
      });
    });

    it("should reject prototype/inherited keys in footer", () => {
      const invalid = {
        footer: {
          constructor: "value"
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Forbidden footer key: constructor"
      });
    });

    it("should reject non-string values in footer", () => {
      const invalid = {
        footer: {
          copyright: 2026 as unknown as string
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "footer.copyright must be a string"
      });
    });

    it("should reject overrides exceeding nesting depth limit of 8", () => {
      interface NestObj {
        [key: string]: string | NestObj;
      }

      const deepObject: NestObj = {};
      let current = deepObject;
      for (let i = 0; i < 7; i++) {
        const next: NestObj = {};
        current.nest = next;
        current = next;
      }
      current.leaf = "value";

      const invalid = {
        messages: {
          home: deepObject
        }
      };

      expect(validateOverrides(invalid).valid).toBe(false);
    });

    it("should reject overrides exceeding 64KiB size limit", () => {
      const largeString = "a".repeat(65536);
      const invalid = {
        messages: {
          home: {
            text: largeString
          }
        }
      };

      expect(validateOverrides(invalid)).toEqual({
        valid: false,
        error: "Overrides payload size exceeds 64KiB"
      });
    });
  });
});
