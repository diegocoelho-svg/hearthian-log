---
tags: [hearthian-log, research]
---

# O que aproveitamos do SteamAchievementNotifier

Referência: https://github.com/Jragon/SteamAchievementNotifier — Electron + TypeScript, roda ao
lado de jogos Steam e notifica conquistas.

> A cópia local em `~/Documents/projetos_pessoais/SteamAchievementNotifier` não estava presente
> quando este documento foi escrito. Confirmar os pontos abaixo contra o repositório antes da
> Fase 1.

## Aproveitamos

| Técnica | Onde entra aqui |
|---|---|
| `steamworks.js` com `init(appId)` para ler conquistas | `packages/steam` — [ADR 0005](../decisions/0005-steam-opcional.md) |
| Janela de toast frameless posicionada pela área de trabalho, com fila | `apps/desktop` toast |
| Overlay transparente always-on-top com `setIgnoreMouseEvents` | `apps/desktop` overlay |
| Tray com menu e fechar-para-a-tray | `apps/desktop` main |
| Autostart via `app.setLoginItemSettings` | Settings `startWithWindows` |
| `electron-builder` para Windows | Release |

## Não aproveitamos

| Coisa | Por que não |
|---|---|
| Notificação genérica de qualquer jogo | Fora de escopo; aqui é um jogo e um guia curado |
| Configuração de aparência de toast por tema | Não é o produto; um toast só, sóbrio |
| Sons e mídia customizáveis | Idem |

## O que fazemos diferente

- Fonte primária é o **save**, não o Steamworks. Steam é opcional.
- Toda projeção passa por **nível de spoiler** antes de chegar ao renderer.
- Domínio em pacote puro, testado sem Electron.
