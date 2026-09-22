import { describe, expect, it } from "vitest";
import { namesSchemas } from "./names.ts";
import { structureSchemas } from "./structure.ts";
import { textSchemas } from "./text.ts";
import { versionSchema } from "./version.ts";

const location = { id: "TH", kind: "planet", parentId: null };
const achievement = {
  id: "ACH_TEST",
  hidden: false,
  relatedFactIds: ["TH_VILLAGE_X1"],
  prerequisiteFactIds: [],
  order: 1,
};

describe("structure schemas", () => {
  it("accepts a location and rejects an unknown kind", () => {
    expect(structureSchemas.locations.safeParse([location]).success).toBe(true);
    expect(structureSchemas.locations.safeParse([{ ...location, kind: "asteroid" }]).success).toBe(
      false,
    );
  });

  it("rejects extra keys so names cannot sneak into structure", () => {
    expect(
      structureSchemas.locations.safeParse([{ ...location, name: "Timber Hearth" }]).success,
    ).toBe(false);
  });

  it("only accepts hex colors for curiosities", () => {
    expect(structureSchemas.curiosities.safeParse([{ id: "QM", color: "#ff8800" }]).success).toBe(
      true,
    );
    expect(structureSchemas.curiosities.safeParse([{ id: "QM", color: "orange" }]).success).toBe(
      false,
    );
  });

  it("requires a non-negative integer frequency index on signals", () => {
    expect(
      structureSchemas.signals.safeParse([{ id: "10", frequencyIndex: 1, locationId: null }])
        .success,
    ).toBe(true);
    expect(
      structureSchemas.signals.safeParse([{ id: "10", frequencyIndex: -1, locationId: null }])
        .success,
    ).toBe(false);
  });

  it("requires every achievement field", () => {
    expect(structureSchemas.achievements.safeParse([achievement]).success).toBe(true);
    const { order: _order, ...withoutOrder } = achievement;
    expect(structureSchemas.achievements.safeParse([withoutOrder]).success).toBe(false);
  });
});

describe("names schemas", () => {
  it("rejects an empty name", () => {
    expect(namesSchemas.locations.safeParse([{ id: "TH", name: "" }]).success).toBe(false);
    expect(namesSchemas["fact-titles"].safeParse([{ id: "TH_X", title: "A title" }]).success).toBe(
      true,
    );
  });
});

describe("text schemas", () => {
  it("requires exactly three hints per achievement", () => {
    const base = { id: "ACH_TEST", description: "Do the thing" };
    expect(
      textSchemas.achievements.safeParse([{ ...base, hints: ["vague", "medium", "explicit"] }])
        .success,
    ).toBe(true);
    expect(
      textSchemas.achievements.safeParse([{ ...base, hints: ["vague", "medium"] }]).success,
    ).toBe(false);
  });
});

describe("version schema", () => {
  it("only accepts the known schema version and a dotted game version", () => {
    expect(
      versionSchema.safeParse({ schemaVersion: 1, gameVersion: "1.1.16.1372", contentRevision: 0 })
        .success,
    ).toBe(true);
    expect(
      versionSchema.safeParse({ schemaVersion: 2, gameVersion: "1.1.16.1372", contentRevision: 0 })
        .success,
    ).toBe(false);
    expect(
      versionSchema.safeParse({ schemaVersion: 1, gameVersion: "latest", contentRevision: 0 })
        .success,
    ).toBe(false);
  });
});
