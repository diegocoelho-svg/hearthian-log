import { describe, expect, it } from "vitest";
import { defaultSettings, settingsPatchSchema, settingsSchema } from "./settings.ts";

describe("settings schema", () => {
  it("accepts the defaults", () => {
    expect(settingsSchema.safeParse(defaultSettings).success).toBe(true);
  });

  it("starts with spoilers off and nothing enabled that talks to the outside", () => {
    expect(defaultSettings.spoilerLevel).toBe("none");
    expect(defaultSettings.obs.enabled).toBe(false);
    expect(defaultSettings.startWithWindows).toBe(false);
  });

  it("rejects an unknown spoiler level", () => {
    expect(settingsSchema.safeParse({ ...defaultSettings, spoilerLevel: "all" }).success).toBe(
      false,
    );
  });

  it("rejects a privileged obs port and an opacity outside 0..1", () => {
    expect(
      settingsSchema.safeParse({ ...defaultSettings, obs: { enabled: true, port: 80 } }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({
        ...defaultSettings,
        overlay: { ...defaultSettings.overlay, opacity: 1.5 },
      }).success,
    ).toBe(false);
  });

  it("only allows opt-in layers 0 to 3", () => {
    expect(
      settingsSchema.safeParse({ ...defaultSettings, achievementOptIns: { ACH_X: 2 } }).success,
    ).toBe(true);
    expect(
      settingsSchema.safeParse({ ...defaultSettings, achievementOptIns: { ACH_X: 4 } }).success,
    ).toBe(false);
  });

  it("rejects unknown keys so a typo never silently persists", () => {
    expect(settingsSchema.safeParse({ ...defaultSettings, spoilers: "none" }).success).toBe(false);
  });

  it("never lets a patch change the schema version", () => {
    expect(settingsPatchSchema.safeParse({ spoilerLevel: "titles" }).success).toBe(true);
    expect(settingsPatchSchema.safeParse({ schemaVersion: 2 }).success).toBe(false);
  });
});
