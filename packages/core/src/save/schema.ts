import { z } from "zod";

export const factSaveSchema = z.looseObject({
  id: z.string(),
  revealOrder: z.number().int(),
  read: z.boolean(),
  newlyRevealed: z.boolean(),
});

export const saveShapeSchema = z.looseObject({
  loopCount: z.number().int(),
  shipLogFactSaves: z.record(z.string(), z.unknown()),
});

export const versionSchema = z.string();
export const fullTimeloopsSchema = z.number().int();
export const knownFrequenciesSchema = z.array(z.boolean());
export const knownSignalsSchema = z.record(z.string(), z.boolean());
export const dictConditionsSchema = z.record(z.string(), z.boolean());
export const counterSchema = z.number();

export type FactSave = z.infer<typeof factSaveSchema>;
export type SaveShape = z.infer<typeof saveShapeSchema>;
