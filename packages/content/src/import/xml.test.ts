import { describe, expect, it } from "vitest";
import { childrenNamed, optionalChild, parseXml, requiredChild, textOf } from "./xml.ts";

describe("parseXml", () => {
  it("builds nested elements with their text", () => {
    const root = parseXml("<Rock><ID> ROCK </ID><Entry><ID>ROCK_CAVE</ID></Entry></Rock>");
    expect(root.name).toBe("Rock");
    expect(textOf(requiredChild(root, "ID"))).toBe("ROCK");
    expect(textOf(requiredChild(requiredChild(root, "Entry"), "ID"))).toBe("ROCK_CAVE");
  });

  it("drops comments, so commented-out elements do not exist", () => {
    const root = parseXml(
      "<Rock><!-- <Fact><ID>GONE</ID></Fact> --><Fact><ID>KEPT</ID></Fact></Rock>",
    );
    expect(childrenNamed(root, "Fact").map((fact) => textOf(requiredChild(fact, "ID")))).toEqual([
      "KEPT",
    ]);
  });

  it("skips the declaration and attributes and keeps self-closing tags as empty children", () => {
    const root = parseXml('<?xml version="1.0"?>\n<Table xmlns:x="urn:x"><Flag/></Table>');
    expect(root.children).toEqual([{ name: "Flag", children: [], text: "" }]);
  });

  it("decodes the standard entities", () => {
    expect(textOf(parseXml("<Name>Rock &amp; Roll &lt;3</Name>"))).toBe("Rock & Roll <3");
  });

  it("rejects unknown entities instead of keeping them raw", () => {
    expect(() => parseXml("<Name>&nbsp;</Name>")).toThrow("unsupported XML entity &nbsp;");
  });

  it("rejects mismatched and unclosed tags", () => {
    expect(() => parseXml("<A><B></A>")).toThrow("unexpected </A>");
    expect(() => parseXml("<A><B></B>")).toThrow("unclosed <A>");
  });

  it("rejects CDATA and other markup it does not understand", () => {
    expect(() => parseXml("<A><![CDATA[x]]></A>")).toThrow("unsupported XML markup");
  });
});

describe("child lookups", () => {
  const root = parseXml("<A><B>1</B><B>2</B><C>3</C></A>");

  it("requires exactly one child for requiredChild", () => {
    expect(() => requiredChild(root, "B")).toThrow("<A> must have exactly one <B>");
    expect(() => requiredChild(root, "D")).toThrow("<A> must have exactly one <D>");
  });

  it("returns null for a missing optional child and rejects duplicates", () => {
    expect(optionalChild(root, "D")).toBeNull();
    expect(() => optionalChild(root, "B")).toThrow("<A> has more than one <B>");
  });
});
