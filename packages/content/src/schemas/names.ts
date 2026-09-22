import { z } from "zod";
import {
  achievementIdSchema,
  curiosityIdSchema,
  factIdSchema,
  locationIdSchema,
} from "@hearthian/core";

const name = z.string().min(1);

export const locationNameSchema = z.strictObject({ id: locationIdSchema, name });
export const curiosityNameSchema = z.strictObject({ id: curiosityIdSchema, name });
export const factTitleSchema = z.strictObject({ id: factIdSchema, title: name });
export const achievementNameSchema = z.strictObject({ id: achievementIdSchema, name });

export const namesSchemas = {
  locations: z.array(locationNameSchema),
  curiosities: z.array(curiosityNameSchema),
  "fact-titles": z.array(factTitleSchema),
  achievements: z.array(achievementNameSchema),
};

export type LocationName = z.output<typeof locationNameSchema>;
export type CuriosityName = z.output<typeof curiosityNameSchema>;
export type FactTitle = z.output<typeof factTitleSchema>;
export type AchievementName = z.output<typeof achievementNameSchema>;
export type NamesFile = keyof typeof namesSchemas;
