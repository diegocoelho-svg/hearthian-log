import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { rawNames } from "../src/raw/names.ts";
import { rawStructure } from "../src/raw/structure.ts";
import { rawText } from "../src/raw/text.ts";
import { rawVersion } from "../src/raw/version.ts";
import { validateContent } from "../src/validate.ts";

const fixturesDir = fileURLToPath(new URL("../../core/fixtures/", import.meta.url));

const readFixtureFactIds = (): string[] =>
  readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".owsave.json"))
    .flatMap((file) => {
      const save = JSON.parse(readFileSync(join(fixturesDir, file), "utf8")) as {
        shipLogFactSaves?: Record<string, unknown>;
      };
      return Object.keys(save.shipLogFactSaves ?? {});
    });

const report = validateContent({
  version: rawVersion,
  structure: rawStructure,
  names: rawNames,
  text: rawText,
  fixtureFactIds: readFixtureFactIds(),
});

for (const warning of report.warnings) console.warn(`warning: ${warning}`);
for (const error of report.errors) console.error(`error: ${error}`);

if (report.errors.length > 0) {
  console.error(`content invalid: ${report.errors.length} error(s)`);
  process.exitCode = 1;
} else {
  console.log(`content valid, ${report.warnings.length} warning(s)`);
}
