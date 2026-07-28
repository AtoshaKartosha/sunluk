// ponytail: GET/PUT/DELETE /admin/site-content/:locale API routes
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { validateLocale, validateOverrides } from "../../../../modules/site-content/validation";
import type SiteContentService from "../../../../modules/site-content/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { locale } = req.params;

  if (!validateLocale(locale)) {
    return res.status(400).json({
      message: `Invalid locale: ${locale}. Supported locales: ru, en.`
    });
  }

  const siteContentModuleService = req.scope.resolve<SiteContentService>("site_content");

  try {
    const siteContents = await siteContentModuleService.listSiteContents({
      locale
    });

    return res.json({
      site_content: siteContents[0] || null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: `Failed to fetch site content: ${errorMessage}`
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const err = error as Record<string, unknown>;
  if (err.name === "UniqueConstraintViolationException" || err.code === "23505") {
    return true;
  }
  const message = String(err.message || "");
  if (
    message.includes("UniqueConstraintViolationException") ||
    message.includes("23505") ||
    message.toLowerCase().includes("duplicate key") ||
    message.toLowerCase().includes("unique constraint")
  ) {
    return true;
  }
  if (err.originalError && typeof err.originalError === "object") {
    const orig = err.originalError as Record<string, unknown>;
    if (
      orig.name === "UniqueConstraintViolationException" ||
      orig.code === "23505" ||
      String(orig.message || "").includes("23505") ||
      String(orig.message || "").toLowerCase().includes("duplicate key") ||
      String(orig.message || "").toLowerCase().includes("unique constraint")
    ) {
      return true;
    }
  }
  return false;
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { locale } = req.params;

  if (!validateLocale(locale)) {
    return res.status(400).json({
      message: `Invalid locale: ${locale}. Supported locales: ru, en.`
    });
  }

  const body = req.body;
  const overrides = typeof body === "object" && body !== null && Object.prototype.hasOwnProperty.call(body, "overrides")
    ? (body as Record<string, unknown>).overrides
    : undefined;

  const validation = validateOverrides(overrides);
  if (!validation.valid) {
    return res.status(400).json({
      message: validation.error || "Invalid overrides payload"
    });
  }

  const siteContentModuleService = req.scope.resolve<SiteContentService>("site_content");

  const validatedOverrides = overrides as Record<string, unknown>;

  try {
    const siteContents = await siteContentModuleService.listSiteContents({
      locale
    });

    let siteContent: {
      id: string;
      locale: string;
      overrides: Record<string, unknown>;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    };

    if (siteContents.length > 0) {
      siteContent = await siteContentModuleService.updateSiteContents({
        id: siteContents[0].id,
        overrides: validatedOverrides
      });
    } else {
      try {
        siteContent = await siteContentModuleService.createSiteContents({
          locale,
          overrides: validatedOverrides
        });
      } catch (innerError: unknown) {
        if (isUniqueViolation(innerError)) {
          const refetchedContents = await siteContentModuleService.listSiteContents({
            locale
          });
          if (refetchedContents.length > 0) {
            siteContent = await siteContentModuleService.updateSiteContents({
              id: refetchedContents[0].id,
              overrides: validatedOverrides
            });
          } else {
            throw innerError;
          }
        } else {
          throw innerError;
        }
      }
    }

    return res.json({
      site_content: siteContent
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: `Failed to save site content: ${errorMessage}`
    });
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { locale } = req.params;

  if (!validateLocale(locale)) {
    return res.status(400).json({
      message: `Invalid locale: ${locale}. Supported locales: ru, en.`
    });
  }

  const siteContentModuleService = req.scope.resolve<SiteContentService>("site_content");

  try {
    const siteContents = await siteContentModuleService.listSiteContents({
      locale
    });

    if (siteContents.length > 0) {
      await siteContentModuleService.deleteSiteContents(siteContents[0].id);
    }

    return res.json({
      site_content: null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: `Failed to delete site content: ${errorMessage}`
    });
  }
}
