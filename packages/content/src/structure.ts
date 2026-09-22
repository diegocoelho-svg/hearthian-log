import { rawStructure } from "./raw/structure.ts";
import { rawVersion } from "./raw/version.ts";
import { structureSchemas } from "./schemas/structure.ts";
import { versionSchema } from "./schemas/version.ts";

export { contentBundleSentinel } from "./sentinel.ts";
export type { Achievement, Curiosity, Entry, Fact, Location, Signal } from "./schemas/structure.ts";
export type { ContentVersion } from "./schemas/version.ts";

export const version = versionSchema.parse(rawVersion);

export const structure = {
  locations: structureSchemas.locations.parse(rawStructure.locations),
  curiosities: structureSchemas.curiosities.parse(rawStructure.curiosities),
  entries: structureSchemas.entries.parse(rawStructure.entries),
  facts: structureSchemas.facts.parse(rawStructure.facts),
  signals: structureSchemas.signals.parse(rawStructure.signals),
  achievements: structureSchemas.achievements.parse(rawStructure.achievements),
};

export type Structure = typeof structure;
