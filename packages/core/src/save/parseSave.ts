import type { ZodType } from "zod";
import { factId, frequencyIndex, signalId } from "../ids.ts";
import type { FactId, FrequencyIndex, SignalId } from "../ids.ts";
import type { SaveParseError } from "./SaveParseError.ts";
import type { CounterKey, FactState, SaveSnapshot } from "./SaveSnapshot.ts";
import {
  counterSchema,
  dictConditionsSchema,
  factSaveSchema,
  fullTimeloopsSchema,
  knownFrequenciesSchema,
  knownSignalsSchema,
  saveShapeSchema,
  versionSchema,
} from "./schema.ts";
import type { FactSave, SaveShape } from "./schema.ts";

export type ParseSaveOptions = {
  readonly contentHash: string;
  readonly capturedAt: number;
  readonly knownFactIds?: ReadonlySet<FactId>;
};

export type ParseSaveResult =
  | { readonly ok: true; readonly snapshot: SaveSnapshot }
  | { readonly ok: false; readonly error: SaveParseError };

type SectionReader = <T>(name: string, schema: ZodType<T>, fallback: T) => T;

type JsonResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly error: SaveParseError };

const failure = (
  error: SaveParseError,
): { readonly ok: false; readonly error: SaveParseError } => ({
  ok: false,
  error,
});

const looksTruncated = (text: string): boolean => !text.trimEnd().endsWith("}");

const parseJson = (text: string): JsonResult => {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return failure({ kind: looksTruncated(text) ? "partial-write" : "invalid-json", message });
  }
};

const createSectionReader = (shape: SaveShape, warnings: string[]): SectionReader => {
  return (name, schema, fallback) => {
    const raw = (shape as Record<string, unknown>)[name];
    if (raw === undefined) {
      warnings.push(`${name}: missing`);
      return fallback;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      warnings.push(`${name}: ${result.error.issues[0]?.message ?? "invalid"}`);
      return fallback;
    }
    return result.data;
  };
};

const toFactState = (save: FactSave): FactState => {
  const revealed = save.revealOrder >= 0;
  return {
    revealed,
    read: revealed && save.read,
    newlyRevealed: save.newlyRevealed,
    revealOrder: revealed ? save.revealOrder : null,
  };
};

const readFacts = (shape: SaveShape, warnings: string[]): ReadonlyMap<FactId, FactState> => {
  const facts = new Map<FactId, FactState>();
  for (const [key, raw] of Object.entries(shape.shipLogFactSaves)) {
    const result = factSaveSchema.safeParse(raw);
    if (!result.success) {
      warnings.push(`shipLogFactSaves.${key}: ${result.error.issues[0]?.message ?? "invalid"}`);
      continue;
    }
    if (result.data.id !== key) {
      warnings.push(`shipLogFactSaves.${key}: id mismatch`);
    }
    facts.set(factId(key), toFactState(result.data));
  }
  return facts;
};

const readFrequencies = (known: readonly boolean[]): ReadonlySet<FrequencyIndex> => {
  const frequencies = new Set<FrequencyIndex>();
  known.forEach((isKnown, index) => {
    if (isKnown) frequencies.add(frequencyIndex(index));
  });
  return frequencies;
};

const readSignals = (known: Readonly<Record<string, boolean>>): ReadonlySet<SignalId> => {
  const signals = new Set<SignalId>();
  for (const [key, isKnown] of Object.entries(known)) {
    if (isKnown) signals.add(signalId(key));
  }
  return signals;
};

const readCounters = (read: SectionReader): ReadonlyMap<CounterKey, number> => {
  const sources: readonly (readonly [CounterKey, string])[] = [
    ["burnedMarshmallows", "burnedMarshmallowEaten"],
    ["perfectMarshmallows", "perfectMarshmallowsEaten"],
    ["lastDeathType", "lastDeathType"],
  ];
  return new Map(sources.map(([key, field]) => [key, read(field, counterSchema, 0)]));
};

const findUnknownFactIds = (
  facts: ReadonlyMap<FactId, FactState>,
  knownFactIds: ReadonlySet<FactId> | undefined,
): readonly FactId[] => {
  if (knownFactIds === undefined) return [];
  return [...facts.keys()].filter((id) => !knownFactIds.has(id));
};

const buildSnapshot = (shape: SaveShape, options: ParseSaveOptions): SaveSnapshot => {
  const warnings: string[] = [];
  const read = createSectionReader(shape, warnings);
  const facts = readFacts(shape, warnings);
  const gameVersion = read("version", versionSchema.nullable(), null);

  return {
    schema: "v1",
    gameVersion,
    capturedAt: options.capturedAt,
    contentHash: options.contentHash,
    loopCount: shape.loopCount,
    fullLoops: read("fullTimeloops", fullTimeloopsSchema, 0),
    facts,
    frequencies: readFrequencies(read("knownFrequencies", knownFrequenciesSchema, [])),
    signals: readSignals(read("knownSignals", knownSignalsSchema, {})),
    flags: new Map(Object.entries(read("dictConditions", dictConditionsSchema, {}))),
    counters: readCounters(read),
    unknownFactIds: findUnknownFactIds(facts, options.knownFactIds),
    warnings,
  };
};

export const parseSave = (text: string, options: ParseSaveOptions): ParseSaveResult => {
  const json = parseJson(text);
  if (!json.ok) return json;

  const shape = saveShapeSchema.safeParse(json.value);
  if (!shape.success) {
    return failure({ kind: "unsupported-shape", message: shape.error.issues[0]?.message ?? "" });
  }

  return { ok: true, snapshot: buildSnapshot(shape.data, options) };
};
