# ADR 0001 — Electron + TypeScript

**Status:** aceito
**Data:** 2026-09-18

## Contexto

O app precisa de: janela transparente always-on-top com click-through, janelas de toast,
tray, autostart, file watcher, integração Steamworks e um servidor local para OBS. Tudo isso já
foi resolvido em Electron pelo SteamAchievementNotifier, que foi o projeto estudado antes deste.

É um projeto de portfólio de um desenvolvedor TypeScript. A linguagem do repositório importa.

Tauri v2 foi considerado: menos RAM, binário menor. Mas o core seria Rust, a integração
Steamworks é menos madura, e overlay transparente click-through tem menos exemplos.

## Decisão

Usaremos **Electron** com **TypeScript** em todos os processos, `electron-vite` como bundler,
React no renderer, `electron-builder` para distribuição. Node 22, pnpm.

## Consequências

- Um só idioma no repo inteiro. Todo o domínio é TypeScript testável com Vitest.
- `steamworks.js` funciona direto, com o mesmo truque de `init(appId)` do SteamAchievementNotifier.
- RAM ociosa maior que Tauri. Mitigação: uma só janela do renderer carregada por vez quando
  possível, overlay e toast destruídos quando desligados, sem polling.
- Binário de ~100 MB. Aceito para um app de desktop Windows.
- O modelo de segurança do Electron (`contextIsolation`, `sandbox`, preload estreito) vira parte
  da arquitetura de spoiler — ver [ADR 0003](./0003-spoiler-como-fronteira-de-dependencia.md).

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Tauri v2 | Core em Rust muda o perfil do portfólio; Steamworks e overlay com menos referência |
| App nativo (.NET/WPF) | Sai do ecossistema TypeScript; overlay e OBS exigiriam mais trabalho |
| Web app + agente local | Duas peças para instalar; overlay não funciona |
