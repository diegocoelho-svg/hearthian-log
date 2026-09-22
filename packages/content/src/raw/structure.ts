import achievements from "../../data/structure/achievements.json";
import curiosities from "../../data/structure/curiosities.json";
import entries from "../../data/structure/entries.json";
import facts from "../../data/structure/facts.json";
import locations from "../../data/structure/locations.json";
import signals from "../../data/structure/signals.json";
import type { StructureFile } from "../schemas/structure.ts";

export const rawStructure: Record<StructureFile, unknown> = {
  locations,
  curiosities,
  entries,
  facts,
  signals,
  achievements,
};
