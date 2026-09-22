export type SaveParseErrorKind = "invalid-json" | "unsupported-shape" | "partial-write";

export type SaveParseError = {
  readonly kind: SaveParseErrorKind;
  readonly message: string;
};
