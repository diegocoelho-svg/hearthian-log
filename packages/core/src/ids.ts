declare const brand: unique symbol;

type Branded<Value, Name extends string> = Value & { readonly [brand]: Name };

export type FactId = Branded<string, "FactId">;
export type EntryId = Branded<string, "EntryId">;
export type LocationId = Branded<string, "LocationId">;
export type CuriosityId = Branded<string, "CuriosityId">;
export type SignalId = Branded<string, "SignalId">;
export type FrequencyIndex = Branded<number, "FrequencyIndex">;
export type AchievementId = Branded<string, "AchievementId">;

export const factId = (value: string): FactId => value as FactId;
export const entryId = (value: string): EntryId => value as EntryId;
export const locationId = (value: string): LocationId => value as LocationId;
export const curiosityId = (value: string): CuriosityId => value as CuriosityId;
export const signalId = (value: string): SignalId => value as SignalId;
export const frequencyIndex = (value: number): FrequencyIndex => value as FrequencyIndex;
export const achievementId = (value: string): AchievementId => value as AchievementId;
