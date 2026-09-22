import { spoilerLevels } from "@hearthian/core";
import { z } from "zod";

export const spoilerLevelSchema = z.enum(spoilerLevels);
export const hintLayerSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const achievementOptInSchema = z.union([z.literal(0), hintLayerSchema]);

export type HintLayer = z.output<typeof hintLayerSchema>;
export type AchievementOptIn = z.output<typeof achievementOptInSchema>;
