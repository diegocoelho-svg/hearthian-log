import { z } from "zod";
import { achievementIdSchema, factIdSchema } from "@hearthian/core";

const prose = z.string().min(1);

export const factTextSchema = z.strictObject({ id: factIdSchema, text: prose });

export const achievementTextSchema = z.strictObject({
  id: achievementIdSchema,
  description: prose,
  hints: z.tuple([prose, prose, prose]),
});

export const textSchemas = {
  facts: z.array(factTextSchema),
  achievements: z.array(achievementTextSchema),
};

export type FactText = z.output<typeof factTextSchema>;
export type AchievementText = z.output<typeof achievementTextSchema>;
export type TextFile = keyof typeof textSchemas;
