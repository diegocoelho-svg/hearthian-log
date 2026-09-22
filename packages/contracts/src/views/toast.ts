import { locationIdSchema } from "@hearthian/core";
import { z } from "zod";

export const toastViewSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("fact-revealed-at"),
    locationId: locationIdSchema,
    locationName: z.string().min(1),
  }),
  z.strictObject({ kind: z.literal("fact-revealed") }),
]);

export type ToastView = z.output<typeof toastViewSchema>;
