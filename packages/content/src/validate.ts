import type { ZodType } from "zod";
import { namesSchemas } from "./schemas/names.ts";
import type { NamesFile } from "./schemas/names.ts";
import { structureSchemas } from "./schemas/structure.ts";
import type { StructureFile } from "./schemas/structure.ts";
import { textSchemas } from "./schemas/text.ts";
import type { TextFile } from "./schemas/text.ts";
import { versionSchema } from "./schemas/version.ts";

export type RawContent = {
  readonly version: unknown;
  readonly structure: Readonly<Record<StructureFile, unknown>>;
  readonly names: Readonly<Record<NamesFile, unknown>>;
  readonly text: Readonly<Record<TextFile, unknown>>;
  readonly fixtureFactIds?: readonly string[];
};

export type ValidationReport = {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

type ParsedGroup<Schemas extends Record<string, ZodType>> = {
  [File in keyof Schemas]: ReturnType<Schemas[File]["parse"]>;
};

type Parsed = {
  readonly structure: ParsedGroup<typeof structureSchemas>;
  readonly names: ParsedGroup<typeof namesSchemas>;
  readonly text: ParsedGroup<typeof textSchemas>;
};

type Identified = { readonly id: string };

const parseGroup = <Schemas extends Record<string, ZodType>>(
  folder: string,
  schemas: Schemas,
  raw: Readonly<Record<keyof Schemas, unknown>>,
  errors: string[],
): ParsedGroup<Schemas> | null => {
  const parsed: Partial<Record<keyof Schemas, unknown>> = {};
  let failed = false;
  const entries = Object.entries(schemas) as [keyof Schemas & string, ZodType][];
  for (const [file, schema] of entries) {
    const result = schema.safeParse(raw[file]);
    if (result.success) {
      parsed[file] = result.data;
      continue;
    }
    failed = true;
    for (const issue of result.error.issues) {
      errors.push(`${folder}/${file}.json: ${issue.path.join(".")} ${issue.message}`);
    }
  }
  return failed ? null : (parsed as ParsedGroup<Schemas>);
};

const idSet = (items: readonly Identified[]): ReadonlySet<string> =>
  new Set(items.map((item) => item.id));

const checkDuplicates = (file: string, items: readonly Identified[], errors: string[]): void => {
  const seen = new Set<string>();
  for (const { id } of items) {
    if (seen.has(id)) errors.push(`${file}: duplicate id ${id}`);
    seen.add(id);
  }
};

const checkReference = (
  file: string,
  ownerId: string,
  field: string,
  target: string | null,
  known: ReadonlySet<string>,
  errors: string[],
): void => {
  if (target !== null && !known.has(target)) {
    errors.push(`${file}: ${ownerId}.${field} references unknown id ${target}`);
  }
};

const checkReferences = (structure: Parsed["structure"], errors: string[]): void => {
  const locations = idSet(structure.locations);
  const curiosities = idSet(structure.curiosities);
  const entries = idSet(structure.entries);
  const facts = idSet(structure.facts);

  for (const location of structure.locations) {
    checkReference(
      "structure/locations",
      location.id,
      "parentId",
      location.parentId,
      locations,
      errors,
    );
  }
  for (const entry of structure.entries) {
    checkReference(
      "structure/entries",
      entry.id,
      "locationId",
      entry.locationId,
      locations,
      errors,
    );
    checkReference(
      "structure/entries",
      entry.id,
      "curiosityId",
      entry.curiosityId,
      curiosities,
      errors,
    );
    checkReference(
      "structure/entries",
      entry.id,
      "parentEntryId",
      entry.parentEntryId,
      entries,
      errors,
    );
  }
  for (const fact of structure.facts) {
    checkReference("structure/facts", fact.id, "entryId", fact.entryId, entries, errors);
    for (const target of fact.targets) {
      checkReference("structure/facts", fact.id, "targets", target, entries, errors);
    }
  }
  for (const signal of structure.signals) {
    checkReference(
      "structure/signals",
      signal.id,
      "locationId",
      signal.locationId,
      locations,
      errors,
    );
  }
  for (const achievement of structure.achievements) {
    for (const id of achievement.relatedFactIds) {
      checkReference("structure/achievements", achievement.id, "relatedFactIds", id, facts, errors);
    }
    for (const id of achievement.prerequisiteFactIds) {
      checkReference(
        "structure/achievements",
        achievement.id,
        "prerequisiteFactIds",
        id,
        facts,
        errors,
      );
    }
  }
};

const checkParity = (
  structureFile: string,
  structureItems: readonly Identified[],
  otherFile: string,
  otherItems: readonly Identified[],
  errors: string[],
): void => {
  const structureIds = idSet(structureItems);
  const otherIds = idSet(otherItems);
  for (const id of structureIds) {
    if (!otherIds.has(id)) errors.push(`${otherFile}: missing ${id} from ${structureFile}`);
  }
  for (const id of otherIds) {
    if (!structureIds.has(id))
      errors.push(`${otherFile}: ${id} does not exist in ${structureFile}`);
  }
};

const checkAllParity = ({ structure, names, text }: Parsed, errors: string[]): void => {
  checkParity(
    "structure/locations",
    structure.locations,
    "names/locations",
    names.locations,
    errors,
  );
  checkParity(
    "structure/curiosities",
    structure.curiosities,
    "names/curiosities",
    names.curiosities,
    errors,
  );
  checkParity(
    "structure/facts",
    structure.facts,
    "names/fact-titles",
    names["fact-titles"],
    errors,
  );
  checkParity(
    "structure/achievements",
    structure.achievements,
    "names/achievements",
    names.achievements,
    errors,
  );
  checkParity("structure/facts", structure.facts, "text/facts", text.facts, errors);
  checkParity(
    "structure/achievements",
    structure.achievements,
    "text/achievements",
    text.achievements,
    errors,
  );
};

const readableStrings = ({ names, text }: Parsed): readonly string[] => [
  ...names.locations.map((item) => item.name),
  ...names.curiosities.map((item) => item.name),
  ...names["fact-titles"].map((item) => item.title),
  ...names.achievements.map((item) => item.name),
  ...text.facts.map((item) => item.text),
  ...text.achievements.flatMap((item) => [item.description, ...item.hints]),
];

const checkStructureIsOpaque = (raw: RawContent, parsed: Parsed, errors: string[]): void => {
  const readable = readableStrings(parsed);
  for (const [file, content] of Object.entries(raw.structure)) {
    const serialized = JSON.stringify(content);
    for (const value of readable) {
      if (serialized.includes(JSON.stringify(value).slice(1, -1))) {
        errors.push(`structure/${file}.json: contains readable string "${value}"`);
      }
    }
  }
};

const checkFixtureCoverage = (
  fixtureFactIds: readonly string[] | undefined,
  facts: readonly Identified[],
  warnings: string[],
): void => {
  if (fixtureFactIds === undefined) return;
  const known = idSet(facts);
  const missing = [...new Set(fixtureFactIds)].filter((id) => !known.has(id));
  if (missing.length > 0) {
    warnings.push(
      `structure/facts.json: ${missing.length} fact ids seen in fixtures are not catalogued`,
    );
  }
};

export const validateContent = (raw: RawContent): ValidationReport => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const version = versionSchema.safeParse(raw.version);
  if (!version.success) {
    for (const issue of version.error.issues) {
      errors.push(`version.json: ${issue.path.join(".")} ${issue.message}`);
    }
  }

  const structure = parseGroup("structure", structureSchemas, raw.structure, errors);
  const names = parseGroup("names", namesSchemas, raw.names, errors);
  const text = parseGroup("text", textSchemas, raw.text, errors);
  if (structure === null || names === null || text === null) return { errors, warnings };

  const parsed: Parsed = { structure, names, text };
  for (const [file, items] of Object.entries(structure)) {
    checkDuplicates(`structure/${file}`, items, errors);
  }
  for (const [file, items] of Object.entries(names))
    checkDuplicates(`names/${file}`, items, errors);
  for (const [file, items] of Object.entries(text)) checkDuplicates(`text/${file}`, items, errors);
  checkReferences(structure, errors);
  checkAllParity(parsed, errors);
  checkStructureIsOpaque(raw, parsed, errors);
  checkFixtureCoverage(raw.fixtureFactIds, structure.facts, warnings);

  return { errors, warnings };
};
