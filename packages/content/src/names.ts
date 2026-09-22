import { rawNames } from "./raw/names.ts";
import { namesSchemas } from "./schemas/names.ts";

export { contentBundleSentinel } from "./sentinel.ts";
export type { AchievementName, CuriosityName, FactTitle, LocationName } from "./schemas/names.ts";

export const names = {
  locations: namesSchemas.locations.parse(rawNames.locations),
  curiosities: namesSchemas.curiosities.parse(rawNames.curiosities),
  factTitles: namesSchemas["fact-titles"].parse(rawNames["fact-titles"]),
  achievements: namesSchemas.achievements.parse(rawNames.achievements),
};

export type Names = typeof names;
