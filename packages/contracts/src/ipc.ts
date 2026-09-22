import { achievementIdSchema } from "@hearthian/core";
import { z } from "zod";
import { settingsPatchSchema, settingsSchema } from "./settings.ts";
import { hintLayerSchema, spoilerLevelSchema } from "./spoiler.ts";
import { achievementHintViewSchema } from "./views/achievementHint.ts";
import { dashboardViewSchema } from "./views/dashboard.ts";
import { overlayViewSchema } from "./views/overlay.ts";
import { toastViewSchema } from "./views/toast.ts";

export const mainToRenderer = {
  "view:update": z.union([dashboardViewSchema, overlayViewSchema]),
  "toast:show": toastViewSchema,
};

export const rendererToMain = {
  "settings:get": { request: z.undefined(), response: settingsSchema },
  "settings:update": { request: settingsPatchSchema, response: settingsSchema },
  "spoiler:request": {
    request: z.strictObject({ level: spoilerLevelSchema }),
    response: z.strictObject({ confirmed: z.boolean() }),
  },
  "achievement:reveal": {
    request: z.strictObject({ id: achievementIdSchema, layer: hintLayerSchema }),
    response: achievementHintViewSchema,
  },
  "save:pick-path": { request: z.undefined(), response: z.string().nullable() },
};

export type MainToRendererChannel = keyof typeof mainToRenderer;
export type RendererToMainChannel = keyof typeof rendererToMain;

export type MainToRendererPayload<Channel extends MainToRendererChannel> = z.output<
  (typeof mainToRenderer)[Channel]
>;
export type RendererToMainRequest<Channel extends RendererToMainChannel> = z.output<
  (typeof rendererToMain)[Channel]["request"]
>;
export type RendererToMainResponse<Channel extends RendererToMainChannel> = z.output<
  (typeof rendererToMain)[Channel]["response"]
>;
