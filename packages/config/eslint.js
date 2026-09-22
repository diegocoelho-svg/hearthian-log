import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { builtinModules } from "node:module";
import tseslint from "typescript-eslint";

const restrictImports = (group, message) => ({
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  },
});

export const base = defineConfig(
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  prettier,
);

export const pure = restrictImports(
  [...builtinModules, "node:*", "electron", "electron/*"],
  "packages/core is platform-free: move this to save-io or desktop/main",
);

export const renderer = restrictImports(
  [
    "@hearthian/content",
    "@hearthian/content/*",
    "@hearthian/core",
    "@hearthian/core/*",
    "@hearthian/save-io",
    "@hearthian/save-io/*",
    "@hearthian/steam",
    "@hearthian/steam/*",
  ],
  "the renderer only receives projections through @hearthian/contracts",
);

export const untyped = {
  ...tseslint.configs.disableTypeChecked,
  languageOptions: {
    ...tseslint.configs.disableTypeChecked.languageOptions,
    globals: globals.node,
  },
};
