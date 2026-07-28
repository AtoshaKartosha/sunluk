// ponytail: GET /store/site-content/:locale API route
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { validateLocale } from "../../../../modules/site-content/validation";
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
