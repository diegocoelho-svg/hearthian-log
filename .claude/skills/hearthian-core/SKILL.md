---
name: hearthian-core
description: Como escrever código em packages/core, save-io e steam do Hearthian Log — parser do save, SaveSnapshot, diff, progress engine, projeção de spoiler, política de toast, watcher e locator. Use ao tocar qualquer lógica que não seja janela ou UI.
---

# Hearthian Log — Core

Ler antes: `specs/domain/arquitetura.md`, `specs/domain/save-model.md`, `specs/domain/spoiler.md`.

## Regra de ouro

`packages/core` **não importa Node, Electron, `fs`, `path`, `os`**. Só `zod` e os próprios tipos.
Recebe string ou objeto, devolve objeto. Se você precisou de `readFile`, está no pacote errado:
vá para `packages/save-io`.

## O que mora em cada pacote

```
core/src/
├── save/         parseSave, SaveSnapshot, FactState, SaveParseError, diffSnapshots, SaveEvent
├── progress/     computeProgress, Progress, LocationProgress, CuriosityProgress
├── spoiler/      SpoilerLevel, projectView, projectToast, projectAchievements
├── achievements/ AchievementSource (interface), AchievementState, reachability, suggestedOrder
├── content/      LoadedContent (tipos do que core aceita como conteúdo), ContentSchemaVersion
└── ids.ts        FactId, EntryId, LocationId, CuriosityId, SignalId, FrequencyId, AchievementId

save-io/src/
├── locator/      findSaveCandidates, pickSave, storePaths
└── watcher/      watchSave, WatchOptions, hashFile

steam/src/
├── SteamworksAchievementSource.ts
└── NullAchievementSource.ts
```

## Convenções

- **Ids são branded types**, não `string`. `FactId` não se mistura com `EntryId`.
- **Tudo `readonly`.** Snapshot, Progress e View são imutáveis. Diff cria novo, não muta.
- **Funções puras com nome de verbo:** `parseSave`, `diffSnapshots`, `computeProgress`,
  `projectView`. Sem classe onde uma função basta.
- **Erro tipado, não `throw new Error('...')`.** `SaveParseError` com `kind` discriminado.
- **Resultado parcial é sucesso.** Parser devolve snapshot com `warnings`, não falha por
  campo secundário.
- **Zod `.passthrough()`** em todo objeto do save. Campo desconhecido é preservado.
- **Primeira leitura não gera evento.** `diffSnapshots(null, next)` devolve `[]`.

## Projeção — o código mais sensível do repo

```ts
projectView(progress, content, level): DashboardView
```

- Uma função por nível, chamada por um `switch` exaustivo. Sem `if (level >= ...)`.
- A `View` de cada nível é um tipo distinto do `contracts`. Se você adicionou um campo com
  conteúdo e o TypeScript não reclamou de algum nível, a união está errada.
- `content.text` chega como `undefined` fora do nível `full`. A função do nível `none` recebe
  um `LoadedContent` que **não tem** `text` no tipo, não um que tem e ignora.
- Teste obrigatório por nível: serializa a `View`, procura toda string de `names` e `text` da
  fixture de conteúdo, falha se achar uma que o nível não permite.

## Watcher (`save-io`)

- `chokidar` com `awaitWriteFinish: { stabilityThreshold, pollInterval }`, valores no
  `WatchOptions` com default conservador.
- Lê o arquivo, calcula hash, **ignora se igual ao último**. O jogo reescreve sem mudar.
- Parse falhou com `partial-write`: agenda nova tentativa. Depois de N, emite `error` e segue
  observando.
- Emite `{ kind: 'snapshot', snapshot }` ou `{ kind: 'error', error }`. Nunca lança para fora
  do listener.
- Teste com `fs.mkdtemp`, escrevendo o arquivo em duas etapas para simular escrita parcial.

## Locator (`save-io`)

- Enumera `SteamSaves/*/data.owsave` e `EpicSaves/*/data.owsave`. Escolhe o `mtime` mais
  recente. Caminho manual vence sempre.
- **Nunca loga o caminho completo** com o nome do perfil. Loja + `mtime` bastam.

## Nunca

- Importar Electron ou Node em `core`
- `name?: string` numa `View`
- Escrever no save
- Comentário no código
