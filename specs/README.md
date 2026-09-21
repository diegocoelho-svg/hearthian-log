# Specs

Documentação do projeto. **Ordem de leitura sugerida:** onboarding → briefing → arquitetura →
spoiler → modelo do save → modelo de conteúdo.

## `project/` — o quê e para quem

| Documento | Conteúdo |
|---|---|
| [Onboarding](project/onboarding.md) | ★ Comece aqui. Glossário, níveis de spoiler e regras fechadas |
| [Briefing](project/briefing.md) | O produto, as funcionalidades, o que está fora de escopo |
| [Roadmap](project/roadmap.md) | Fases, MVP e riscos |

## `domain/` — como é construído

| Documento | Conteúdo |
|---|---|
| [Arquitetura](domain/arquitetura.md) | ★ Pacotes, regra de dependência, pipeline do save, janelas, IPC |
| [Spoiler](domain/spoiler.md) | ★ Níveis, projeções, o que cada nível carrega e como isso é garantido |
| [Modelo do Save](domain/save-model.md) | Onde fica, formato, `SaveSnapshot`, parser, diff, fixtures |
| [Modelo de Conteúdo](domain/content-model.md) | Tabelas estáticas, conteúdo autoral, versionamento, validação |

## `decisions/` — ADRs

Por que as coisas são como são. **Contrariar uma exige ADR novo.**

| # | Decisão |
|---|---|
| [0001](decisions/0001-electron-typescript.md) | Electron + TypeScript |
| [0002](decisions/0002-pnpm-workspace-core-puro.md) | pnpm workspace com `core` puro |
| [0003](decisions/0003-spoiler-como-fronteira-de-dependencia.md) | Spoiler como fronteira de dependência |
| [0004](decisions/0004-so-o-save-nunca-mod.md) | Só o save, nunca mod |
| [0005](decisions/0005-steam-opcional.md) | Steam é adaptador opcional |
| [0006](decisions/0006-conteudo-como-dado-versionado.md) | Conteúdo como dado versionado |

## `research/`

| Documento | Conteúdo |
|---|---|
| [SteamAchievementNotifier](research/steam-achievement-notifier.md) | O que aproveitamos e o que não |
