import achievements from "../../data/text/achievements.json";
import facts from "../../data/text/facts.json";
import type { TextFile } from "../schemas/text.ts";

export const rawText: Record<TextFile, unknown> = { facts, achievements };
