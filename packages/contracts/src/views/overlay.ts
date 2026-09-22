import { z } from "zod";
import { countSchema, loopsSchema } from "./shared.ts";

export const overlayViewSchema = z.strictObject({
  kind: z.literal("overlay"),
  loops: loopsSchema,
  facts: countSchema,
  unread: z.number().int().nonnegative(),
});

export type OverlayView = z.output<typeof overlayViewSchema>;
