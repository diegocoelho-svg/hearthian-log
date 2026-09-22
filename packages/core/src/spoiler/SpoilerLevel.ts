export const spoilerLevels = ["none", "locations", "titles", "full"] as const;

export type SpoilerLevel = (typeof spoilerLevels)[number];
