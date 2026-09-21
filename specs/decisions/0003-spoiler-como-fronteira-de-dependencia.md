# ADR 0003 — Spoiler como fronteira de dependência

**Status:** aceito
**Data:** 2026-09-18

## Contexto

Outer Wilds é um jogo cujo único progresso é conhecimento. Um nome de local, um título de fato
ou um texto que aparece antes da hora estraga o jogo. O briefing coloca isso como restrição
central de design.

A forma óbvia de implementar níveis de spoiler é um `if (level >= X)` na UI. Isso falha de três
jeitos conhecidos: o dado está no DOM escondido, o dado está no estado do React, o dado está no
bundle. Qualquer DevTools revela. E um dia alguém esquece o `if`.

## Decisão

O nível de spoiler é aplicado **no processo main, antes do IPC**, por uma função pura
`projectView` em `packages/core`. O renderer recebe uma `View` que **só contém o que o nível
permite** e não tem como pedir mais sem passar por confirmação no main.

Isso é garantido por:

1. **Dependência.** `apps/desktop/src/renderer` não depende de `@hearthian/content`. Só de
   `@hearthian/contracts`.
2. **Tipos.** As `View`s não têm campo opcional carregando conteúdo. `LocationView` no nível
   `none` e no nível `locations` são tipos distintos, unidos por discriminante.
3. **Entradas separadas do conteúdo.** `content/structure`, `content/names`, `content/text`.
   `text` é importado dinamicamente e só no nível `full` ou por opt-in.
4. **Lint.** `no-restricted-imports` em `src/renderer/**` para `@hearthian/content`, `@hearthian/core`.
5. **Teste.** Um teste por nível em `projectView` que falha se qualquer string de `names` ou
   `text` aparecer numa `View` que não a permite. E um teste de build que procura uma string
   sentinela do pacote `content` no bundle do renderer.

## Consequências

- Subir de nível é uma round-trip: renderer pede, main confirma com o usuário, main reenvia a
  `View`. Um pouco mais lento; é o comportamento desejado.
- O renderer é "burro": renderiza o que recebe. Toda decisão de exposição está em `core` e é
  testável sem UI.
- Adicionar um campo novo a uma `View` obriga a decidir em que nível ele aparece. Não existe
  "depois eu filtro".
- Mais tipos. É o preço de não vazar.

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Filtro na UI (`if level`) | Dado presente no renderer; DevTools revela; fácil esquecer |
| Um pacote `content` só, filtrado em runtime | O bundle do main carregaria texto sempre; e nada impede o renderer de importar |
| Criptografar o conteúdo | Complexidade sem ganho: a chave estaria no mesmo binário |
