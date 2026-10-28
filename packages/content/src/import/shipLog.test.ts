import { describe, expect, it } from "vitest";
import { importShipLog, type ShipLogSources } from "./shipLog.ts";

const rock = `
<AstroObjectEntry>
  <ID>ROCK</ID>
  <Entry>
    <ID>ROCK_CAVE</ID>
    <Name>Cave</Name>
    <Curiosity>GLOW</Curiosity>
    <IsCuriosity/>
    <ExploreFact>
      <IgnoreMoreToExplore/>
      <ID>ROCK_CAVE_X1</ID>
      <Text>Synthetic.</Text>
    </ExploreFact>
    <RumorFact>
      <RumorName>Rumor</RumorName>
      <ID>ROCK_CAVE_R1</ID>
      <SourceID>MOSS_POND</SourceID>
      <Text>Synthetic.</Text>
    </RumorFact>
    <Entry>
      <ID>ROCK_CAVE_POOL</ID>
      <Name>Pool</Name>
      <ExploreFact><ID>ROCK_CAVE_POOL_X1</ID><Text>Synthetic.</Text></ExploreFact>
    </Entry>
  </Entry>
<!--
  <Entry><ID>ROCK_CUT</ID><Name>Cut</Name></Entry>
-->
</AstroObjectEntry>`;

const moss = `
<AstroObjectEntry>
  <ID>MOSS</ID>
  <Entry>
    <ID>MOSS_POND</ID>
    <Name>Pond</Name>
    <Curiosity>GLOW</Curiosity>
    <ExploreFact><ID>MOSS_POND_X1</ID><Text>Synthetic.</Text></ExploreFact>
  </Entry>
</AstroObjectEntry>`;

const translationTable = (glowName: string, uiTexts: Record<string, string>): string => `
<TranslationTable_XML>
  <table_shipLog>
    <TranslationTableEntry><key>Cave</key><value>${glowName}</value></TranslationTableEntry>
  </table_shipLog>
  <table_ui>
    ${Object.entries(uiTexts)
      .map(
        ([key, value]) =>
          `<TranslationTableEntryUI><key>${key}</key><value>${value}</value></TranslationTableEntryUI>`,
      )
      .join("")}
  </table_ui>
</TranslationTable_XML>`;

const supplement = {
  locations: [
    { id: "MOSS", kind: "moon", parentId: "ROCK", uiTextKey: "2" },
    { id: "ROCK", kind: "planet", parentId: null, uiTextKey: "1" },
  ],
  curiosities: [{ id: "GLOW", color: "#336699" }],
  signals: [{ id: "10", frequencyIndex: 1, locationId: "ROCK" }],
};

const sources: ShipLogSources = {
  astroObjects: [rock, moss],
  translationTables: [
    translationTable("Grotte", { "1": "Felsen", "2": "Moos" }),
    translationTable("Cave", { "1": "The Rock", "2": "Moss Moon" }),
  ],
  supplement,
};

describe("importShipLog", () => {
  const result = importShipLog(sources);

  it("orders locations and their entries by the supplement, not by the asset", () => {
    expect(result.structure.locations).toEqual([
      { id: "MOSS", kind: "moon", parentId: "ROCK" },
      { id: "ROCK", kind: "planet", parentId: null },
    ]);
    expect(result.structure.entries.map((entry) => entry.id)).toEqual([
      "MOSS_POND",
      "ROCK_CAVE",
      "ROCK_CAVE_POOL",
    ]);
  });

  it("keeps entry nesting and leaves entries without a curiosity as null", () => {
    expect(result.structure.entries).toContainEqual({
      id: "ROCK_CAVE_POOL",
      locationId: "ROCK",
      curiosityId: null,
      parentEntryId: "ROCK_CAVE",
    });
  });

  it("assigns every fact to the entry that contains it, rumors included", () => {
    expect(result.structure.facts).toEqual([
      { id: "MOSS_POND_X1", entryId: "MOSS_POND", kind: "explore", targets: [] },
      { id: "ROCK_CAVE_X1", entryId: "ROCK_CAVE", kind: "explore", targets: [] },
      { id: "ROCK_CAVE_R1", entryId: "ROCK_CAVE", kind: "rumor", targets: [] },
      { id: "ROCK_CAVE_POOL_X1", entryId: "ROCK_CAVE_POOL", kind: "explore", targets: [] },
    ]);
  });

  it("ignores commented-out entries", () => {
    expect(result.structure.entries.map((entry) => entry.id)).not.toContain("ROCK_CUT");
  });

  it("names curiosities after the entry marked IsCuriosity", () => {
    expect(result.names.curiosities).toEqual([{ id: "GLOW", name: "Cave" }]);
  });

  it("names locations from the English UI table", () => {
    expect(result.names.locations).toEqual([
      { id: "MOSS", name: "Moss Moon" },
      { id: "ROCK", name: "The Rock" },
    ]);
  });

  it("copies signals from the supplement", () => {
    expect(result.structure.signals).toEqual(supplement.signals);
  });

  it("fails on a tag it does not know, so nothing is dropped silently", () => {
    const withUnknown = rock.replace("<IsCuriosity/>", "<IsCuriosity/><Secret>1</Secret>");
    expect(() => importShipLog({ ...sources, astroObjects: [withUnknown, moss] })).toThrow(
      "unknown <Secret> inside <Entry>",
    );
  });

  it("fails when the supplement and the game disagree on locations", () => {
    expect(() => importShipLog({ ...sources, astroObjects: [rock] })).toThrow(
      "supplement locations: missing [], unexpected [MOSS]",
    );
  });

  it("fails when a curiosity in the game has no color in the supplement", () => {
    expect(() =>
      importShipLog({ ...sources, supplement: { ...supplement, curiosities: [] } }),
    ).toThrow("supplement curiosities: missing [GLOW], unexpected []");
  });

  it("fails unless exactly one translation table is English", () => {
    expect(() =>
      importShipLog({ ...sources, translationTables: [sources.translationTables[0] ?? ""] }),
    ).toThrow("expected one English translation table, found 0");
  });

  it("fails when a location has no UI text", () => {
    const missingKey = {
      ...supplement,
      locations: [supplement.locations[0], { ...supplement.locations[1], uiTextKey: "9" }],
    };
    expect(() => importShipLog({ ...sources, supplement: missingKey })).toThrow(
      "no UI text 9 for ROCK",
    );
  });
});
