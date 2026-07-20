import { describe, expect, it } from "vitest";
import enInfo from "../../../messages/info/en.json";
import ruInfo from "../../../messages/info/ru.json";
import { getFooterGroups } from "../landing-data";
import { INFO_SECTION_IDS } from "../info-sections";

const expectedBlockCounts = {
  terms: 85,
  privacy: 47,
  purchase: 26,
  shipping: 8,
  returns: 7,
} as const;

describe("Info Page Section IDs", () => {
  it("lists all five policies in source-document order", () => {
    expect(INFO_SECTION_IDS).toEqual(["terms", "privacy", "purchase", "shipping", "returns"]);
    expect(new Set(INFO_SECTION_IDS).size).toBe(INFO_SECTION_IDS.length);
  });
});

describe("Footer Links to Info Page Anchors", () => {
  it("links every Russian policy to its own info-page section", () => {
    const customerServiceGroup = getFooterGroups("ru").find(
      (group) => group.title === "СЕРВИС КЛИЕНТОВ",
    );

    expect(customerServiceGroup?.links).toEqual([
      { label: "Пользовательское соглашение", href: "/ru/info#terms" },
      { label: "Политика конфиденциальности", href: "/ru/info#privacy" },
      { label: "Условия оформления и покупки товаров", href: "/ru/info#purchase" },
      { label: "Правила доставки", href: "/ru/info#shipping" },
      { label: "Правила возврата товаров", href: "/ru/info#returns" },
    ]);
  });

  it("links every English policy to its own info-page section", () => {
    const customerServiceGroup = getFooterGroups("en").find(
      (group) => group.title === "CUSTOMER SERVICE",
    );

    expect(customerServiceGroup?.links).toEqual([
      { label: "User Agreement", href: "/en/info#terms" },
      { label: "Privacy Policy", href: "/en/info#privacy" },
      {
        label: "Terms for Placing Orders and Purchasing Goods",
        href: "/en/info#purchase",
      },
      { label: "Delivery Policy", href: "/en/info#shipping" },
      { label: "Returns Policy", href: "/en/info#returns" },
    ]);
  });
});

describe("Policy Translation Completeness", () => {
  function validateInfoTranslation(info: Record<string, unknown>) {
    expect(typeof info.pageTitle).toBe("string");
    expect(info.pageTitle).not.toBe("");

    for (const id of INFO_SECTION_IDS) {
      const policy = info[id] as { title?: unknown; blocks?: unknown };
      expect(typeof policy.title).toBe("string");
      expect(policy.title).not.toBe("");
      expect(Array.isArray(policy.blocks)).toBe(true);
      expect(policy.blocks).toHaveLength(expectedBlockCounts[id]);

      for (const block of policy.blocks as Array<Record<string, unknown>>) {
        expect(["heading", "paragraph", "list"]).toContain(block.type);
        if (block.type === "list") {
          expect(Array.isArray(block.items)).toBe(true);
          expect(block.items).not.toHaveLength(0);
          for (const item of block.items as unknown[]) {
            expect(typeof item).toBe("string");
            expect(item).not.toBe("");
          }
        } else {
          expect(typeof block.text).toBe("string");
          expect(block.text).not.toBe("");
        }
      }
    }
  }

  it("contains every structured Russian policy block", () => {
    validateInfoTranslation(ruInfo);
    expect(ruInfo.terms.title).toBe("Пользовательское соглашение");
    expect(ruInfo.purchase.title).toBe("Условия оформления и покупки товаров");
  });

  it("contains a complete English counterpart without untranslated Cyrillic", () => {
    validateInfoTranslation(enInfo);
    expect(JSON.stringify(enInfo)).not.toMatch(/[А-Яа-яЁё]/);

    for (const id of INFO_SECTION_IDS) {
      const russianBlocks = ruInfo[id].blocks;
      const englishBlocks = enInfo[id].blocks;
      expect(englishBlocks.map((block) => block.type)).toEqual(
        russianBlocks.map((block) => block.type),
      );
    }
  });
});
