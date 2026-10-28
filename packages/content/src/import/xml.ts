export type XmlElement = {
  readonly name: string;
  readonly children: readonly XmlElement[];
  readonly text: string;
};

type MutableElement = { name: string; children: MutableElement[]; text: string };

const entities: Readonly<Record<string, string>> = {
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
};

const decode = (raw: string): string =>
  raw.replace(/&[a-z]+;/g, (entity) => {
    const char = entities[entity];
    if (char === undefined) throw new Error(`unsupported XML entity ${entity}`);
    return char;
  });

const tagPattern = /^<(\/?)([A-Za-z_][\w.-]*)(?:\s[^>]*?)?(\/?)>/;

const skipMarkup = (source: string, at: number): number | null => {
  const markers: readonly [string, string][] = [
    ["<!--", "-->"],
    ["<?", "?>"],
  ];
  for (const [open, close] of markers) {
    if (!source.startsWith(open, at)) continue;
    const end = source.indexOf(close, at);
    if (end === -1) throw new Error(`unterminated ${open} at ${at}`);
    return end + close.length;
  }
  if (source.startsWith("<!", at)) throw new Error(`unsupported XML markup at ${at}`);
  return null;
};

type Tag = { length: number; name: string; closing: boolean; selfClosing: boolean };

const readTag = (source: string, at: number): Tag => {
  const match = tagPattern.exec(source.slice(at, at + 512));
  const name = match?.[2];
  if (match === null || name === undefined) throw new Error(`malformed tag at ${at}`);
  return {
    length: match[0].length,
    name,
    closing: match[1] === "/",
    selfClosing: match[3] === "/",
  };
};

const top = (stack: readonly MutableElement[]): MutableElement => {
  const element = stack.at(-1);
  if (element === undefined) throw new Error("closing tag without an open element");
  return element;
};

export const parseXml = (source: string): XmlElement => {
  const root: MutableElement = { name: "", children: [], text: "" };
  const stack: MutableElement[] = [root];
  let at = 0;
  while (at < source.length) {
    const next = source.indexOf("<", at);
    const current = top(stack);
    if (next === -1) {
      current.text += decode(source.slice(at));
      break;
    }
    current.text += decode(source.slice(at, next));
    const skipped = skipMarkup(source, next);
    if (skipped !== null) {
      at = skipped;
      continue;
    }
    const tag = readTag(source, next);
    at = next + tag.length;
    if (tag.closing) {
      if (current.name !== tag.name) throw new Error(`unexpected </${tag.name}> at ${next}`);
      stack.pop();
      continue;
    }
    const element: MutableElement = { name: tag.name, children: [], text: "" };
    current.children.push(element);
    if (!tag.selfClosing) stack.push(element);
  }
  if (stack.length !== 1) throw new Error(`unclosed <${top(stack).name}>`);
  const [document, ...rest] = root.children;
  if (document === undefined || rest.length > 0) throw new Error("expected one root element");
  return document;
};

export const textOf = (element: XmlElement): string => element.text.trim();

export const childrenNamed = (element: XmlElement, name: string): readonly XmlElement[] =>
  element.children.filter((child) => child.name === name);

export const requiredChild = (element: XmlElement, name: string): XmlElement => {
  const [child, ...rest] = childrenNamed(element, name);
  if (child === undefined || rest.length > 0) {
    throw new Error(`<${element.name}> must have exactly one <${name}>`);
  }
  return child;
};

export const optionalChild = (element: XmlElement, name: string): XmlElement | null => {
  const [child, ...rest] = childrenNamed(element, name);
  if (rest.length > 0) throw new Error(`<${element.name}> has more than one <${name}>`);
  return child ?? null;
};
