import { describe, expect, it } from "vitest";
import { rawNames } from "./raw/names.ts";
import { rawStructure } from "./raw/structure.ts";
import { rawText } from "./raw/text.ts";
import { rawVersion } from "./raw/version.ts";
import { validateContent } from "./validate.ts";
import type { RawContent } from "./validate.ts";

const valid: RawContent = {
  version: { schemaVersion: 1, gameVersion: "1.1.16.1372", contentRevision: 3 },
  structure: {
    locations: [
      { id: "TH", kind: "planet", parentId: null },
      { id: "TM", kind: "moon", parentId: "TH" },
    ],
    curiosities: [{ id: "QM", color: "#ff8800" }],
    entries: [
      { id: "TH_VILLAGE", locationId: "TH", curiosityId: null, parentEntryId: null },
      { id: "TM_ESKER", locationId: "TM", curiosityId: "QM", parentEntryId: null },
    ],
    facts: [
      { id: "TH_VILLAGE_X1", entryId: "TH_VILLAGE", kind: "explore", targets: [] },
      { id: "TH_VILLAGE_R1", entryId: "TH_VILLAGE", kind: "rumor", targets: ["TM_ESKER"] },
    ],
    signals: [{ id: "10", frequencyIndex: 0, locationId: "TM" }],
    achievements: [
      {
        id: "ACH_VISIT_MOON",
        hidden: false,
        relatedFactIds: ["TH_VILLAGE_R1"],
        prerequisiteFactIds: ["TH_VILLAGE_X1"],
        order: 1,
      },
    ],
  },
  names: {
    locations: [
      { id: "TH", name: "Timber Hearth" },
      { id: "TM", name: "Attlerock" },
    ],
    curiosities: [{ id: "QM", name: "Quantum Moon" }],
    "fact-titles": [
      { id: "TH_VILLAGE_X1", title: "The village" },
      { id: "TH_VILLAGE_R1", title: "Someone on the moon" },
    ],
    achievements: [{ id: "ACH_VISIT_MOON", name: "Moonwalker" }],
  },
  text: {
    facts: [
      { id: "TH_VILLAGE_X1", text: "Home." },
      { id: "TH_VILLAGE_R1", text: "Esker went up there." },
    ],
    achievements: [
      {
        id: "ACH_VISIT_MOON",
        description: "Land on the moon.",
        hints: ["Look up.", "Take the ship somewhere close.", "Fly to Attlerock and land."],
      },
    ],
  },
};

const withStructure = (patch: Partial<RawContent["structure"]>): RawContent => ({
  ...valid,
  structure: { ...valid.structure, ...patch },
});

describe("validateContent on the repository data", () => {
  it("has no errors", () => {
    const report = validateContent({
      version: rawVersion,
      structure: rawStructure,
      names: rawNames,
      text: rawText,
    });
    expect(report.errors).toEqual([]);
  });
});

describe("validateContent", () => {
  it("accepts a consistent dataset", () => {
    expect(validateContent(valid)).toEqual({ errors: [], warnings: [] });
  });

  it("reports schema violations with file and path", () => {
    const report = validateContent(
      withStructure({ locations: [{ id: "TH", kind: "rock", parentId: null }] }),
    );
    expect(report.errors).toEqual([expect.stringMatching(/^structure\/locations\.json: 0\.kind/)]);
  });

  it("stops at schema errors before checking references", () => {
    const report = validateContent({ ...valid, version: { schemaVersion: 9 } });
    expect(report.errors.every((error) => error.startsWith("version.json:"))).toBe(true);
  });

  it("reports duplicate ids", () => {
    const fact = valid.structure.facts as readonly unknown[];
    const report = validateContent(withStructure({ facts: [...fact, fact[0]] }));
    expect(report.errors).toContain("structure/facts: duplicate id TH_VILLAGE_X1");
  });

  it("reports references to unknown ids", () => {
    const report = validateContent(
      withStructure({
        facts: [{ id: "TH_VILLAGE_X1", entryId: "NOWHERE", kind: "explore", targets: ["GONE"] }],
      }),
    );
    expect(report.errors).toContain(
      "structure/facts: TH_VILLAGE_X1.entryId references unknown id NOWHERE",
    );
    expect(report.errors).toContain(
      "structure/facts: TH_VILLAGE_X1.targets references unknown id GONE",
    );
  });

  it("reports ids missing from names or text and ids that only exist there", () => {
    const report = validateContent({
      ...valid,
      names: { ...valid.names, locations: [{ id: "TH", name: "Timber Hearth" }] },
      text: {
        ...valid.text,
        facts: [...(valid.text.facts as readonly unknown[]), { id: "GHOST", text: "Boo." }],
      },
    });
    expect(report.errors).toContain("names/locations: missing TM from structure/locations");
    expect(report.errors).toContain("text/facts: GHOST does not exist in structure/facts");
  });

  it("rejects a readable string hidden inside structure", () => {
    const report = validateContent(
      withStructure({
        curiosities: [{ id: "Quantum Moon", color: "#ff8800" }],
        entries: [
          { id: "TH_VILLAGE", locationId: "TH", curiosityId: "Quantum Moon", parentEntryId: null },
          { id: "TM_ESKER", locationId: "TM", curiosityId: null, parentEntryId: null },
        ],
      }),
    );
    expect(report.errors).toContain(
      'structure/curiosities.json: contains readable string "Quantum Moon"',
    );
  });

  it("warns, without failing, about fixture facts that are not catalogued", () => {
    const report = validateContent({
      ...valid,
      fixtureFactIds: ["TH_VILLAGE_X1", "BH_UNKNOWN_X1", "BH_UNKNOWN_X1", "DB_UNKNOWN_X1"],
    });
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([
      "structure/facts.json: 2 fact ids seen in fixtures are not catalogued",
    ]);
  });
});
