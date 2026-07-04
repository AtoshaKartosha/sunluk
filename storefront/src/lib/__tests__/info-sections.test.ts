import { describe, it, expect } from "vitest";
import { INFO_SECTION_IDS } from "../info-sections";
import { getFooterGroups } from "../landing-data";
import ruJson from "../../../messages/ru.json";
import enJson from "../../../messages/en.json";

describe("Info Page Section IDs", () => {
  it("has exactly 4 expected section IDs in correct order", () => {
    expect(INFO_SECTION_IDS).toEqual(["shipping", "returns", "privacy", "terms"]);
  });

  it("has unique section IDs", () => {
    const uniqueIds = new Set(INFO_SECTION_IDS);
    expect(uniqueIds.size).toBe(INFO_SECTION_IDS.length);
  });
});

describe("Footer Links to Info Page Anchors", () => {
  it("points to correct info page anchors for Russian locale", () => {
    const groups = getFooterGroups("ru");
    const customerServiceGroup = groups.find((g) => g.title === "СЕРВИС КЛИЕНТОВ");
    expect(customerServiceGroup).toBeDefined();
    if (customerServiceGroup) {
      const links = customerServiceGroup.links;
      expect(links).toHaveLength(3);
      expect(links[0]).toEqual({ label: "Доставка и возврат", href: "/ru/info#shipping" });
      expect(links[1]).toEqual({ label: "Условия и положения", href: "/ru/info#terms" });
      expect(links[2]).toEqual({ label: "Политика конфиденциальности", href: "/ru/info#privacy" });
    }
  });

  it("points to correct info page anchors for English locale", () => {
    const groups = getFooterGroups("en");
    const customerServiceGroup = groups.find((g) => g.title === "CUSTOMER SERVICE");
    expect(customerServiceGroup).toBeDefined();
    if (customerServiceGroup) {
      const links = customerServiceGroup.links;
      expect(links).toHaveLength(3);
      expect(links[0]).toEqual({ label: "Shipping & Returns", href: "/en/info#shipping" });
      expect(links[1]).toEqual({ label: "Terms & Conditions", href: "/en/info#terms" });
      expect(links[2]).toEqual({ label: "Privacy Policy", href: "/en/info#privacy" });
    }
  });
});

describe("Translation Keys Completeness", () => {
  function validateInfoTranslation(info: unknown) {
    expect(info).toBeDefined();
    if (info && typeof info === "object") {
      expect("pageTitle" in info).toBe(true);
      expect(typeof (info as Record<string, unknown>).pageTitle).toBe("string");
      expect((info as Record<string, unknown>).pageTitle).not.toBe("");

      const sections = ["shipping", "returns", "privacy", "terms"] as const;
      for (const section of sections) {
        expect(section in info).toBe(true);
        const sectionData = (info as Record<string, unknown>)[section];
        expect(sectionData).toBeDefined();
        if (sectionData && typeof sectionData === "object") {
          expect("title" in sectionData).toBe(true);
          expect(typeof (sectionData as Record<string, unknown>).title).toBe("string");
          expect((sectionData as Record<string, unknown>).title).not.toBe("");

          expect("content" in sectionData).toBe(true);
          expect(typeof (sectionData as Record<string, unknown>).content).toBe("string");
          expect((sectionData as Record<string, unknown>).content).not.toBe("");
        } else {
          throw new Error(`Section ${section} is not an object`);
        }
      }
    } else {
      throw new Error("Info namespace is not an object");
    }
  }

  it("verifies Russian info translations match structural requirements", () => {
    validateInfoTranslation(ruJson.info);
  });

  it("verifies English info translations match structural requirements", () => {
    validateInfoTranslation(enJson.info);
  });
});
