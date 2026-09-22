import type { FactId, FrequencyIndex, SignalId } from "../ids.ts";

export type SaveEvent =
  | { readonly kind: "FactRevealed"; readonly factId: FactId }
  | { readonly kind: "FactRead"; readonly factId: FactId }
  | { readonly kind: "SignalLearned"; readonly signalId: SignalId }
  | { readonly kind: "FrequencyLearned"; readonly index: FrequencyIndex }
  | { readonly kind: "LoopStarted"; readonly from: number; readonly to: number }
  | { readonly kind: "LoopCompleted"; readonly from: number; readonly to: number }
  | { readonly kind: "FlagRaised"; readonly key: string }
  | { readonly kind: "SaveReset" };
