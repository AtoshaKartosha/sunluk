import { useState, useEffect } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Select, Textarea } from "@medusajs/ui"

export default function SiteContentPage() {
  const [locale, setLocale] = useState<string>("en")
  const [rawJson, setRawJson] = useState<string>("{}")
  const [lastSavedJson, setLastSavedJson] = useState<string>("{}")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isResetting, setIsResetting] = useState<boolean>(false)
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | null; message: string | null }>({
    type: null,
    message: null,
  })

  // Load content whenever locale changes
  useEffect(() => {
    let active = true
    async function loadContent() {
      setIsLoading(true)
      setStatus({ type: null, message: null })
      try {
        const res = await fetch(`/admin/site-content/${locale}`, {
          credentials: "include",
        })
        if (!active) return

        if (res.status === 404) {
          setRawJson("{}")
          setLastSavedJson("{}")
        } else if (!res.ok) {
          throw new Error(`Failed to load content: ${res.statusText}`)
        } else {
          const data = await res.json()
          const overrides = data.site_content?.overrides || {}
          const formatted = JSON.stringify(overrides, null, 2)
          setRawJson(formatted)
          setLastSavedJson(formatted)
        }
      } catch (err: unknown) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "An error occurred while loading content."
          setStatus({
            type: "error",
            message: errorMessage,
          })
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }
    loadContent()
    return () => {
      active = false
    }
  }, [locale])

  // Handle Save (PUT)
  async function handleSave() {
    setStatus({ type: null, message: null })
    let parsed: unknown
    try {
      parsed = JSON.parse(rawJson)
    } catch (err) {
      setStatus({ type: "error", message: "Invalid JSON format. Please check syntax." })
      return
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setStatus({ type: "error", message: "Site content must be a JSON object (not an array, string, number, or null)." })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/admin/site-content/${locale}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overrides: parsed }),
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`Failed to save: ${res.statusText}`)
      }

      const data = await res.json()
      const overrides = data.site_content?.overrides || {}
      const formatted = JSON.stringify(overrides, null, 2)
      setRawJson(formatted)
      setLastSavedJson(formatted)
      setStatus({ type: "success", message: "Site content saved successfully." })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while saving."
      setStatus({ type: "error", message: errorMessage })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Reset (DELETE)
  async function handleReset() {
    setStatus({ type: null, message: null })
    if (rawJson !== lastSavedJson) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to reset and discard them?")
      if (!confirmed) return
    } else {
      const confirmed = window.confirm(`Are you sure you want to reset site content for locale "${locale}"? This will delete overrides from the database.`)
      if (!confirmed) return
    }

    setIsResetting(true)
    try {
      const res = await fetch(`/admin/site-content/${locale}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`Failed to delete: ${res.statusText}`)
      }

      setRawJson("{}")
      setLastSavedJson("{}")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred while resetting."
      setStatus({ type: "error", message: errorMessage })
    } finally {
      setIsResetting(false)
    }
  }

  const handleLocaleChange = (newLocale: string) => {
    if (rawJson !== lastSavedJson) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to change locale and discard them?")
      if (!confirmed) return
    }
    setLocale(newLocale)
  }

  return (
    <Container className="flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <Heading level="h1">Site Content</Heading>
        <div className="flex items-center gap-x-4">
          <span className="text-sm text-ui-fg-subtle font-sans">Locale</span>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <Select.Trigger className="w-[120px]">
              <Select.Value placeholder="Select locale" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="en">English (en)</Select.Item>
              <Select.Item value="ru">Russian (ru)</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-md text-sm border font-sans ${
          status.type === "success" 
            ? "bg-green-50 text-green-700 border-green-200" 
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {status.message}
        </div>
      )}

      <div className="flex flex-col gap-y-2">
        <label className="text-sm font-medium text-ui-fg-base font-sans">JSON Overrides</label>
        <Textarea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          rows={15}
          className="font-mono text-xs"
          placeholder="{}"
          disabled={isLoading || isSaving || isResetting}
        />
      </div>

      <div className="flex items-center justify-end gap-x-3">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isLoading || isSaving || isResetting}
        >
          {isResetting ? "Resetting..." : "Reset"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || isResetting}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Site Content",
})
