# ADR 0006 — Conteúdo como dado versionado

**Status:** aceito
**Data:** 2026-09-18

## Contexto

O app precisa de duas tabelas grandes que não são código: o mapa `FACT_ID → local, curiosidade,
título, texto, arestas` (extraído do jogo pela comunidade) e o conteúdo autoral do guia de 100%
(dicas em camadas por conquista, fatos relacionados, pré-requisitos).

As duas mudam por motivos diferentes do código: nova versão do jogo, dica reescrita, erro de
mapeamento. E as duas contêm texto que **não pode** ir para o renderer.

## Decisão

Conteúdo vive em **`packages/content` como JSON**, validado por schemas Zod, com três entradas
públicas (`structure`, `names`, `text`) e um `version.json` com `schemaVersion`, `gameVersion`
e `contentRevision`.

`pnpm --filter content validate` roda no CI e checa schema, integridade referencial, paridade
de ids entre as três entradas, e ausência de string legível em `structure`.

Fonte de cada arquivo registrada em `packages/content/SOURCES.md`.

## Consequências

- Corrigir uma dica não toca em código nem em teste de `core`. Sobe `contentRevision`.
- Nova versão do jogo com fatos novos: novo dump, `gameVersion` sobe, `unknownFactIds` do
  parser mostra o que falta.
- O `core` recusa `schemaVersion` que não conhece e degrada para "só contagens brutas".
- JSON grande no repo. Aceito; é dado público do jogo e conteúdo próprio.
- Texto do jogo dentro do repo. O README avisa que o repositório contém spoilers em
  `packages/content/data/text/` e `names/`.

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Conteúdo em TypeScript (`const facts = [...]`) | Mistura dado com código; tree-shaking não garante que `text` sai do bundle |
| Baixar conteúdo em runtime | Dependência de rede num app offline; sem ganho |
| SQLite embutido | Módulo nativo para dado estático; JSON basta |
