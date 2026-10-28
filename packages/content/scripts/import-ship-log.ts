import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { importShipLog } from "../src/import/shipLog.ts";

const elementsIn = (bytes: Buffer, name: string): string[] => {
  const open = Buffer.from(`<${name}`);
  const close = Buffer.from(`</${name}>`);
  const found: string[] = [];
  for (let start = bytes.indexOf(open); start !== -1; start = bytes.indexOf(open, start + 1)) {
    const end = bytes.indexOf(close, start);
    if (end === -1) throw new Error(`unterminated <${name}> at byte ${start}`);
    found.push(bytes.subarray(start, end + close.length).toString("utf8"));
  }
  return found;
};

const { values } = parseArgs({ options: { game: { type: "string" } } });
if (values.game === undefined) {
  console.error(
    'usage: pnpm --filter @hearthian/content import:ship-log --game "<Outer Wilds folder>"',
  );
  process.exit(1);
}

const gameData = join(values.game, "OuterWilds_Data");
const supplementPath = fileURLToPath(new URL("./ship-log-supplement.json", import.meta.url));
const dataDir = fileURLToPath(new URL("../data/", import.meta.url));

const result = importShipLog({
  astroObjects: elementsIn(
    readFileSync(join(gameData, "sharedassets1.assets")),
    "AstroObjectEntry",
  ),
  translationTables: elementsIn(
    readFileSync(join(gameData, "resources.assets")),
    "TranslationTable_XML",
  ),
  supplement: JSON.parse(readFileSync(supplementPath, "utf8")) as unknown,
});

const write = (file: string, content: unknown): void => {
  writeFileSync(join(dataDir, file), `${JSON.stringify(content, null, 2)}\n`);
};

for (const [file, content] of Object.entries(result.structure)) {
  write(`structure/${file}.json`, content);
}
for (const [file, content] of Object.entries(result.names)) {
  write(`names/${file}.json`, content);
}

console.log(
  `imported ${result.structure.locations.length} locations, ${result.structure.entries.length} entries, ` +
    `${result.structure.facts.length} facts, ${result.structure.curiosities.length} curiosities, ` +
    `${result.structure.signals.length} signals`,
);
