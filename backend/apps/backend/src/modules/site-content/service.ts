import { MedusaService } from "@medusajs/framework/utils"
import SiteContent from "./models/site-content"

class SiteContentService extends MedusaService({
  SiteContent,
}) {}

export default SiteContentService
