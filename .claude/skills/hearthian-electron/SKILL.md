---
name: hearthian-electron
description: Como trabalhar em apps/desktop do Hearthian Log — processo main, preload, renderers (dashboard, overlay, toast), IPC tipado, tray, autostart, servidor OBS, electron-builder. Use ao criar ou alterar janela, canal IPC ou qualquer coisa que rode dentro do Electron.
---

# Hearthian Log — Electron

Ler antes: `specs/domain/arquitetura.md` (seções Janelas, IPC, Settings, OBS) e
`specs/domain/spoiler.md`.

## Estrutura

```
apps/desktop/src/
├── main/
│   ├── bootstrap/      createApp, wiring do pipeline, escolha do AchievementSource
│   ├── pipeline/       SaveService: locator → watcher → parse → diff → progress → project → send
│   ├── windows/        DashboardWindow, OverlayWindow, ToastWindow, ToastQueue
│   ├── tray/           createTray
│   ├── ipc/            um handler por canal, valida com schema do contracts
│   ├── settings/       SettingsStore (JSON em userData, schema do contracts, migrações)
│   ├── obs/            OverlayServer (node:http + SSE, 127.0.0.1 apenas)
│   └── content/        ContentLoader: carrega structure/names/text conforme o nível
├── preload/
│   ├── dashboard.ts    expõe só o que o dashboard usa
│   ├── overlay.ts      expõe só view:update
│   └── toast.ts        expõe só toast:show
└── renderer/
    ├── dashboard/      React
    ├── overlay/        React, mínimo, mesmo build serve o OBS
    ├── toast/          React, mínimo
    └── shared/         hooks de IPC tipados a partir do contracts
```

## Regras

- **Renderer importa só `@hearthian/contracts`.** Nunca `core`, `content`, `save-io`, `steam`.
  O lint barra; se precisou de um `eslint-disable`, a solução está errada.
- **Preload estreito.** `contextBridge.exposeInMainWorld('hearthian', { ... })` com exatamente
  os canais daquela janela. Nada de expor `ipcRenderer` inteiro.
- **`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`** em toda janela.
- **Todo handler IPC valida entrada com o schema do `contracts`** antes de agir, mesmo vindo
  do nosso próprio renderer.
- **`spoiler:request` e `achievement:reveal` abrem `dialog.showMessageBox`** antes de mudar
  qualquer coisa. O renderer nunca sobe nível sozinho.
- **Main envia `View`, não `Snapshot`.** O snapshot cru nunca cruza o IPC.
- **ContentLoader carrega `text` por `import()` dinâmico** e só quando o nível ou um opt-in
  exige. Descarrega ao descer de nível.

## Janelas

| Janela | Como |
|---|---|
| Dashboard | `BrowserWindow` padrão. `close` → `hide()` para a tray. Sair só pelo menu da tray |
| Overlay | `transparent: true, frame: false, alwaysOnTop: true, skipTaskbar: true, focusable: false`. `setIgnoreMouseEvents(true, { forward: true })`. Modo arrastar desliga isso até soltar |
| Toast | `frame: false, alwaysOnTop: true, skipTaskbar: true, focusable: false`. Posição calculada de `screen.getPrimaryDisplay().workArea`. `ToastQueue` mostra uma por vez, fecha por timer |
| Tray | `Tray` com menu: abrir dashboard, overlay on/off, nível atual (somente leitura), sair |

Janela desligada no settings é **destruída**, não escondida. RAM ociosa importa.

## Settings

- `SettingsStore` lê `userData/settings.json`, valida com `SettingsSchema` do `contracts`,
  aplica defaults e migra por `schemaVersion`. Escrita atômica (tmp + rename).
- Mudança de settings dispara reprojeção: nível mudou → nova `View` para todas as janelas.

## Servidor OBS

- `node:http` em `127.0.0.1`, porta do settings. Serve o build estático de `renderer/overlay`
  e `/events` como SSE com a `OverlayView` corrente. Sem framework, sem CORS aberto.
- Só sobe se `settings.obs.enabled`. Cai ao desligar.

## Build

- `electron-vite` com três entradas de renderer.
- `electron-builder` para Windows (nsis). `steamworks.js` como `asarUnpack`.
- Teste de build: script que procura a string sentinela do `content` no bundle do renderer e
  falha se achar.

## Nunca

- Expor `ipcRenderer`, `require` ou `process` ao renderer
- Enviar snapshot cru ou `LoadedContent` pelo IPC
- Escutar em `0.0.0.0`
- Comentário no código
