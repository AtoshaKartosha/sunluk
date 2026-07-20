import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mainInstructionsPath = resolve(__dirname, "../../../../docs/main-advisor-instructions.md");
const subInstructionsPath = resolve(__dirname, "../../../../docs/sub-advisor-instructions.md");

describe("Advisor Instructions Document Structure", () => {
  const cyrillicRegex = /[\u0400-\u04FF]/;

  it("checks that the instruction files exist", () => {
    expect(existsSync(mainInstructionsPath)).toBe(true);
    expect(existsSync(subInstructionsPath)).toBe(true);
  });

  function validateFileStructure(filePath: string) {
    const content = readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    let headerCount = 0;
    let bodyLineCount = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("#")) {
        headerCount++;
        // Headers must be in Russian (contain Cyrillic characters)
        expect(cyrillicRegex.test(line)).toBe(true);
      } else {
        bodyLineCount++;
        // Body lines must be in English (not contain Cyrillic characters)
        // Except for specific punctuation or inline code blocks if they are ASCII
        expect(cyrillicRegex.test(line)).toBe(false);
      }
    }

    expect(headerCount).toBeGreaterThan(0);
    expect(bodyLineCount).toBeGreaterThan(0);
  }

  it("validates main advisor instructions structure", () => {
    validateFileStructure(mainInstructionsPath);
  });

  it("validates sub-advisor instructions structure", () => {
    validateFileStructure(subInstructionsPath);
  });

  it("validates that main advisor instructions contain mandatory confirmation policies", () => {
    const content = readFileSync(mainInstructionsPath, "utf8").toLowerCase();
    expect(content).toContain("clarify");
    expect(content).toContain("confirm");
    expect(content).toContain("ask mode");
  });

  it("validates that sub-advisor instructions contain escalation and integration boundaries", () => {
    const content = readFileSync(subInstructionsPath, "utf8").toLowerCase();
    expect(content).toContain("escalat");
    expect(content).toContain("skip formatting");
  });
});
