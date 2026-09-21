# ADR 0004 — Só o save, nunca mod

**Status:** aceito
**Data:** 2026-09-18

## Contexto

Há dados tentadores que o save não tem: posição do jogador, oxigênio, tempo restante do loop.
Um mod OWML entregaria tudo em tempo real. O briefing coloca isso explicitamente fora de escopo
e reserva para uma "fase 2" em outro repositório.

Cada passo na direção de mod muda o produto: exige instalação dentro do jogo, quebra com
update, e tira o argumento de "funciona com o jogo vanilla".

## Decisão

Este app **lê apenas `data.owsave`** e, opcionalmente, o estado de conquistas via Steamworks.
Não lê memória do processo, não injeta nada, não depende de OWML, não instala nada dentro da
pasta do jogo.

O save é **somente leitura**. Nenhum caminho de código abre o arquivo para escrita.

Para a fase 2 hipotética, `core` define desde já a fronteira: a entrada do pipeline é um
`SaveSnapshot`. Um mod que produza snapshots no mesmo formato encaixaria sem tocar no resto.

## Consequências

- Sem timer de loop, sem posição, sem "você está perto de X". Se um dia aparecer pedido disso,
  a resposta é "fase 2, outro repo".
- Latência de segundos entre o evento no jogo e o toast. Aceito.
- Instalação zero para o jogador. Funciona com qualquer versão do jogo que mantenha o formato.
- Testes não precisam do jogo rodando: uma fixture basta.

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Mod OWML com telemetria | Muda o produto; fora de escopo por decisão do briefing |
| Ler memória do processo | Frágil, invasivo, quebra a cada build do jogo, cheira a cheat |
| Editar o save (ex.: marcar fato como lido) | Risco de corromper progresso do jogador; nenhum ganho |
