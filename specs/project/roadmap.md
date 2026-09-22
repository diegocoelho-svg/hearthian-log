---
tags: [hearthian-log, roadmap]
---

# Roadmap

**Fase atual:** Fase 0 (Fundação), branch `feat/foundation`. Checklist aprovado em 2026-09-21;
workspace, config compartilhada e fixtures prontos.

> Antes de implementar qualquer item, leia [Arquitetura](../domain/arquitetura.md) e a spec do
> que vai construir. Spec aprovada antes de código — ver [CONTRIBUTING](../../CONTRIBUTING.md).

## Concluído

- [x] Briefing escrito
- [x] Harness para agentes (`CLAUDE.md`, skills, specs, ADRs)
- [x] Stack: Electron + TypeScript
- [x] Estrutura: pnpm workspace, `core` puro
- [x] Spoiler modelado como fronteira de dependência

## Antes de codar

- [x] **Abrir um save real e confirmar os nomes dos campos** — [save-model.md](../domain/save-model.md) atualizado em 2026-09-21
- [ ] **Confirmar quando o jogo grava o save** (fato revelado? só fim de loop?) — watcher durante uma sessão; ver "O que ainda não foi confirmado" em save-model.md
- [x] Criar a primeira fixture anonimizada de save em `packages/core/fixtures/` — 2026-09-21
- [ ] Localizar dump comunitário do Ship Log e registrar a fonte em [content-model.md](../domain/content-model.md)
- [x] Aprovar checklist da Fase 0 — 2026-09-21

## Fases

### Fase 0 — Fundação
- [ ] pnpm workspace + turbo + `packages/config` (tsconfig, eslint, vitest base)
- [ ] `packages/core` com `SaveSnapshot`, parser tolerante, diff e testes contra fixture
- [ ] `packages/content` com schemas Zod e script `validate`
- [ ] `packages/contracts` com canais IPC e schemas das projeções
- [ ] CI: typecheck, lint, test, validate content
- [ ] README de portfólio

### Fase 1 — MVP publicável ★
- [ ] `packages/save-io`: locator Steam/Epic + caminho manual, watcher com debounce e hash
- [ ] `apps/desktop`: main, preload, janela do dashboard
- [ ] Progress engine: loops, % geral, por local, sinais, "não lidos", curiosidades incompletas
- [ ] Nível `none` funcionando de ponta a ponta
- [ ] Toast de fato novo — "novo fato em <local>" se o local já era visitado, senão "novo fato descoberto"
- [ ] Settings validado por schema, tray, iniciar com Windows
- [ ] Degradação: save não encontrado, save de formato desconhecido, último estado conhecido
- [ ] Release v0.1 (electron-builder, Windows)

### Fase 2 — Conteúdo e spoiler
- [ ] Tabela completa de fatos, locais, curiosidades e grafo de rumores
- [ ] Níveis `locations`, `titles`, `full` com confirmação ao subir
- [ ] Checklist do Ship Log por curiosidade

### Fase 3 — 100%
- [ ] `packages/steam`: `AchievementSource` com steamworks.js e `NullAchievementSource`
- [ ] Checklist de conquistas
- [ ] Conteúdo autoral: dicas em 3 camadas por conquista, fatos relacionados, pré-requisitos
- [ ] "Ao alcance" e ordem sugerida a partir do Ship Log
- [ ] Opt-in individual por conquista

### Fase 4 — Overlay
- [ ] Janela transparente, always-on-top, click-through, posição e opacidade
- [ ] Servidor local para fonte de browser do OBS

### Fase 5 — Histórico
- [ ] ADR sobre armazenamento (SQLite vs JSON lines)
- [ ] Snapshots por sessão, gráfico de progresso, "em que loop descobri X"

### Depois
- Linux/Mac
- Consumir telemetria da fase 2 (mod), em outro repositório

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Nomes dos campos do save diferentes do assumido | 🔴 Bloqueia a Fase 0 | Abrir save real antes de codar; parser `passthrough` e versão por forma |
| Conteúdo vazar para o renderer por engano | 🔴 Quebra a promessa do produto | Fronteira de dependência + lint + teste que falha se `content` aparecer no bundle do renderer |
| `steamworks.js` fazer a Steam achar que o jogo está rodando | 🟡 | Mesmo trade-off do SteamAchievementNotifier; documentar e permitir desligar |
| Dump comunitário incompleto ou de versão antiga | 🟡 | Versionar conteúdo por versão do jogo; validar contra IDs vistos em saves reais |
| Watcher perder escrita ou disparar em arquivo parcial | 🟡 | `awaitWriteFinish`, hash, retry de parse; testes com escrita simulada em etapas |
| Escopo crescer para "mod light" | 🟡 | ADR 0004 fecha isso |
