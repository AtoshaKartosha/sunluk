import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text, Badge } from "@medusajs/ui"
import { DetailWidgetProps } from "@medusajs/framework/types"

type HttpTypesAdminProduct = {
  id: string
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: Array<{ url: string }> | null
  variants?: Array<{
    id: string
    sku?: string | null
    manage_inventory?: boolean
    inventory_items?: Array<{
      inventory_item_id: string
      required_quantity?: number | null
    }> | null
    prices?: Array<{
      currency_code: string
      amount: number
    }> | null
  }> | null
  categories?: Array<{
    id: string
    name: string
    handle?: string | null
  }> | null
  handle?: string | null
}

type ChecklistItem = {
  label: string
  passed: boolean
}


const ProductChecklistWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypesAdminProduct>) => {
  if (!product) {
    return null
  }

  const checks: ChecklistItem[] = []

  // Check 1: Product has title
  checks.push({
    label: "Product has title",
    passed: !!product.title && product.title.trim().length > 0,
  })

  // Check 2: Product has description
  checks.push({
    label: "Product has description",
    passed: !!product.description && product.description.trim().length > 0,
  })

  // Check 3: Product has thumbnail or image
  const hasThumbnail = !!product.thumbnail && product.thumbnail.trim().length > 0
  const hasImages = !!product.images && product.images.length > 0
  checks.push({
    label: "Product has thumbnail or image",
    passed: hasThumbnail || hasImages,
  })

  // Check 4: Product has at least one variant
  const hasVariants = !!product.variants && product.variants.length > 0
  checks.push({
    label: "Product has at least one variant",
    passed: hasVariants,
  })

  // Check 5: SKU present on every variant
  if (hasVariants) {
    const allVariantsHaveSku = product.variants!.every(
      (variant) => !!variant.sku && variant.sku.trim().length > 0
    )
    checks.push({
      label: "SKU present on every variant",
      passed: allVariantsHaveSku,
    })
  }

  // Check 6: Prices exist for RUB and EUR on every variant
  if (hasVariants) {
    const allVariantsHaveRequiredPrices = product.variants!.every((variant) => {
      if (!variant.prices || variant.prices.length === 0) {
        return false
      }
      const hasRub = variant.prices.some((p) => p.currency_code === "rub")
      const hasEur = variant.prices.some((p) => p.currency_code === "eur")
      return hasRub && hasEur
    })
    checks.push({
      label: "Prices exist for RUB and EUR on every variant",
      passed: allVariantsHaveRequiredPrices,
    })
  }

  // Check 7: Inventory is configured or manage_inventory is false for every variant
  if (hasVariants) {
    const allVariantsHaveInventoryConfigured = product.variants!.every(
      (variant) => {
        // If manage_inventory is false, no inventory needed
        if (variant.manage_inventory === false) {
          return true
        }
        // Otherwise, must have inventory_items configured
        return (
          !!variant.inventory_items && variant.inventory_items.length > 0
        )
      }
    )
    checks.push({
      label: "Inventory configured or manage_inventory disabled for every variant",
      passed: allVariantsHaveInventoryConfigured,
    })
  }

  // Check 8: Packaging products should be in Packaging category (best-effort)
  // Only check if product handle suggests it's a packaging product
  const isPackagingProduct =
    product.handle?.toLowerCase().includes("packaging") ||
    product.handle?.toLowerCase().includes("upakovka") ||
    product.handle?.toLowerCase().includes("упаковка")

  if (isPackagingProduct) {
    const isInPackagingCategory =
      !!product.categories &&
      product.categories.some(
        (cat) =>
          cat.name?.toLowerCase().includes("packaging") ||
          cat.name?.toLowerCase().includes("упаковка") ||
          cat.handle?.toLowerCase().includes("packaging") ||
          cat.handle?.toLowerCase().includes("upakovka")
      )
    checks.push({
      label: "Packaging product is in Packaging category",
      passed: isInPackagingCategory,
    })
  }

  const passedCount = checks.filter((c) => c.passed).length
  const totalCount = checks.length

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            Sunluk Product Checklist
          </Text>
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle mt-0.5"
          >
            {passedCount} of {totalCount} checks passed
          </Text>
        </div>
        {passedCount === totalCount ? (
          <Badge color="green" size="small">
            Complete
          </Badge>
        ) : (
          <Badge color="orange" size="small">
            {totalCount - passedCount} remaining
          </Badge>
        )}
      </div>
      <div className="px-6 py-4">
        <ul className="flex flex-col gap-2">
          {checks.map((check, index) => (
            <li key={index} className="flex items-center gap-2">
              {check.passed ? (
                <Badge color="green" size="small" className="shrink-0">
                  ✓
                </Badge>
              ) : (
                <Badge color="red" size="small" className="shrink-0">
                  ✗
                </Badge>
              )}
              <Text
                size="small"
                leading="compact"
                className={
                  check.passed ? "text-ui-fg-subtle" : "text-ui-fg-base"
                }
              >
                {check.label}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductChecklistWidget
