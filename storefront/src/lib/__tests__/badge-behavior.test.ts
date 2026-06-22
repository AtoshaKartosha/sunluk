import { describe, it, expect } from "vitest"
import { getBadgeCta, isKnownBadge } from "../badge-behavior"

describe("getBadgeCta", () => {
  describe("sold_out badge", () => {
    it("disables CTA even when variant is in stock", () => {
      const result = getBadgeCta("sold_out", true)
      expect(result.enabled).toBe(false)
      expect(result.state).toBe("disabled")
    })

    it("disables CTA when variant is out of stock", () => {
      const result = getBadgeCta("sold_out", false)
      expect(result.enabled).toBe(false)
      expect(result.state).toBe("disabled")
    })
  })

  describe("pre_order badge", () => {
    it("enables CTA even when variant is out of stock", () => {
      const result = getBadgeCta("pre_order", false)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("pre_order")
    })

    it("enables CTA when variant is in stock", () => {
      const result = getBadgeCta("pre_order", true)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("pre_order")
    })
  })

  describe("discount badge", () => {
    it("preserves availability when variant is in stock", () => {
      const result = getBadgeCta("discount", true)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("enabled")
    })

    it("preserves unavailability when variant is out of stock", () => {
      const result = getBadgeCta("discount", false)
      expect(result.enabled).toBe(false)
      expect(result.state).toBe("disabled")
    })
  })

  describe("in_stock badge", () => {
    it("preserves availability when variant is in stock", () => {
      const result = getBadgeCta("in_stock", true)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("enabled")
    })

    it("preserves unavailability when variant is out of stock", () => {
      const result = getBadgeCta("in_stock", false)
      expect(result.enabled).toBe(false)
      expect(result.state).toBe("disabled")
    })
  })

  describe("absent or unknown badge", () => {
    it("null badge defers to availability", () => {
      const result = getBadgeCta(null, true)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("enabled")
    })

    it("undefined badge defers to availability", () => {
      const result = getBadgeCta(undefined, false)
      expect(result.enabled).toBe(false)
      expect(result.state).toBe("disabled")
    })

    it("unknown badge defers to availability", () => {
      const result = getBadgeCta("unknown_flag", true)
      expect(result.enabled).toBe(true)
      expect(result.state).toBe("enabled")
    })
  })
})

describe("isKnownBadge", () => {
  it("recognizes all known badge values", () => {
    expect(isKnownBadge("in_stock")).toBe(true)
    expect(isKnownBadge("sold_out")).toBe(true)
    expect(isKnownBadge("pre_order")).toBe(true)
    expect(isKnownBadge("discount")).toBe(true)
  })

  it("rejects null and undefined", () => {
    expect(isKnownBadge(null)).toBe(false)
    expect(isKnownBadge(undefined)).toBe(false)
  })

  it("rejects unknown strings", () => {
    expect(isKnownBadge("unknown")).toBe(false)
    expect(isKnownBadge("")).toBe(false)
  })
})
