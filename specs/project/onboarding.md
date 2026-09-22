---
tags: [hearthian-log, onboarding]
---

# Onboarding — leia isto primeiro

Uma página para entender o projeto antes de abrir qualquer código.

## O que é

**Hearthian Log** é um app desktop que roda ao lado de **Outer Wilds** (vanilla, sem mod),
observa o arquivo de save do jogo e mostra ao jogador o progresso de exploração **sem revelar o
que ele ainda não descobriu**. Também funciona como guia para 100% (Ship Log completo e todas as
conquistas), com dicas em camadas que o jogador abre uma por vez.

Não é um mod, não lê memória do jogo, não é tempo real. Lê um JSON que o jogo reescreve em
eventos específicos. O briefing completo está em [briefing.md](./briefing.md).

## Por que "Hearthian"

Hearthians são o povo do jogador em Outer Wilds, os habitantes de Timber Hearth. O nome não
revela nada que a tela inicial do jogo já não mostre.

## Glossário — os termos se confundem

| Termo | O que é | Cuidado |
|---|---|---|
| **Save** | `data.owsave`, JSON do Unity `JsonUtility` | Somente leitura. Reescrito em eventos, não em tempo real |
| **Loop** | Ciclo de 22 min que termina em supernova | O save persiste entre loops; contagem de loops vem do save |
| **Ship Log** | Diário de bordo do jogo | Organiza fatos por local (modo mapa) e por curiosidade (modo rumor) |
| **Fato** (`Fact`) | Unidade atômica de conhecimento, identificada por `FACT_ID` | É o que o save guarda: `revelado`, `lido`, `novo`. É a entidade central |
| **Entrada** (`Entry`) | Agrupamento de fatos de um lugar específico dentro de um local | Um local tem várias entradas; uma entrada tem vários fatos |
| **Local** (`Location`) | Planeta, lua ou estação | Brittle Hollow, Ember Twin, Dark Bramble… O nome já é spoiler leve |
| **Curiosidade** (`Curiosity`) | Linha de investigação que atravessa vários locais | Ex.: Quantum Moon, Vessel. É a cor no rumor board |
| **Rumor** | Fato que aponta para outro lugar ("há algo em X") | Aresta do grafo. Rumor revelado não significa destino visitado |
| **Sinal / Frequência** | O que o Signalscope já sintonizou | Vem do save; é conhecimento, logo é progresso |
| **Conquista** | Uma das ~30 conquistas Steam | **Não está no save.** Vem do Steamworks. Sem Steam, checklist fica desconhecido |
| **Local visitado** | Local com pelo menos um fato revelado | Única definição. Não existe outro dado de "visitou" |
| **Snapshot** | Nosso modelo normalizado de um save num instante | Diff entre dois snapshots gera eventos |
| **Projeção** (`View`) | Snapshot + conteúdo filtrados pelo nível de spoiler | É a única coisa que chega ao renderer |

## Níveis de spoiler — a restrição central

| Nível | O que aparece | Default? |
|---|---|---|
| `none` | Só contagens e nomes de locais **já visitados** | **Sim** |
| `locations` | Nomes de todos os locais, mesmo não visitados | Opt-in |
| `titles` | Títulos dos fatos não revelados de uma curiosidade, sem texto | Opt-in |
| `full` | Tudo, incluindo texto. Para quem já zerou | Opt-in com confirmação |

Cada conquista tem, além disso, opt-in individual para abrir dicas em camadas (vaga → média →
explícita), independente do nível global. Detalhes em [spoiler.md](../domain/spoiler.md).

## Regras já decididas — não reabra sem ADR

1. **Electron + TypeScript.** → [ADR 0001](../decisions/0001-electron-typescript.md)
2. **pnpm workspace com `core` puro.** → [ADR 0002](../decisions/0002-pnpm-workspace-core-puro.md)
3. **Spoiler é fronteira de dependência.** Renderer não importa conteúdo. → [ADR 0003](../decisions/0003-spoiler-como-fronteira-de-dependencia.md)
4. **Só o save, nunca mod.** Telemetria em tempo real é fase 2 em outro repo. → [ADR 0004](../decisions/0004-so-o-save-nunca-mod.md)
5. **Steam é adaptador opcional.** → [ADR 0005](../decisions/0005-steam-opcional.md)
6. **Conteúdo autoral versionado como dado, validado por schema.** → [ADR 0006](../decisions/0006-conteudo-como-dado-versionado.md)

## Onde as coisas estão

| Quero... | Vá para |
|---|---|
| Entender o produto | [Briefing](./briefing.md) |
| Saber em que fase estamos | [Roadmap](./roadmap.md) |
| Entender os pacotes e quem importa quem | [Arquitetura](../domain/arquitetura.md) ← **obrigatório** |
| Mexer no parser do save | [Modelo do Save](../domain/save-model.md) |
| Adicionar fato, conquista ou dica | [Modelo de Conteúdo](../domain/content-model.md) |
| Mexer em qualquer coisa que exibe nome/título/texto | [Spoiler](../domain/spoiler.md) ← **obrigatório** |
| Saber por que algo é assim | [`specs/decisions/`](../decisions/) |
| O que aproveitamos do SteamAchievementNotifier | [Research](../research/steam-achievement-notifier.md) |

## Como trabalhamos

Leia [CONTRIBUTING.md](../../CONTRIBUTING.md). O resumo: spec antes de código, checklist
antes de implementar, `pnpm`, sem comentário no código, commit só com autorização.
