import { z } from "zod";
import { achievementOptInSchema, spoilerLevelSchema } from "./spoiler.ts";

export const settingsSchema = z.strictObject({
  schemaVersion: z.literal(1),
  savePath: z.string().min(1).nullable(),
  spoilerLevel: spoilerLevelSchema,
  overlay: z.strictObject({
    enabled: z.boolean(),
    x: z.number().int(),
    y: z.number().int(),
    opacity: z.number().min(0).max(1),
  }),
  toasts: z.strictObject({ enabled: z.boolean() }),
  startWithWindows: z.boolean(),
  obs: z.strictObject({
    enabled: z.boolean(),
    port: z.number().int().min(1024).max(65535),
  }),
  achievementOptIns: z.record(z.string().min(1), achievementOptInSchema),
});

export const settingsPatchSchema = settingsSchema.omit({ schemaVersion: true }).partial();

export type Settings = z.output<typeof settingsSchema>;
export type SettingsPatch = z.output<typeof settingsPatchSchema>;

export const defaultSettings: Settings = {
  schemaVersion: 1,
  savePath: null,
  spoilerLevel: "none",
  overlay: { enabled: false, x: 24, y: 24, opacity: 0.85 },
  toasts: { enabled: true },
  startWithWindows: false,
  obs: { enabled: false, port: 47821 },
  achievementOptIns: {},
};
