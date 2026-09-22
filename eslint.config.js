import { base, pure, renderer, untyped } from "@hearthian/config/eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/out/**",
    "**/.turbo/**",
    "fixtures/private/**",
  ]),
  base,
  { files: ["packages/core/src/**"], ...pure },
  { files: ["apps/desktop/src/renderer/**"], ...renderer },
  { files: ["**/*.js", "**/*.config.ts"], ...untyped },
);
