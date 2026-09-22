import { z } from "zod";

export const versionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  gameVersion: z.string().regex(/^\d+(\.\d+)+$/),
  contentRevision: z.number().int().nonnegative(),
});

export type ContentVersion = z.output<typeof versionSchema>;
