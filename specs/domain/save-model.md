---
tags: [hearthian-log, save]
---

# Modelo do Save

Confirmado contra três saves reais em 2026-09-21: dois da versão `1.1.15.1018` (2024) e um da
`1.1.16.1372` (2025), todos com o DLC. Tudo o que está marcado como **a confirmar** ainda não
foi visto.

## Onde fica

```
%USERPROFILE%\AppData\LocalLow\Mobius Digital\Outer Wilds\
└── SteamSaves\
    ├── steam_autocloud.vdf
    ├── <perfil>.owprofile          JSON: profileName, lastModifiedTime, brokenSaveData…
    └── <perfil>\
        ├── data.owsave             ← o save
        ├── player.owsett           configurações
        └── input.owsett            rebinds (só existe se o jogador mudou algo)
```

| Loja | Raiz |
|---|---|
| Steam | `…\Outer Wilds\SteamSaves\` |
| Epic | `…\Outer Wilds\EpicSaves\` — **a confirmar**, por analogia |
| Manual | Qualquer `data.owsave` escolhido no settings |

A subpasta **não é o SteamID**: é o nome do **perfil do jogo**, escolhido pelo jogador na tela
inicial. Um jogador pode ter vários perfis, e pode haver pastas vazias (perfil criado e nunca
salvo). O jogo mantém um `<perfil>.owprofile` ao lado com `lastModifiedTime` (ISO 8601) e
flags `broken*Data`.

O locator lista todo `<raiz>/<perfil>/data.owsave` existente e escolhe o de `mtime` mais
recente. O caminho manual sempre vence. O nome do perfil é escolhido pelo jogador e pode ser o
nick da Steam: pode aparecer na UI como rótulo ("perfil: …"), mas **nunca em log, fixture ou
commit**.

## Formato

JSON do Unity `JsonUtility`, num único objeto de topo com 18 campos nas duas versões vistas.
Dicionários vêm como **objetos JSON comuns** (`{ "chave": valor }`), não como arrays
paralelos. O parser continua tolerante a `keys[]/values[]` só por precaução com versões
antigas, mas não há evidência de que isso exista.

### Campos que o app usa

| Campo | Tipo | O que é |
|---|---|---|
| `version` | `string` | Versão do jogo que gravou, ex. `1.1.16.1372` |
| `loopCount` | `number` | Loops iniciados (inclui mortes) |
| `fullTimeloops` | `number` | Loops que chegaram à supernova |
| `shipLogFactSaves` | `Record<FactId, FactSave>` | **Todos** os fatos do jogo, revelados ou não |
| `newlyRevealedFactIDs` | `FactId[]` | Redundante com `FactSave.newlyRevealed`; ignorar |
| `knownFrequencies` | `boolean[7]` | Índice = enum de frequência do jogo |
| `knownSignals` | `Record<string, boolean>` | Chave = enum de sinal como string numérica; `false` existe |
| `dictConditions` | `Record<string, boolean>` | Flags de evento; `false` existe |
| `lastDeathType` | `number` | Enum de causa da última morte |
| `burnedMarshmallowEaten` | `number` | Contador |
| `perfectMarshmallowsEaten` | `number` | Contador |
| `warpedToTheEye` | `boolean` | Flag de final |

### Campos ignorados

`secondsRemainingOnWarp`, `loopCountOnParadox`, `shownPopups`, `ps5Activity_*`,
`didRunInitGammaSetting`. Preservados pelo objeto tolerante do Zod (`.loose()`), nunca lidos.

### `FactSave`

```json
"BH_EXAMPLE_X1": { "id": "BH_EXAMPLE_X1", "revealOrder": 130, "read": true, "newlyRevealed": false }
```

- A chave é sempre igual a `id`.
- **O save lista todos os fatos do jogo**, inclusive os não revelados (374 na `1.1.15`, 375 na
  `1.1.16`; um save de 3 loops já tem 374 entradas). Presença da chave **não** significa
  revelado.
- **Revelado ⇔ `revealOrder >= 0`.** Não revelado tem `revealOrder: -1`.
- `revealOrder` é a ordem de descoberta. Fatos revelados juntos no mesmo evento compartilham o
  valor — é uma ordem por lote, não um índice único.
- `read` pode ser `true` em fato não revelado (visto em 4 e 11 fatos). Só faz sentido quando
  `revealed`; o snapshot normaliza `read = revealed && read`.
- `newlyRevealed` é o "novo" que o jogo mostra no Ship Log. Bate exatamente com
  `newlyRevealedFactIDs`.
- O prefixo do `id` (`BH_`, `TH_`, `DB_`, `IP_`…) corresponde ao local. Isso é conveniência
  para validar a tabela de conteúdo, não fonte de verdade: o mapeamento fato → local vem de
  `@hearthian/content`.

Como o save lista todos os fatos, o **denominador do progresso vem do próprio save**, não da
tabela de conteúdo. A tabela serve para nome, local, curiosidade e texto. Isso também significa
que todo `FactId` do jogo passa pelo parser em qualquer save — a fronteira de spoiler do
[ADR 0003](../decisions/0003-spoiler-como-fronteira-de-dependencia.md) vale desde a primeira
leitura.

### Sinais e frequências

- `knownFrequencies[i]` é `true` quando a frequência de índice `i` foi sintonizada. O nome de
  cada índice vem da tabela de conteúdo.
- `knownSignals` tem chave para sinais que o jogo já registrou, com valor `true` ou `false`.
  **Conhecido ⇔ valor `true`.** Chaves vistas: `10–16`, `20–25`, `30–32`, `40–49`, `60–62`,
  `100–101`. A dezena parece agrupar por frequência; a tabela de conteúdo é quem mapeia.

### `dictConditions`

Flags de evento nomeadas pelo jogo, misturando tutorial (`HAS_USED_JETPACK`), história
(`MET_SOLANUM`) e mecânica (`KNOWS_MEDITATION`). Valor `false` existe e significa "já foi
`true` e voltou" ou "registrado mas não atingido". **Ativa ⇔ valor `true`.**

Vários nomes coincidem com condições de conquistas Steam. Isso permite inferir parte do
checklist de 100% sem Steam, como o [ADR 0005](../decisions/0005-steam-opcional.md) prevê.
O mapeamento flag → conquista fica em `@hearthian/content`, e é sempre "provável", nunca
"confirmado", até o Steamworks dizer.

## O que o parser produz

```ts
type SaveSnapshot = {
  readonly schema: 'unknown' | 'v1'
  readonly gameVersion: string | null
  readonly capturedAt: number
  readonly contentHash: string
  readonly loopCount: number
  readonly fullLoops: number
  readonly facts: ReadonlyMap<FactId, FactState>
  readonly frequencies: ReadonlySet<FrequencyIndex>
  readonly signals: ReadonlySet<SignalId>
  readonly flags: ReadonlyMap<string, boolean>
  readonly counters: ReadonlyMap<CounterKey, number>
  readonly unknownFactIds: readonly FactId[]
  readonly warnings: readonly string[]
}

type FactState = {
  readonly revealed: boolean
  readonly read: boolean
  readonly newlyRevealed: boolean
  readonly revealOrder: number | null
}

type CounterKey = 'burnedMarshmallows' | 'perfectMarshmallows' | 'lastDeathType'
```

- `facts` contém **todos** os fatos do save, revelados ou não. `revealed` é derivado de
  `revealOrder >= 0`; `revealOrder` fica `null` quando não revelado.
- `frequencies` e `signals` só têm os `true`.
- `flags` preserva `true` e `false`; quem consome pergunta `=== true`.
- `unknownFactIds` são IDs presentes no save mas ausentes da tabela de conteúdo. Contam no
  progresso geral, aparecem como "não catalogado" e alimentam a validação do conteúdo.
- `schema: 'v1'` é a forma vista em `1.1.15` e `1.1.16`. Detecção pela forma, não por `version`.

## Estratégia do parser

```ts
parseSave(text: string, options: { contentHash; capturedAt; knownFactIds? }): ParseSaveResult

type ParseSaveResult =
  | { ok: true; snapshot: SaveSnapshot }
  | { ok: false; error: SaveParseError }
```

O `core` não calcula hash nem lê relógio: `contentHash` e `capturedAt` vêm de quem leu o
arquivo (`save-io`, com `node:crypto`). `knownFactIds` é o conjunto de ids da tabela de
conteúdo; ausente, `unknownFactIds` sai vazio.

1. Zod 4 com `z.looseObject` em todo objeto: campo desconhecido é preservado, não derruba
2. Detecção de versão pela **forma** (quais campos existem), não pelo `version` do arquivo
3. Falha tipada: `SaveParseError { kind: 'invalid-json' | 'unsupported-shape' | 'partial-write' }`.
   `partial-write` é JSON inválido cujo texto não termina em `}`; `invalid-json` é o resto
4. `partial-write` é esperado: o watcher tenta de novo depois de `awaitWriteFinish`; só vira
   erro visível depois de N tentativas
5. Sucesso parcial é sucesso: se `facts` parseia mas `signals` não, o snapshot sai com
   `signals` vazio e um item em `warnings`

## Diff

```ts
diffSnapshots(previous: SaveSnapshot | null, next: SaveSnapshot): SaveEvent[]
```

| Evento | Quando |
|---|---|
| `FactRevealed { factId }` | `revealed` passou de false para true |
| `FactRead { factId }` | `read` passou de false para true, com `revealed` true nos dois |
| `SignalLearned { signalId }` | entrou em `signals` |
| `FrequencyLearned { index }` | entrou em `frequencies` |
| `LoopStarted { from, to }` | `loopCount` aumentou |
| `LoopCompleted { from, to }` | `fullLoops` aumentou |
| `FlagRaised { key }` | flag passou a `true` |
| `SaveReset` | `loopCount` diminuiu ou fatos revelados sumiram — jogador começou de novo |

`previous === null` (primeira leitura) não gera eventos: não notificamos o passado.
`SaveReset` sai sozinho: quando o save recomeçou, o resto da comparação é contra um passado
que não existe mais. `FactRevealed` vem em ordem de `revealOrder`.

## O que ainda não foi confirmado

- **Quando o jogo grava.** Hipótese: ao revelar fato, ao morrer/fim de loop e ao sair para o
  menu. Verificar com um watcher durante uma sessão antes da Fase 1 — se só gravar no fim do
  loop, toast e overlay perdem quase todo o valor.
- Caminho da versão Epic.
- Se `read = true` em fato não revelado tem algum significado ou é resíduo.
- Se `brokenSaveData: true` no `.owprofile` corresponde a `data.owsave` corrompido — se sim, o
  locator pode usar como sinal de degradação.

## Fixtures

`packages/core/fixtures/`, derivadas de um save real da `1.1.16.1372` e anonimizadas: sem nome
de perfil, sem caminho real, contadores e `revealOrder` gerados do zero para não reproduzir um
save de verdade. Os 375 `FactId`s e as chaves de `dictConditions` são dados do jogo e ficam
como estão — o denominador do progresso depende disso.

- `empty.owsave.json` — jogo novo sintético: todos os fatos com `revealOrder: -1`, `loopCount: 1`,
  só a frequência de índice 0 conhecida, `knownSignals` e `dictConditions` vazios. Não veio de
  um save de jogo novo real; se um aparecer, substitui este
- `early.owsave.json` — 4 loops, 3 locais visitados (`TH_`, `TM_` e um terço dos `BH_`), 45
  fatos revelados com `revealOrder` por lote, 2 `newlyRevealed`, 1 fato não revelado com
  `read: true` para exercitar a normalização, sinais e flags com `true` e `false`
- `partial-write.owsave.txt` — `early` truncado no meio de um fato; é `.txt` porque não parseia
- `unknown-shape.owsave.json` — JSON válido sem nenhum dos campos esperados

O script que gera as duas primeiras a partir de `fixtures/private/` não é versionado. Saves
reais ficam em `fixtures/private/`, ignorado pelo git.
