export const INFO_SECTION_IDS = ["terms", "privacy", "purchase", "shipping", "returns"] as const;
export type InfoSectionId = (typeof INFO_SECTION_IDS)[number];
