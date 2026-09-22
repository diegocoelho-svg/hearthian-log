import achievements from "../../data/names/achievements.json";
import curiosities from "../../data/names/curiosities.json";
import factTitles from "../../data/names/fact-titles.json";
import locations from "../../data/names/locations.json";
import type { NamesFile } from "../schemas/names.ts";

export const rawNames: Record<NamesFile, unknown> = {
  locations,
  curiosities,
  "fact-titles": factTitles,
  achievements,
};
