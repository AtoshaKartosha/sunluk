import SiteContentService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SITE_CONTENT_MODULE = "site_content"

export default Module(SITE_CONTENT_MODULE, {
  service: SiteContentService,
})
