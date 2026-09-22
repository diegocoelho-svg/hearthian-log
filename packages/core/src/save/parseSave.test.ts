import { describe, expect, it } from "vitest";
import early from "../../fixtures/early.owsave.json";
import empty from "../../fixtures/empty.owsave.json";
import partialWrite from "../../fixtures/partial-write.owsave.txt?raw";
import unknownShape from "../../fixtures/unknown-shape.owsave.json";
import { factId, frequencyIndex, signalId } from "../ids.ts";
import { parseSave } from "./parseSave.ts";
import type { ParseSaveOptions } from "./parseSave.ts";
import type { SaveSnapshot } from "./SaveSnapshot.ts";

const options: ParseSaveOptions = { contentHash: "abc123", capturedAt: 1_700_000_000_000 };

const parseOk = (text: string, extra: Partial<ParseSaveOptions> = {}): SaveSnapshot => {
  const result = parseSave(text, { ...options, ...extra });
  if (!result.ok) throw new Error(result.error.kind);
  return result.snapshot;
};

const withField = (field: string, value: unknown): string =>
  JSON.stringify({ ...early, [field]: value });

const revealedCount = (snapshot: SaveSnapshot): number =>
  [...snapshot.facts.values()].filter((fact) => fact.revealed).length;

describe("parseSave on the early fixture", () => {
  const snapshot = parseOk(JSON.stringify(early));

  it("detects the v1 shape and keeps the game version", () => {
    expect(snapshot.schema).toBe("v1");
    expect(snapshot.gameVersion).toBe("1.1.16.1372");
  });

  it("carries the hash and timestamp given by the caller", () => {
    expect(snapshot.contentHash).toBe("abc123");
    expect(snapshot.capturedAt).toBe(1_700_000_000_000);
  });

  it("keeps every fact of the game, revealed or not", () => {
    expect(snapshot.facts.size).toBe(375);
    expect(revealedCount(snapshot)).toBe(45);
  });

  it("marks facts with a reveal order as revealed", () => {
    const fact = snapshot.facts.get(factId("TH_VILLAGE_X1"));
    expect(fact?.revealed).toBe(true);
    expect(fact?.revealOrder).toBeGreaterThanOrEqual(0);
  });

  it("nulls the reveal order of unrevealed facts", () => {
    expect(snapshot.facts.get(factId("IP_RING_WORLD_X1"))).toEqual({
      revealed: false,
      read: false,
      newlyRevealed: false,
      revealOrder: null,
    });
  });

  it("never reports an unrevealed fact as read", () => {
    const raw = early.shipLogFactSaves.BH_RIEBECK_R1;
    expect(raw.read).toBe(true);
    expect(raw.revealOrder).toBe(-1);
    expect(snapshot.facts.get(factId("BH_RIEBECK_R1"))?.read).toBe(false);
  });

  it("keeps newly revealed flags", () => {
    expect(snapshot.facts.get(factId("TH_NOMAI_MINE_X1"))?.newlyRevealed).toBe(true);
    expect(snapshot.facts.get(factId("TH_VILLAGE_X1"))?.newlyRevealed).toBe(false);
  });

  it("reads loop counters", () => {
    expect(snapshot.loopCount).toBe(4);
    expect(snapshot.fullLoops).toBe(1);
  });

  it("keeps only known frequencies by index", () => {
    expect([...snapshot.frequencies]).toEqual([frequencyIndex(0), frequencyIndex(1)]);
  });

  it("keeps only signals whose value is true", () => {
    expect([...snapshot.signals].sort()).toEqual(["10", "11", "20", "21"].map(signalId));
  });

  it("preserves false flags so consumers can ask for true explicitly", () => {
    expect(snapshot.flags.get("HAS_USED_JETPACK")).toBe(true);
    expect(snapshot.flags.get("KNOWS_MEDITATION")).toBe(false);
    expect(snapshot.flags.has("MET_SOLANUM")).toBe(false);
  });

  it("reads the counters", () => {
    expect(snapshot.counters.get("burnedMarshmallows")).toBe(1);
    expect(snapshot.counters.get("perfectMarshmallows")).toBe(0);
    expect(snapshot.counters.get("lastDeathType")).toBe(1);
  });

  it("has no warnings and no unknown facts without a content table", () => {
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.unknownFactIds).toEqual([]);
  });
});

describe("parseSave on the empty fixture", () => {
  const snapshot = parseOk(JSON.stringify(empty));

  it("lists every fact with none revealed", () => {
    expect(snapshot.facts.size).toBe(375);
    expect(revealedCount(snapshot)).toBe(0);
  });

  it("starts with a single frequency and nothing else", () => {
    expect([...snapshot.frequencies]).toEqual([frequencyIndex(0)]);
    expect(snapshot.signals.size).toBe(0);
    expect(snapshot.flags.size).toBe(0);
  });
});

describe("parseSave against a content table", () => {
  it("reports facts missing from the table", () => {
    const knownFactIds = new Set(
      Object.keys(early.shipLogFactSaves)
        .filter((id) => id !== "TH_VILLAGE_X1")
        .map(factId),
    );
    const snapshot = parseOk(JSON.stringify(early), { knownFactIds });
    expect(snapshot.unknownFactIds).toEqual([factId("TH_VILLAGE_X1")]);
  });
});

describe("parseSave degrading on secondary fields", () => {
  it("keeps the snapshot when signals have the wrong type", () => {
    const snapshot = parseOk(withField("knownSignals", [1, 2, 3]));
    expect(snapshot.signals.size).toBe(0);
    expect(snapshot.warnings).toEqual([expect.stringMatching(/^knownSignals:/)]);
  });

  it("falls back to zero full loops when the field is missing", () => {
    const withoutFullLoops: Partial<typeof early> = { ...early };
    delete withoutFullLoops.fullTimeloops;
    const snapshot = parseOk(JSON.stringify(withoutFullLoops));
    expect(snapshot.fullLoops).toBe(0);
    expect(snapshot.warnings).toEqual(["fullTimeloops: missing"]);
  });

  it("skips a malformed fact and warns", () => {
    const snapshot = parseOk(
      withField("shipLogFactSaves", { ...early.shipLogFactSaves, TH_VILLAGE_X1: { id: 1 } }),
    );
    expect(snapshot.facts.has(factId("TH_VILLAGE_X1"))).toBe(false);
    expect(snapshot.facts.size).toBe(374);
    expect(snapshot.warnings).toEqual([expect.stringMatching(/^shipLogFactSaves\.TH_VILLAGE_X1/)]);
  });

  it("warns when a fact key does not match its id", () => {
    const snapshot = parseOk(
      withField("shipLogFactSaves", {
        RENAMED: { id: "TH_VILLAGE_X1", revealOrder: 3, read: true, newlyRevealed: false },
      }),
    );
    expect(snapshot.facts.get(factId("RENAMED"))?.revealed).toBe(true);
    expect(snapshot.warnings).toEqual(["shipLogFactSaves.RENAMED: id mismatch"]);
  });
});

describe("parseSave failures", () => {
  it("returns partial-write for the truncated fixture", () => {
    expect(parseSave(partialWrite, options)).toMatchObject({
      ok: false,
      error: { kind: "partial-write" },
    });
  });

  it("returns partial-write for a save cut anywhere", () => {
    const text = JSON.stringify(early);
    expect(parseSave(text.slice(0, 200), options)).toMatchObject({
      error: { kind: "partial-write" },
    });
    expect(parseSave("", options)).toMatchObject({ error: { kind: "partial-write" } });
  });

  it("returns invalid-json for a complete but broken document", () => {
    expect(parseSave('{ "loopCount": }', options)).toMatchObject({
      error: { kind: "invalid-json" },
    });
  });

  it("returns unsupported-shape for valid json without the save fields", () => {
    expect(parseSave(JSON.stringify(unknownShape), options)).toMatchObject({
      error: { kind: "unsupported-shape" },
    });
    expect(parseSave("[]", options)).toMatchObject({ error: { kind: "unsupported-shape" } });
  });
});
