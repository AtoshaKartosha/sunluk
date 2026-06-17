import { useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text, Badge, Select } from "@medusajs/ui"
import { DetailWidgetProps } from "@medusajs/framework/types"
import Medusa from "@medusajs/js-sdk"

// Mirrors the subset of the admin product we touch. metadata carries the manual
// badge; everything else is intentionally absent to keep this widget narrow.
type HttpTypesAdminProduct = {
  id: string
  title?: string | null
  metadata?: Record<string, unknown> | null
}

// Manual marketing label stored at product.metadata.badge. Keys MUST match the
// storefront (storefront/src/components/product/ProductBadge.tsx) exactly:
// in_stock | sold_out | pre_order | discount (absent/null = no badge). This is
// a separate concern from functional stock logic (lib/price.ts) and never
// overrides it.
type BadgeValue = "in_stock" | "sold_out" | "pre_order" | "discount"

type SelectValue = BadgeValue | "none"

type Locale = "en" | "ru"

type SaveStatus = "idle" | "saving" | "saved" | "error"

const BADGE_OPTIONS: readonly BadgeValue[] = [
  "in_stock",
  "sold_out",
  "pre_order",
  "discount",
]

function isBadgeValue(value: string): value is BadgeValue {
  return (BADGE_OPTIONS as readonly string[]).includes(value)
}

const copy = {
  en: {
    title: "Product Badge",
    description: "Manual marketing label shown on the storefront.",
    none: "None",
    in_stock: "In stock",
    sold_out: "Sold out",
    pre_order: "Pre-order",
    discount: "Discount",
    saving: "Saving…",
    saved: "Saved",
    error: "Failed to save",
  },
  ru: {
    title: "Бейдж товара",
    description: "Ручная маркетинговая метка для витрины.",
    none: "Нет",
    in_stock: "В наличии",
    sold_out: "Продано",
    pre_order: "Предзаказ",
    discount: "Скидка",
    saving: "Сохранение…",
    saved: "Сохранено",
    error: "Не удалось сохранить",
  },
} as const

// Mirrors the dashboard's own client (node_modules/@medusajs/dashboard ...
// src/lib/client/client.ts): baseUrl from the admin env, session auth reuses
// the admin session cookie already issued by the dashboard. baseUrl is the
// admin's own origin — the dashboard is served same-origin by the backend, so
// window.location.origin is the API base (import.meta.env is avoided: backend
// tsc compiles this file as CommonJS where import.meta is disallowed).
// ponytail: single module-scope instance; extract a shared lib/client.ts only
// if a second admin consumer appears.
const adminSdk = new Medusa({
  baseUrl: typeof window !== "undefined" ? window.location.origin : "/",
  auth: { type: "session" },
})

function getAdminLocale(): Locale {
  if (typeof window === "undefined") {
    return "en"
  }

  const storedLanguage =
    window.localStorage.getItem("i18nextLng") ||
    window.localStorage.getItem("medusa_admin_language")

  const language = storedLanguage || window.navigator.language

  return language.toLowerCase().startsWith("ru") ? "ru" : "en"
}

export default function ProductBadgeWidget({
  data: product,
}: DetailWidgetProps<HttpTypesAdminProduct>) {
  const rawBadge = product?.metadata?.badge
  const initialValue: SelectValue =
    typeof rawBadge === "string" && isBadgeValue(rawBadge) ? rawBadge : "none"

  // Hooks are called unconditionally (Rules of Hooks); the defensive guard for
  // a missing product happens after them.
  const [value, setValue] = useState<SelectValue>(initialValue)
  const [persisted, setPersisted] = useState<SelectValue>(initialValue)
  const [status, setStatus] = useState<SaveStatus>("idle")

  if (!product) {
    return null
  }

  const t = copy[getAdminLocale()]

  async function handleChange(next: string): Promise<void> {
    const badge: SelectValue = isBadgeValue(next) ? next : "none"
    setValue(badge)
    setStatus("saving")
    try {
      // Preserve other metadata keys: product update replaces metadata wholesale
      // in Medusa v2, so spread the existing map and only touch `badge`.
      await adminSdk.admin.product.update(product.id, {
        metadata: {
          ...product.metadata,
          badge: badge === "none" ? null : badge,
        },
      })
      setPersisted(badge)
      setStatus("saved")
    } catch {
      // Revert to the last value confirmed persisted server-side.
      setValue(persisted)
      setStatus("error")
    }
  }

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            {t.title}
          </Text>
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle mt-0.5"
          >
            {t.description}
          </Text>
        </div>
        {status === "saving" && (
          <Badge color="orange" size="small">
            {t.saving}
          </Badge>
        )}
        {status === "saved" && (
          <Badge color="green" size="small">
            {t.saved}
          </Badge>
        )}
        {status === "error" && (
          <Badge color="red" size="small">
            {t.error}
          </Badge>
        )}
      </div>
      <div className="px-6 py-4">
        <Select value={value} onValueChange={handleChange} size="small">
          <Select.Trigger>
            <Select.Value placeholder={t.none} />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="none">{t.none}</Select.Item>
            {BADGE_OPTIONS.map((option) => (
              <Select.Item key={option} value={option}>
                {t[option]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})
