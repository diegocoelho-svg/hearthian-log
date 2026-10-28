import { z } from "zod";
import type { curiosityNameSchema, locationNameSchema } from "../schemas/names.ts";
import {
  curiositySchema,
  locationSchema,
  signalSchema,
  type entrySchema,
  type factSchema,
} from "../schemas/structure.ts";
import {
  childrenNamed,
  optionalChild,
  parseXml,
  requiredChild,
  textOf,
  type XmlElement,
} from "./xml.ts";

export const shipLogSupplementSchema = z.strictObject({
  locations: z.array(locationSchema.extend({ uiTextKey: z.string().regex(/^\d+$/) })),
  curiosities: z.array(curiositySchema),
  signals: z.array(signalSchema),
});

export type ShipLogImport = {
  readonly structure: {
    readonly locations: z.input<typeof locationSchema>[];
    readonly curiosities: z.input<typeof curiositySchema>[];
    readonly entries: z.input<typeof entrySchema>[];
    readonly facts: z.input<typeof factSchema>[];
    readonly signals: z.input<typeof signalSchema>[];
  };
  readonly names: {
    readonly locations: z.input<typeof locationNameSchema>[];
    readonly curiosities: z.input<typeof curiosityNameSchema>[];
  };
};

export type ShipLogSources = {
  readonly astroObjects: readonly string[];
  readonly translationTables: readonly string[];
  readonly supplement: unknown;
};

const allowedChildren: Readonly<Record<string, readonly string[]>> = {
  AstroObjectEntry: ["ID", "Entry"],
  Entry: [
    "ID",
    "Name",
    "Curiosity",
    "IsCuriosity",
    "ExploreFact",
    "RumorFact",
    "Entry",
    "AltPhotoCondition",
    "IgnoreMoreToExplore",
    "IgnoreMoreToExploreCondition",
    "ParentIgnoreNotRevealed",
  ],
  ExploreFact: ["ID", "Text", "AltText", "IgnoreMoreToExplore", "ClueType"],
  RumorFact: [
    "ID",
    "Text",
    "AltText",
    "IgnoreMoreToExplore",
    "SourceID",
    "RumorName",
    "RumorNamePriority",
  ],
};

const assertKnownTags = (element: XmlElement): void => {
  const allowed = allowedChildren[element.name];
  if (allowed === undefined) return;
  for (const child of element.children) {
    if (!allowed.includes(child.name)) {
      throw new Error(`unknown <${child.name}> inside <${element.name}>`);
    }
    assertKnownTags(child);
  }
};

const idOf = (element: XmlElement): string => textOf(requiredChild(element, "ID"));

type Collected = {
  entries: ShipLogImport["structure"]["entries"];
  facts: ShipLogImport["structure"]["facts"];
  curiosityNames: Map<string, string>;
};

const factKinds: Readonly<Record<string, "explore" | "rumor">> = {
  ExploreFact: "explore",
  RumorFact: "rumor",
};

const collectEntry = (
  entry: XmlElement,
  locationId: string,
  parentEntryId: string | null,
  collected: Collected,
): void => {
  const id = idOf(entry);
  const curiosity = optionalChild(entry, "Curiosity");
  const curiosityId = curiosity === null ? null : textOf(curiosity);
  collected.entries.push({ id, locationId, curiosityId, parentEntryId });
  for (const child of entry.children) {
    const kind = factKinds[child.name];
    if (kind !== undefined)
      collected.facts.push({ id: idOf(child), entryId: id, kind, targets: [] });
  }
  if (optionalChild(entry, "IsCuriosity") !== null) {
    if (curiosityId === null) throw new Error(`${id} is a curiosity without <Curiosity>`);
    if (collected.curiosityNames.has(curiosityId)) {
      throw new Error(`curiosity ${curiosityId} is named by more than one entry`);
    }
    collected.curiosityNames.set(curiosityId, textOf(requiredChild(entry, "Name")));
  }
  for (const child of childrenNamed(entry, "Entry")) {
    collectEntry(child, locationId, id, collected);
  }
};

const assertSameIds = (
  label: string,
  expected: Iterable<string>,
  actual: Iterable<string>,
): void => {
  const expectedIds = new Set(expected);
  const actualIds = new Set(actual);
  const missing = [...expectedIds].filter((id) => !actualIds.has(id));
  const extra = [...actualIds].filter((id) => !expectedIds.has(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(`${label}: missing [${missing.join(", ")}], unexpected [${extra.join(", ")}]`);
  }
};

const pairsOf = (table: XmlElement, section: string, entryTag: string): Map<string, string> =>
  new Map(
    childrenNamed(requiredChild(table, section), entryTag).map((entry) => [
      textOf(requiredChild(entry, "key")),
      textOf(requiredChild(entry, "value")),
    ]),
  );

const englishUiTexts = (
  translationTables: readonly string[],
  curiosityNames: readonly string[],
): ReadonlyMap<string, string> => {
  const english = translationTables.map(parseXml).filter((table) => {
    const shipLog = pairsOf(table, "table_shipLog", "TranslationTableEntry");
    return curiosityNames.every((name) => shipLog.get(name) === name);
  });
  const [table, ...rest] = english;
  if (table === undefined || rest.length > 0) {
    throw new Error(`expected one English translation table, found ${english.length}`);
  }
  return pairsOf(table, "table_ui", "TranslationTableEntryUI");
};

export const importShipLog = (sources: ShipLogSources): ShipLogImport => {
  const supplement = shipLogSupplementSchema.parse(sources.supplement);
  const astroObjects = new Map(
    sources.astroObjects.map(parseXml).map((element) => {
      if (element.name !== "AstroObjectEntry") {
        throw new Error(`expected <AstroObjectEntry>, got <${element.name}>`);
      }
      assertKnownTags(element);
      return [idOf(element), element] as const;
    }),
  );
  assertSameIds(
    "supplement locations",
    astroObjects.keys(),
    supplement.locations.map((location) => location.id),
  );

  const collected: Collected = { entries: [], facts: [], curiosityNames: new Map() };
  for (const location of supplement.locations) {
    const astroObject = astroObjects.get(location.id);
    if (astroObject === undefined) throw new Error(`no ship log for ${location.id}`);
    for (const entry of childrenNamed(astroObject, "Entry")) {
      collectEntry(entry, location.id, null, collected);
    }
  }

  const referenced = collected.entries.flatMap((entry) =>
    entry.curiosityId === null ? [] : [entry.curiosityId],
  );
  assertSameIds(
    "supplement curiosities",
    new Set([...referenced, ...collected.curiosityNames.keys()]),
    supplement.curiosities.map((curiosity) => curiosity.id),
  );

  const curiosityNames = supplement.curiosities.map((curiosity) => {
    const name = collected.curiosityNames.get(curiosity.id);
    if (name === undefined) throw new Error(`curiosity ${curiosity.id} has no named entry`);
    return { id: curiosity.id, name };
  });
  const uiTexts = englishUiTexts(
    sources.translationTables,
    curiosityNames.map((curiosity) => curiosity.name),
  );

  return {
    structure: {
      locations: supplement.locations.map(({ id, kind, parentId }) => ({ id, kind, parentId })),
      curiosities: supplement.curiosities.map(({ id, color }) => ({ id, color })),
      entries: collected.entries,
      facts: collected.facts,
      signals: supplement.signals.map(({ id, frequencyIndex, locationId }) => ({
        id,
        frequencyIndex,
        locationId,
      })),
    },
    names: {
      locations: supplement.locations.map(({ id, uiTextKey }) => {
        const name = uiTexts.get(uiTextKey);
        if (name === undefined) throw new Error(`no UI text ${uiTextKey} for ${id}`);
        return { id, name };
      }),
      curiosities: curiosityNames,
    },
  };
};
