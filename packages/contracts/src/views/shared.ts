import { z } from "zod";

export const countSchema = z.strictObject({
  revealed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const loopsSchema = z.strictObject({
  started: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
});

export const achievementCountsSchema = z.strictObject({
  total: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative().nullable(),
  reachable: z.number().int().nonnegative(),
});

export type CountView = z.output<typeof countSchema>;
export type LoopsView = z.output<typeof loopsSchema>;
export type AchievementCountsView = z.output<typeof achievementCountsSchema>;
