import { rawText } from "./raw/text.ts";
import { textSchemas } from "./schemas/text.ts";

export { contentBundleSentinel } from "./sentinel.ts";
export type { AchievementText, FactText } from "./schemas/text.ts";

export const text = {
  facts: textSchemas.facts.parse(rawText.facts),
  achievements: textSchemas.achievements.parse(rawText.achievements),
};

export type Text = typeof text;
