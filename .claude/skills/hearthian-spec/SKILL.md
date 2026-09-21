---
name: hearthian-spec
description: Como especificar uma funcionalidade nova ou registrar uma decisão (ADR) no Hearthian Log antes de implementar. Use quando o pedido não estiver coberto por uma spec em specs/, quando for contrariar uma decisão registrada, ou quando uma escolha técnica merecer registro.
---

# Hearthian Log — Especificar antes de codar

Se o que foi pedido não está em `specs/`, **a resposta certa não é código** — é uma spec e a
aprovação do Diego.

## O princípio, primeiro

> **Na dúvida, mostre menos.** O app existe para não estragar a descoberta. Uma funcionalidade
> que mostra mais do que o nível permite está errada por definição, mesmo que útil.

Segundo princípio: **o save é a verdade.** Se o dado não está no save nem no Steamworks, o app
não sabe, e diz que não sabe.

## Estrutura de uma spec de funcionalidade

Arquivo em `specs/domain/<slug>.md` (ou seção nova numa spec existente):

1. **Problema** — o que o jogador quer saber ou fazer
2. **Fonte de dados** — que campos do save ou do Steamworks alimentam isso
3. **Por nível de spoiler** — tabela com o que aparece em `none`, `locations`, `titles`, `full`.
   **Obrigatória.** Se a tabela é igual em todos os níveis, justifique.
4. **Modelo** — tipos novos em `core`, campos novos em `View`, canais novos em `contracts`
5. **Onde mora** — que pacote, que função
6. **Testes** — o que precisa de teste para ser aceito (ver `hearthian-testing`)
7. **Escopo** — o que entra, em itens
8. **Pendências** — o que ainda precisa ser confirmado (campo do save, dado da comunidade)

## Antes de escrever, verifique

- [ ] Li `specs/project/onboarding.md` e `specs/domain/spoiler.md`
- [ ] Procurei conflito com os ADRs em `specs/decisions/`
- [ ] O dado existe no save? Confirmei em `save-model.md` ou marquei como pendência?
- [ ] A funcionalidade exige mod ou tempo real? Se sim, é fase 2, outro repo — [ADR 0004](../../../specs/decisions/0004-so-o-save-nunca-mod.md)
- [ ] Exige módulo nativo novo? Então precisa de ADR
- [ ] Reusa o que já existe (`projectView`, `ToastQueue`, `SettingsStore`)?

## ADR

Use `specs/decisions/template.md`. Numeração sequencial. Um ADR quando:

- Escolha de biblioteca com impacto (módulo nativo, framework de UI, storage)
- Mudança em regra de dependência
- Qualquer coisa que muda o que um nível de spoiler mostra
- Contrariar decisão anterior — o novo ADR marca o antigo como `substituído por`

Depois de criar o ADR, adicione a linha na tabela de `specs/README.md` e, se for regra fechada,
em `specs/project/onboarding.md`.

## Nunca

Não implemente com a spec pela metade. Se falta confirmar um campo do save, a pendência fica
listada e o item **não entra** no escopo até ser confirmado.
