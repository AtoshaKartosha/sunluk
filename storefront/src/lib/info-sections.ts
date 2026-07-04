export const INFO_SECTION_IDS = ["shipping", "returns", "privacy", "terms"] as const;
export type InfoSectionId = (typeof INFO_SECTION_IDS)[number];
