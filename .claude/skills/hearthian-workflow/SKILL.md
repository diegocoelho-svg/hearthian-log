---
name: hearthian-workflow
description: Determina e coordena o próximo passo correto no Hearthian Log. Use no início de qualquer pedido, quando o estado do projeto estiver confuso, quando faltar spec, ou para rotear trabalho para as outras skills do projeto.
---

# Hearthian Log — Workflow

Roteia o trabalho. **Não implementa, não decide produto pelo humano.**

## Antes de qualquer coisa

1. Leia `specs/project/onboarding.md` se ainda não leu nesta sessão.
2. Leia a spec do que vai ser tocado e os ADRs relevantes em `specs/decisions/`.
3. Confira `specs/project/roadmap.md` para saber em que fase o projeto está.
4. **Se a tarefa toca qualquer coisa que exibe nome, título ou texto do jogo**, leia
   `specs/domain/spoiler.md` inteiro antes de propor.

## Roteamento

```
Parser do save, diff, progresso, projeção, política de toast   → hearthian-core
Janela, IPC, preload, tray, overlay, toast, servidor OBS        → hearthian-electron
Tabela de fatos, conquistas, dicas, validate, SOURCES.md        → hearthian-content
Funcionalidade sem spec, decisão nova, contrariar ADR           → hearthian-spec
Escrever ou revisar teste                                       → hearthian-testing
```

## Gates — não passe por cima

- **Spec aprovada antes de código.** Se o pedido não está em `specs/`, escreva a spec via
  `hearthian-spec` e peça aprovação — não code assumindo.
- **ADR antes de contrariar decisão registrada.**
- **Checklist antes de implementar.** Apresente o plano e espere o ok do Diego.
- **Nenhum comentário no código.** Se sentir vontade de comentar, renomeie ou extraia.
- **Commit só com autorização explícita.** Nunca por iniciativa própria, nunca com trailer.
- **Conteúdo do jogo nunca chega ao renderer fora da projeção do nível.** Se a mudança faz
  isso, ela está errada, mesmo que "escondido".

## O que sempre escalar para o humano

Campo do save que não bate com `save-model.md` · qualquer exposição de conteúdo em nível que
não a permite · módulo nativo novo · escopo que cresceu · dúvida entre duas specs.

## Fluxo de git

1. Trabalho em worktree do Orca:
   `orca worktree create --repo name:hearthian-log --name feat/<slug> --no-parent`.
   Branch `feat/<slug>`, `fix/<slug>` ou `chore/<slug>` em inglês. Nunca direto na `main`.
2. Commit: **só quando o Diego autorizar**. Conventional Commits, curto, em inglês, sem `Co-Authored-By`.
   Commit no fim de trabalho coeso.
3. Push, remoto e release: só com pedido explícito.
