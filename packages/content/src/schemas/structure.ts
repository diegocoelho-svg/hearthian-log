import { z } from "zod";
import {
  achievementIdSchema,
  curiosityIdSchema,
  entryIdSchema,
  factIdSchema,
  frequencyIndexSchema,
  locationIdSchema,
  signalIdSchema,
} from "@hearthian/core";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const locationSchema = z.strictObject({
  id: locationIdSchema,
  kind: z.enum(["planet", "moon", "station", "other"]),
  parentId: locationIdSchema.nullable(),
});

export const curiositySchema = z.strictObject({
  id: curiosityIdSchema,
  color: hexColor,
});

export const entrySchema = z.strictObject({
  id: entryIdSchema,
  locationId: locationIdSchema,
  curiosityId: curiosityIdSchema.nullable(),
  parentEntryId: entryIdSchema.nullable(),
});

export const factSchema = z.strictObject({
  id: factIdSchema,
  entryId: entryIdSchema,
  kind: z.enum(["explore", "rumor"]),
  targets: z.array(entryIdSchema),
});

export const signalSchema = z.strictObject({
  id: signalIdSchema,
  frequencyIndex: frequencyIndexSchema,
  locationId: locationIdSchema.nullable(),
});

export const achievementSchema = z.strictObject({
  id: achievementIdSchema,
  hidden: z.boolean(),
  relatedFactIds: z.array(factIdSchema),
  prerequisiteFactIds: z.array(factIdSchema),
  order: z.number().int().nonnegative(),
});

export const structureSchemas = {
  locations: z.array(locationSchema),
  curiosities: z.array(curiositySchema),
  entries: z.array(entrySchema),
  facts: z.array(factSchema),
  signals: z.array(signalSchema),
  achievements: z.array(achievementSchema),
};

export type Location = z.output<typeof locationSchema>;
export type Curiosity = z.output<typeof curiositySchema>;
export type Entry = z.output<typeof entrySchema>;
export type Fact = z.output<typeof factSchema>;
export type Signal = z.output<typeof signalSchema>;
export type Achievement = z.output<typeof achievementSchema>;
export type StructureFile = keyof typeof structureSchemas;
