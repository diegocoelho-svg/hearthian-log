# ADR 0002 — pnpm workspace com `core` puro

**Status:** aceito
**Data:** 2026-09-18

## Contexto

A lógica que importa (parser do save, diff, progresso, projeção de spoiler) não depende de
Electron nem de Node. Se ela mora dentro do app Electron, testar exige subir Electron ou mockar
`fs`, e a fronteira de spoiler fica só em convenção de pasta.

O briefing pede explicitamente "file watcher, parser e diff de forma testável" e "não carregar
textos no renderer se o nível não permitir". As duas exigências são de fronteira de dependência.

## Decisão

Usaremos um **pnpm workspace** com Turborepo:

```
apps/desktop         Electron
packages/core        domínio puro — importa só zod
packages/content     dados estáticos + schemas + validate
packages/contracts   IPC e schemas das projeções
packages/save-io     locator + watcher, Node sem Electron
packages/steam       AchievementSource
packages/config      tsconfig, eslint, vitest base
```

Regra de dependência em [arquitetura.md](../domain/arquitetura.md). `packages/core` **não importa
Node, Electron, `fs` nem `path`**. Recebe strings e objetos, devolve objetos.

## Consequências

- Mais `package.json` e mais indireção. Custo aceito.
- `core` roda em Vitest puro em milissegundos, sem mock de plataforma.
- A fronteira renderer ✗ content é uma dependência ausente, não uma convenção. Dá para
  verificar por lint e por teste de bundle.
- Dependência de app instala no app: `pnpm --filter desktop add x`. Na raiz só ferramenta de repo.
- `pnpm`, nunca `npm`: `npm install` cria `package-lock.json` e quebra o workspace.

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Pacote único com `src/core`, `src/main`, `src/renderer` | Fronteira só por pasta; lint de import é a única proteção; teste de `core` arrasta config do Electron |
| Repositórios separados | Overhead de versionamento para um projeto de uma pessoa |
