import {
  achievementId,
  curiosityId,
  entryId,
  factId,
  frequencyIndex,
  locationId,
  signalId,
} from "@hearthian/core";
import { z } from "zod";

const id = z.string().min(1);

export const factIdSchema = id.transform(factId);
export const entryIdSchema = id.transform(entryId);
export const locationIdSchema = id.transform(locationId);
export const curiosityIdSchema = id.transform(curiosityId);
export const signalIdSchema = id.transform(signalId);
export const achievementIdSchema = id.transform(achievementId);
export const frequencyIndexSchema = z.number().int().nonnegative().transform(frequencyIndex);
