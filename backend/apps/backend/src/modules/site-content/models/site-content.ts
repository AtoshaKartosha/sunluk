import { model } from "@medusajs/framework/utils"

const SiteContent = model.define("site_content", {
  id: model.id().primaryKey(),
  locale: model.text().unique(),
  overrides: model.json(),
})

export default SiteContent
