---
tags: [hearthian-log, briefing]
---

# Briefing — Outer Wilds Ship Log Companion

> Documento de origem do projeto. Descreve **o que** será construído e **por quê**. As
> decisões de arquitetura tomadas a partir dele estão em `specs/domain/` e `specs/decisions/`.

## Contexto

Quero criar um projeto pessoal, para portfólio, relacionado ao jogo **Outer Wilds** (Steam AppID 753640).
Estudei recentemente o código do [SteamAchievementNotifier](https://github.com/Jragon/SteamAchievementNotifier) (Electron + TypeScript), um app que roda ao lado de jogos Steam e mostra notificações de conquistas. Quero construir algo no mesmo espírito — um app desktop que roda ao lado do jogo — mas que seja um repositório meu, com propósito próprio.

Outer Wilds é um jogo de exploração 100% guiado por conhecimento: não há upgrades, o único progresso é o que o jogador *descobre*. Esse progresso é registrado no **Ship Log** (diário de bordo), que organiza os fatos descobertos por local e por "curiosidade" (linha de investigação). O jogo roda em loops de 22 minutos que terminam com uma supernova; o Ship Log persiste entre loops.

Por ser um jogo sobre descoberta, **spoilers arruínam a experiência**. Qualquer ferramenta séria para Outer Wilds precisa tratar isso como restrição de design central, não como detalhe.

## O que quero construir

Um **app desktop companion** que observa o arquivo de save do jogo e mostra ao jogador o seu progresso de exploração **sem revelar o que ele ainda não descobriu**.

O app não é um mod. Ele funciona por fora, com o jogo vanilla, lendo o save. Isso é intencional: zero instalação dentro do jogo, funciona com qualquer versão, e não corre risco de quebrar com updates.

### Fonte de dados

O jogo salva em um arquivo JSON legível (Unity `JsonUtility`):

```
%USERPROFILE%\AppData\LocalLow\Mobius Digital\Outer Wilds\SteamSaves\<steamid>\data.owsave
```

(na versão Epic o caminho é ligeiramente diferente — o app deve suportar os dois e permitir caminho manual)

O que se sabe do conteúdo (**os nomes exatos dos campos precisam ser confirmados abrindo um save real**):

- contagem de loops completados
- dicionário de fatos do Ship Log: `FACT_ID → { revelado, lido, novo }`
- frequências e sinais do Signalscope já conhecidos
- flags de eventos e conquistas internas
- estado das conquistas Steam vem de fora do save, via Steamworks (ver funcionalidade 6)

O arquivo é reescrito pelo jogo em momentos específicos (fato descoberto, fim de loop, menu). Ele **não** reflete estado em tempo real (posição, oxigênio, tempo do loop) — isso exigiria um mod e está explicitamente fora do escopo deste projeto.

### Dados estáticos necessários

Para transformar `FACT_ID`s crus em informação útil, o app precisa de uma **tabela estática** que mapeie cada fato para:

- local / planeta (ex.: Brittle Hollow, Ember Twin, Dark Bramble…)
- curiosidade / linha de investigação a que pertence
- título e texto do fato (para o modo com spoiler opcional)
- relações entre fatos (o "rumor board" do jogo é um grafo)

Esses dados a comunidade já extraiu do jogo (dumps do Ship Log existem em repositórios de mods e wikis). Montar/validar essa tabela é uma tarefa do projeto. O texto dos fatos é conteúdo do jogo — o app deve tratá-lo com cuidado (nunca exibir sem opt-in explícito).

## Funcionalidades

### 1. Dashboard de progresso

Tela principal. Mostra:

- loops completados
- progresso geral de exploração (% de fatos revelados)
- lista de locais com barra de progresso individual — ex.: "Brittle Hollow: 12/19"
- sinais e frequências do Signalscope já encontrados
- fatos revelados mas ainda não lidos no jogo — "você tem 2 entradas novas no log"
- curiosidades incompletas — "há 3 coisas a descobrir sobre o Quantum Moon"

### 2. Notificações (toast)

Quando o save muda e o diff detecta um fato novo, o app mostra uma notificação nativa/custom:
"Novo fato descoberto em Ember Twin". Nunca mostra o conteúdo do fato — só onde.

Mesma mecânica de notificação que estudei no SteamAchievementNotifier.

### 3. Overlay

Janela transparente, always-on-top, click-through, com um resumo compacto do progresso. Para quem joga em janela ou faz stream. Posição e opacidade configuráveis. Deve ter também uma forma de ser capturada pelo OBS (janela dedicada ou fonte de browser).

### 4. Modo spoiler

Comportamento padrão: **spoiler-free**. O app só mostra contagens e nomes de locais que o jogador já visitou (ou seja, que já têm pelo menos um fato revelado). Locais nunca visitados não aparecem nem no nome.

Níveis opcionais, ativados explicitamente pelo usuário:

- **Dica leve** — mostra nomes de todos os locais, mesmo não visitados
- **Dica média** — mostra o *título* dos fatos não revelados de uma curiosidade (não o conteúdo)
- **Completo** — mostra tudo, incluindo texto; pensado para quem já zerou e quer 100%

A UI deve tornar óbvio em que nível está e pedir confirmação ao subir de nível.

### 5. Configuração

- caminho do save (auto-detecção Steam/Epic com fallback manual)
- nível de spoiler
- posição/opacidade/visibilidade do overlay
- ligar/desligar toasts
- iniciar com o Windows / minimizar para a bandeja

### 6. Acompanhamento para platinar (100%)

Além do progresso de exploração, quero que o app funcione como um **guia para completar o jogo em 100%** — todas as conquistas e todo o Ship Log — sempre respeitando o nível de spoiler.

O jogo tem ~30 conquistas (Steam), várias bem obscuras e que não são descobertas naturalmente jogando (ex.: ações específicas em lugares específicos, ou coisas que exigem "quebrar" a lógica do loop). Sem um guia, a maioria dos jogadores nunca as encontra. O problema é que guias na internet entregam tudo de uma vez, com spoiler.

O que quero:

- **Checklist de conquistas** — quais já desbloqueadas, quais faltam. Estado obtido via Steamworks (mesma técnica do SteamAchievementNotifier: `init(753640)` + consulta), com fallback para flags do save quando existirem.
- **Dicas em camadas** para cada conquista que falta, reveladas uma por vez e só por ação do usuário:
  1. vaga — "envolve um planeta que você já visitou"
  2. média — "envolve o Signalscope e algo que muda de posição"
  3. explícita — o passo a passo
- **Checklist do Ship Log** — o que falta por curiosidade, integrado ao dashboard; a "última milha" do 100% é geralmente 2–3 fatos escondidos que o jogador não sabe que existem.
- **Ordem sugerida** — algumas conquistas ficam mais fáceis quando o jogador já sabe certas coisas; o app pode sugerir "essa aqui você já tem tudo pra fazer" com base no que já foi revelado no Ship Log, sem dizer o quê.
- **Dependência com o nível de spoiler** — no modo spoiler-free, o app mostra apenas *quantas* conquistas faltam e quais já estão "ao alcance". Nomes e dicas só aparecem nos níveis superiores ou por opt-in individual por conquista.

A distinção com o SteamAchievementNotifier: ele notifica genericamente qualquer jogo; aqui a proposta é um guia curado e específico, com conteúdo autoral (as dicas em camadas) e cruzamento com o estado do Ship Log.

### 7. Histórico (desejável, não obrigatório no MVP)

Guardar snapshots do save ao longo do tempo para mostrar evolução: fatos descobertos por sessão, gráfico de progresso, "em que loop descobri X". O save do jogo em si não tem histórico — o app criaria o seu.

## Requisitos não funcionais

- **Windows** é o alvo principal (é onde o jogo roda para mim). Linux/Mac são desejáveis mas não prioridade.
- Deve ser leve: fica aberto em segundo plano enquanto o jogo roda, não pode competir por recursos.
- Deve reagir a mudanças no save em poucos segundos, sem polling agressivo.
- Deve lidar bem com o jogo escrevendo o arquivo em etapas (arquivos temporários, escritas parciais, eventos duplicados do file watcher).
- Deve funcionar sem o jogo aberto (mostrar último estado conhecido) e sem a Steam aberta (só perde o estado das conquistas).
- Deve degradar bem se o save não for encontrado ou estiver num formato inesperado (versão nova do jogo).
- Código apresentável como portfólio: TypeScript, testes onde fizer sentido, README bom, CI básico.

## Fora de escopo (deste projeto)

- Qualquer coisa que exija mod dentro do jogo (telemetria em tempo real, timer do loop, posição do jogador). Isso é uma possível **fase 2** em outro repositório, e este app deve ser desenhado para eventualmente consumir esses dados, mas não depende deles.
- Edição do save.
- Notificação genérica de conquistas Steam (o SteamAchievementNotifier já faz isso). O que está *dentro* do escopo é o guia curado para 100% (funcionalidade 6), que usa o estado das conquistas como entrada, não como fim.

## O que quero da arquitetura

A partir deste documento, quero decidir:

- estrutura de projeto e stack (Electron é o ponto de partida natural pelo que já estudei, mas estou aberto a alternativas como Tauri)
- como modelar os dados do save e a tabela estática de fatos
- como estruturar o file watcher, parser e diff de forma testável
- como organizar as janelas (dashboard, overlay, toast) e a comunicação entre elas
- estratégia para o modo spoiler que não deixe conteúdo vazar por acidente (ex.: não carregar textos no renderer se o nível não permitir)
- como modelar e versionar o conteúdo autoral (dicas em camadas por conquista, mapeamento conquista → fatos do Ship Log relacionados)
- como integrar Steamworks sem que o app dependa dele (deve funcionar sem Steam rodando, só com o save)
- plano de entregas incremental — o que é o MVP mínimo publicável

## Referências

- Save: `%USERPROFILE%\AppData\LocalLow\Mobius Digital\Outer Wilds\SteamSaves\<steamid>\data.owsave`
- SteamAchievementNotifier (referência de estrutura Electron, overlay, toasts): `~/Documents/projetos_pessoais/SteamAchievementNotifier`
- Comunidade de mods (dumps do Ship Log, ferramentas): https://outerwildsmods.com
- OWML (só como referência para a futura fase 2): https://github.com/ow-mods/owml
