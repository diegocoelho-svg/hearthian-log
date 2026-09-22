import { achievementIdSchema } from "@hearthian/core";
import { z } from "zod";
import { hintLayerSchema } from "../spoiler.ts";

export const achievementHintViewSchema = z.strictObject({
  id: achievementIdSchema,
  name: z.string().min(1),
  layer: hintLayerSchema,
  hints: z.array(z.string()).max(3),
});

export type AchievementHintView = z.output<typeof achievementHintViewSchema>;
