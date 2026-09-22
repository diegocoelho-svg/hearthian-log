---
tags: [hearthian-log, arquitetura]
---

# Arquitetura

Stack: **Electron + TypeScript**, React no renderer, Vite via `electron-vite`, Vitest, pnpm
workspace com Turborepo. Ver [ADR 0001](../decisions/0001-electron-typescript.md) e
[ADR 0002](../decisions/0002-pnpm-workspace-core-puro.md).

## Pacotes

```
apps/
└── desktop/            Electron
    ├── src/main/       processo principal: pipeline do save, janelas, tray, IPC, servidor OBS
    ├── src/preload/    contextBridge estreito, um por tipo de janela
    └── src/renderer/   React: dashboard/, overlay/, toast/ — recebe só projeções
packages/
├── core/               domínio puro: SaveSnapshot, parser, diff, progress, spoiler projection
├── content/            tabelas estáticas + schemas Zod + script validate
├── contracts/          canais IPC, schemas das projeções e do settings
├── save-io/            locator + watcher (Node, sem Electron)
├── steam/              AchievementSource: steamworks.js e Null
└── config/             tsconfig, eslint, vitest base
```

Escopo npm: `@hearthian/*`.

## Quem pode importar quem

```
core        → zod                              (nada de Node, Electron, fs, path)
content     → core (tipos e ids)
contracts   → core (tipos), zod
save-io     → core, Node
steam       → core, steamworks.js
desktop/main     → tudo
desktop/preload  → contracts
desktop/renderer → contracts                    ✗ content  ✗ core  ✗ save-io  ✗ steam
```

A última linha é a regra que protege o produto. Ver [ADR 0003](../decisions/0003-spoiler-como-fronteira-de-dependencia.md)
e [spoiler.md](./spoiler.md). É garantida em três camadas:

1. `package.json` do renderer não declara `@hearthian/content`
2. `eslint` `no-restricted-imports` no `src/renderer/`
3. Teste de build que falha se uma string sentinela de `content` aparecer no bundle do renderer

## O pipeline do save

```
SaveLocator ──► SaveWatcher ──► readFile ──► hash ──► parseSave ──► SaveSnapshot
                                                                        │
                                                       previous ◄───────┤
                                                          │             ▼
                                                          └──► diffSnapshots ──► SaveEvent[]
                                                                                    │
                        ┌───────────────────────────────────────────────────────────┤
                        ▼                                ▼                          ▼
                 ProgressEngine                    ToastPolicy               HistoryStore (fase 5)
                        │                                │
                        ▼                                ▼
          projectView(progress, content, level)    projectToast(event, level)
                        │                                │
                        ▼                                ▼
            webContents.send('view:update')      ToastWindow.enqueue
```

| Etapa | Pacote | Responsabilidade | Testável como |
|---|---|---|---|
| `SaveLocator` | save-io | Candidatos Steam e Epic, caminho manual, escolhe o mais recente | Unit com fs em tmp dir |
| `SaveWatcher` | save-io | `chokidar` com `awaitWriteFinish`, debounce, ignora se hash igual | Unit com escrita em etapas em tmp dir |
| `parseSave` | core | JSON → `SaveSnapshot`; Zod tolerante (`.loose()`); versão por forma; erro tipado | Unit contra fixtures |
| `diffSnapshots` | core | Gera `FactRevealed`, `FactRead`, `SignalLearned`, `LoopCompleted`, `FlagRaised` | Unit puro |
| `ProgressEngine` | core | Contagens por local, curiosidade, geral, não lidos, conquistas "ao alcance" | Unit puro |
| `projectView` | core | Aplica o nível de spoiler e devolve a `View` do contrato | Unit puro — é o teste mais importante do repo |
| `ToastPolicy` | core | Decide se e o que notificar, respeitando o nível | Unit puro |

O `core` recebe strings e objetos, devolve objetos. Quem lê arquivo é `save-io`; quem manda
para janela é `main`.

## Janelas

| Janela | Tipo | Notas |
|---|---|---|
| Dashboard | `BrowserWindow` normal | Fecha para a tray, não encerra o app |
| Overlay | `transparent`, `alwaysOnTop`, `frame: false`, `skipTaskbar`, `setIgnoreMouseEvents(true)` | Posição e opacidade no settings. Modo "arrastar" desliga click-through temporariamente |
| Toast | `frame: false`, pequena, canto da área de trabalho | Fila; uma por vez; auto-fecha. Fallback para `Notification` nativa |
| Tray | `Tray` | Abrir dashboard, alternar overlay, nível de spoiler atual, sair |

Segurança padrão em todas: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
Renderer não tem acesso a `fs`, `path` ou `require`.

## IPC

Canais e payloads definidos em `packages/contracts`, validados com Zod **nos dois lados**.

```
main → renderer    view:update          DashboardView | OverlayView
main → renderer    toast:show           ToastView
renderer → main    settings:get         → Settings
renderer → main    settings:update      Partial<Settings> → Settings
renderer → main    spoiler:request      { level } → { confirmed: boolean }
renderer → main    achievement:reveal   { id, layer } → AchievementHintView
renderer → main    save:pick-path       → string | null
```

`spoiler:request` e `achievement:reveal` são as únicas portas que aumentam exposição, e as duas
passam por confirmação no main. O renderer nunca decide sozinho o que pode ver.

## Fonte para OBS

Servidor HTTP local (`node:http`, sem framework) em `127.0.0.1:<porta>` servindo o build do
renderer `overlay/` e um endpoint SSE `/events` com a mesma `OverlayView` enviada à janela.
Desligado por default; liga no settings. Nunca escuta em `0.0.0.0`.

## Settings

JSON em `app.getPath('userData')/settings.json`, schema em `contracts`, migração por
`schemaVersion`. Campos: `savePath | null`, `spoilerLevel`, `overlay {enabled, x, y, opacity}`,
`toasts {enabled}`, `startWithWindows`, `obs {enabled, port}`, `achievementOptIns`.

## Steam

`AchievementSource` é interface em `core`. `packages/steam` traz `SteamworksAchievementSource`
(`steamworks.js`, `init(753640)`, poll quando Steam está rodando) e `NullAchievementSource`.
`main` escolhe no bootstrap e troca em runtime se a Steam abrir/fechar. Ver
[ADR 0005](../decisions/0005-steam-opcional.md).

## Histórico (fase 5)

Fora do MVP. `HistoryStore` é interface em `core`; implementação decidida por ADR quando chegar.

## Comandos previstos

```bash
pnpm install
pnpm dev                       # electron-vite dev
pnpm build | lint | typecheck | test
pnpm --filter content validate
pnpm --filter desktop dist     # electron-builder
```
