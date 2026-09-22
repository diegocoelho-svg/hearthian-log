import type { FactId } from "../ids.ts";
import type { SaveEvent } from "./SaveEvent.ts";
import type { FactState, SaveSnapshot } from "./SaveSnapshot.ts";

type FactChange = {
  readonly factId: FactId;
  readonly before: FactState | undefined;
  readonly after: FactState;
};

const factChanges = (previous: SaveSnapshot, next: SaveSnapshot): readonly FactChange[] =>
  [...next.facts.entries()].map(([factId, after]) => ({
    factId,
    before: previous.facts.get(factId),
    after,
  }));

const lostRevealedFact = (previous: SaveSnapshot, next: SaveSnapshot): boolean =>
  [...previous.facts.entries()].some(
    ([factId, before]) => before.revealed && next.facts.get(factId)?.revealed !== true,
  );

const isReset = (previous: SaveSnapshot, next: SaveSnapshot): boolean =>
  next.loopCount < previous.loopCount || lostRevealedFact(previous, next);

const revealedEvents = (changes: readonly FactChange[]): SaveEvent[] =>
  changes
    .filter(({ before, after }) => after.revealed && before?.revealed !== true)
    .sort((a, b) => (a.after.revealOrder ?? 0) - (b.after.revealOrder ?? 0))
    .map(({ factId }) => ({ kind: "FactRevealed", factId }));

const readEvents = (changes: readonly FactChange[]): SaveEvent[] =>
  changes
    .filter(({ before, after }) => before?.revealed === true && !before.read && after.read)
    .map(({ factId }) => ({ kind: "FactRead", factId }));

const signalEvents = (previous: SaveSnapshot, next: SaveSnapshot): SaveEvent[] =>
  [...next.signals]
    .filter((signalId) => !previous.signals.has(signalId))
    .map((signalId) => ({ kind: "SignalLearned", signalId }));

const frequencyEvents = (previous: SaveSnapshot, next: SaveSnapshot): SaveEvent[] =>
  [...next.frequencies]
    .filter((index) => !previous.frequencies.has(index))
    .map((index) => ({ kind: "FrequencyLearned", index }));

const loopEvents = (previous: SaveSnapshot, next: SaveSnapshot): SaveEvent[] => {
  const events: SaveEvent[] = [];
  if (next.loopCount > previous.loopCount) {
    events.push({ kind: "LoopStarted", from: previous.loopCount, to: next.loopCount });
  }
  if (next.fullLoops > previous.fullLoops) {
    events.push({ kind: "LoopCompleted", from: previous.fullLoops, to: next.fullLoops });
  }
  return events;
};

const flagEvents = (previous: SaveSnapshot, next: SaveSnapshot): SaveEvent[] =>
  [...next.flags.entries()]
    .filter(([key, value]) => value && previous.flags.get(key) !== true)
    .map(([key]) => ({ kind: "FlagRaised", key }));

export const diffSnapshots = (
  previous: SaveSnapshot | null,
  next: SaveSnapshot,
): readonly SaveEvent[] => {
  if (previous === null) return [];
  if (isReset(previous, next)) return [{ kind: "SaveReset" }];

  const changes = factChanges(previous, next);
  return [
    ...revealedEvents(changes),
    ...readEvents(changes),
    ...signalEvents(previous, next),
    ...frequencyEvents(previous, next),
    ...loopEvents(previous, next),
    ...flagEvents(previous, next),
  ];
};
