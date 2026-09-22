import type { FactId, FrequencyIndex, SignalId } from "../ids.ts";

export type SaveSchema = "unknown" | "v1";

export type FactState = {
  readonly revealed: boolean;
  readonly read: boolean;
  readonly newlyRevealed: boolean;
  readonly revealOrder: number | null;
};

export type CounterKey = "burnedMarshmallows" | "perfectMarshmallows" | "lastDeathType";

export type SaveSnapshot = {
  readonly schema: SaveSchema;
  readonly gameVersion: string | null;
  readonly capturedAt: number;
  readonly contentHash: string;
  readonly loopCount: number;
  readonly fullLoops: number;
  readonly facts: ReadonlyMap<FactId, FactState>;
  readonly frequencies: ReadonlySet<FrequencyIndex>;
  readonly signals: ReadonlySet<SignalId>;
  readonly flags: ReadonlyMap<string, boolean>;
  readonly counters: ReadonlyMap<CounterKey, number>;
  readonly unknownFactIds: readonly FactId[];
  readonly warnings: readonly string[];
};
