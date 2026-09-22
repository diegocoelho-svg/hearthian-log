import { describe, expect, it } from "vitest";
import early from "../../fixtures/early.owsave.json";
import { factId, frequencyIndex, signalId } from "../ids.ts";
import { diffSnapshots } from "./diffSnapshots.ts";
import { parseSave } from "./parseSave.ts";
import type { SaveSnapshot } from "./SaveSnapshot.ts";

type RawFact = { id: string; revealOrder: number; read: boolean; newlyRevealed: boolean };

type RawSave = {
  loopCount: number;
  fullTimeloops: number;
  knownFrequencies: boolean[];
  knownSignals: Record<string, boolean>;
  dictConditions: Record<string, boolean>;
  shipLogFactSaves: Record<string, RawFact>;
};

const base: RawSave = early;

const snapshotOf = (raw: RawSave): SaveSnapshot => {
  const result = parseSave(JSON.stringify(raw), { contentHash: "h", capturedAt: 0 });
  if (!result.ok) throw new Error(result.error.kind);
  return result.snapshot;
};

const withFact = (raw: RawSave, id: string, patch: Partial<RawFact>): RawSave => {
  const current = raw.shipLogFactSaves[id];
  if (current === undefined) throw new Error(`fixture has no fact ${id}`);
  return { ...raw, shipLogFactSaves: { ...raw.shipLogFactSaves, [id]: { ...current, ...patch } } };
};

const previous = snapshotOf(base);

describe("diffSnapshots", () => {
  it("returns nothing on the first read", () => {
    expect(diffSnapshots(null, previous)).toEqual([]);
  });

  it("returns nothing when nothing changed", () => {
    expect(diffSnapshots(previous, snapshotOf(base))).toEqual([]);
  });

  it("emits FactRevealed ordered by reveal order", () => {
    const next = snapshotOf(
      withFact(withFact(base, "IP_RING_WORLD_X1", { revealOrder: 90 }), "DB_FELDSPAR_R1", {
        revealOrder: 80,
      }),
    );
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "FactRevealed", factId: factId("DB_FELDSPAR_R1") },
      { kind: "FactRevealed", factId: factId("IP_RING_WORLD_X1") },
    ]);
  });

  it("emits FactRead only for a fact that was already revealed", () => {
    const unread = Object.values(base.shipLogFactSaves).find(
      (fact) => fact.revealOrder >= 0 && !fact.read,
    );
    if (unread === undefined) throw new Error("fixture needs an unread revealed fact");
    const next = snapshotOf(withFact(base, unread.id, { read: true }));
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "FactRead", factId: factId(unread.id) },
    ]);
  });

  it("does not emit FactRead when a fact is revealed and read at once", () => {
    const next = snapshotOf(withFact(base, "IP_RING_WORLD_X1", { revealOrder: 90, read: true }));
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "FactRevealed", factId: factId("IP_RING_WORLD_X1") },
    ]);
  });

  it("emits SignalLearned when a signal turns true", () => {
    const next = snapshotOf({
      ...base,
      knownSignals: { ...base.knownSignals, 12: true, 30: true },
    });
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "SignalLearned", signalId: signalId("12") },
      { kind: "SignalLearned", signalId: signalId("30") },
    ]);
  });

  it("emits FrequencyLearned for a new frequency index", () => {
    const knownFrequencies = [...base.knownFrequencies];
    knownFrequencies[3] = true;
    const next = snapshotOf({ ...base, knownFrequencies });
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "FrequencyLearned", index: frequencyIndex(3) },
    ]);
  });

  it("emits LoopStarted and LoopCompleted with the counters", () => {
    const next = snapshotOf({ ...base, loopCount: 6, fullTimeloops: 2 });
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "LoopStarted", from: 4, to: 6 },
      { kind: "LoopCompleted", from: 1, to: 2 },
    ]);
  });

  it("emits FlagRaised for flags that became true", () => {
    const next = snapshotOf({
      ...base,
      dictConditions: { ...base.dictConditions, KNOWS_MEDITATION: true, MET_GABBRO: true },
    });
    expect(diffSnapshots(previous, next)).toEqual([
      { kind: "FlagRaised", key: "KNOWS_MEDITATION" },
      { kind: "FlagRaised", key: "MET_GABBRO" },
    ]);
  });

  it("ignores flags that turned false", () => {
    const next = snapshotOf({
      ...base,
      dictConditions: { ...base.dictConditions, HAS_USED_JETPACK: false },
    });
    expect(diffSnapshots(previous, next)).toEqual([]);
  });

  it("emits only SaveReset when the loop count went down", () => {
    const next = snapshotOf({ ...base, loopCount: 1, dictConditions: { NEW_FLAG: true } });
    expect(diffSnapshots(previous, next)).toEqual([{ kind: "SaveReset" }]);
  });

  it("emits only SaveReset when a revealed fact disappeared", () => {
    const next = snapshotOf(withFact(base, "TH_VILLAGE_X1", { revealOrder: -1 }));
    expect(diffSnapshots(previous, next)).toEqual([{ kind: "SaveReset" }]);
  });
});
