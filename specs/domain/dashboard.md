---
tags: [hearthian-log, dashboard, ui]
---

# Dashboard

Tela principal do app. Recebe uma `DashboardView` pelo canal `view:update` e renderiza o que
está nela — nada mais. Esta spec descreve o **nível `none`** por completo, que é o MVP da
Fase 1. Os outros níveis têm a tabela obrigatória e ficam para a Fase 2.

Os tipos que esta spec descreve já existem em `packages/contracts/src/views/dashboard.ts`.
Onde a spec pede um campo que ainda não está lá, isso está em [Modelo](#modelo).

## Problema

O jogador quer olhar para uma tela e saber, sem ler nada que ainda não descobriu:

- quanto do diário de bordo já revelou, no total e por local
- se há entradas reveladas que ainda não leu no jogo
- que linhas de investigação estão abertas e quanto falta em cada uma
- quantos sinais já sintonizou
- quantos loops já viveu
- quantas conquistas faltam e quantas parecem "ao alcance"
- se o app está enxergando o save ou não

## Fonte de dados

| Item da tela | Origem | Regra |
|---|---|---|
| Fatos revelados / total | `snapshot.facts` | revelado ⇔ `revealOrder >= 0`; **denominador vem do save**, que lista todos os fatos |
| Não lidos | `snapshot.facts` | `revealed && !read` |
| Por local | `snapshot.facts` + `content/structure` (fato → entrada → local) | local visitado ⇔ tem ≥ 1 fato revelado |
| Por curiosidade | `snapshot.facts` + `content/structure` (entrada → curiosidade) | curiosidade aberta ⇔ tem ≥ 1 fato revelado |
| Sinais | `snapshot.signals` + `content/structure/signals` | denominador vem do conteúdo — o save só lista sinais já vistos |
| Frequências | `snapshot.frequencies` | denominador é 7, fixo no save (`knownFrequencies`); não depende do conteúdo |
| Loops | `snapshot.loopCount`, `snapshot.fullLoops` | "iniciados" inclui mortes; "completos" chegaram à supernova |
| Conquistas | `AchievementSource` + `content/structure/achievements` | sem Steam, `remaining` é `null`; "ao alcance" vem de `prerequisiteFactIds` |
| Status do save | pipeline em `main` | não está no save; ver [Modelo](#modelo) |

Fatos em `snapshot.unknownFactIds` (presentes no save, ausentes do conteúdo) contam no total
geral e não entram em nenhum local ou curiosidade.

## Por nível de spoiler

| Bloco | `none` | `locations` | `titles` | `full` |
|---|---|---|---|---|
| Progresso geral, não lidos, loops, sinais, frequências | Contagens | Idem | Idem | Idem |
| Locais | Só visitados, nome + `n/total` | Todos, nome + `n/total`, não visitados marcados | Idem `locations` | Idem |
| Curiosidades | Só abertas, nome + `n/total` | Idem `none` | Todas, com nome, e a lista de fatos com **título** e estado revelado/lido | Idem `titles` + **texto** |
| Conquistas | `?`/total faltando, `n` ao alcance. Sem lista | Idem | Contagens + lista com nome, estado e "ao alcance" | Idem + descrição e dicas |
| Status do save | Igual em todos os níveis — não é conteúdo do jogo | | | |

O denominador por local (`18/19`) aparece em `none` porque o Ship Log do jogo mostra o mesmo
para um local visitado ([spoiler.md](./spoiler.md)). O denominador de sinais (`4/31`) e o
total de conquistas (`30`) seguem a mesma lógica: são números que o jogo e a Steam já mostram.

**O que `none` nunca mostra:** quantos locais existem, quantas curiosidades existem, nome de
qualquer coisa sem fato revelado, título ou texto de fato, nome de conquista. A `View` não
carrega isso, então a tela não tem como mostrar.

## Tela — nível `none`

Os números do esquema abaixo vêm de `packages/core/fixtures/early.owsave.json`.

### Estrutura

```
┌ Topbar ──────────────────────────────────────────────────────────────┐
│ Hearthian Log            [● save lido às 21:14] [spoiler: nenhum ▾] ⚙ │
├ Hero ────────────────────────────────────────────────────────────────┤
│  12%                              ┌ Não lidos ┐ ┌ Sinais      ┐      │
│  45 de 375 fatos revelados        │ 12        │ │ 4/31        │      │
│  ▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░      ├ Loops     ┤ ├ Frequências ┤      │
│                                   │ 4         │ │ 2/7         │      │
│                                   ├ Supernovas┤ └─────────────┘      │
│                                   │ 1         │                      │
├ Locais visitados · 3 ───────┬ Curiosidades em aberto · 3 ────────────┤
│ Brittle Hollow      20/61   │ Quantum Moon                   9/46    │
│ ▓▓▓▓░░░░░░░░░░░░░           │ ▓▓░░░░░░░░░░░░░░                       │
│ Timber Hearth       18/19   │ …                                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░           │                                        │
├ Conquistas ─────────────────┴────────────────────────────────────────┤
│ ? de 30 faltando  |  3 ao alcance                                    │
│ ⓘ Steam não detectada. …                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### Blocos

**Topbar.** Nome do app; pill de status do save (ver [Estados](#estados-da-tela)); pill do
nível de spoiler atual, que abre o seletor de nível (subir passa por `spoiler:request` e
confirmação nativa no main — [spoiler.md](./spoiler.md)); botão de configurações.

**Hero.** Uma única figura grande: percentual de `facts.revealed / facts.total`, arredondado
para inteiro, com a fração por extenso embaixo e uma barra. Ao lado, cinco tiles:

| Tile | Valor | Regra |
|---|---|---|
| Não lidos no jogo | `unread` | Destacado com a cor de acento quando `> 0`; texto "N entradas novas esperando no Ship Log" |
| Sinais sintonizados | `signals.revealed/total` | Denominador vem do conteúdo |
| Frequências | `frequencies.revealed/total` | Denominador é sempre 7, do próprio save |
| Loops iniciados | `loops.started` | |
| Supernovas vistas | `loops.completed` | |

**Locais visitados.** Título com a quantidade de locais listados. Uma linha por item de
`locations`: nome, `revealed/total`, barra. Linha com `revealed === total` ganha a tag
"completo" e a barra muda para a cor de sucesso. Vazio: "Nenhum local visitado ainda."

**Curiosidades em aberto.** Mesmo componente de linha, sobre `curiosities`. Uma curiosidade
completa continua listada, com a tag "completo". Vazio: "Nenhuma linha de investigação
aberta ainda."

**Conquistas.** Duas figuras: `remaining` de `total` faltando e `reachable` ao alcance.
`remaining === null` renderiza `?` e um aviso: "Steam não detectada. O app não sabe quais
conquistas você já tem — só quantas parecem estar ao alcance pelo que o diário mostra." Sem
lista neste nível.

**Rodapé.** Uma frase fixa: "Modo sem spoiler: só aparece o que o seu diário já mostra.
Locais e curiosidades ainda não visitados não são listados nem contados."

### Ordenação

Locais e curiosidades aparecem na **ordem de declaração em `content/structure`**, que segue
a ordem do Ship Log do jogo. Não ordenar por progresso: a lista pularia de lugar a cada fato
novo. O `projectView` já entrega nessa ordem; o renderer não reordena.

### Estados da tela

A tela é a mesma; o que muda é o que o main mandou por último.

| Estado | Quando | O que aparece |
|---|---|---|
| Normal | Última leitura do save deu certo | Tudo acima; pill verde "save lido às HH:MM" |
| Diário vazio | Save válido com zero fatos revelados | Hero em 0%, listas vazias com o texto de vazio |
| Save não encontrado | Locator não achou nenhum `data.owsave` e não há caminho manual | Pill amarela "save não encontrado"; card no lugar do conteúdo com botão "Escolher arquivo…" (`save:pick-path`) |
| Formato desconhecido | `parseSave` devolveu `unsupported-shape` | Pill vermelha "formato desconhecido"; se existe uma `View` anterior nesta sessão, ela fica na tela com o aviso "mostrando o último estado conhecido de HH:MM" |
| Escrita parcial | `partial-write` | Nada muda na tela; o watcher tenta de novo. Só vira "formato desconhecido" depois de N tentativas |

O app **funciona sem o jogo aberto**: mostra a última `View` calculada a partir do save em
disco. Não existe estado "jogo fechado".

### Idioma

Strings da UI em **pt-BR** no MVP. Ficam num único módulo do renderer para trocar depois;
i18n não entra na Fase 1.

## Modelo

O que já existe em `contracts` cobre o nível `none` com uma lacuna: **o status do save não
está em nenhuma `View` nem canal**. Proposta:

```ts
type SaveStatusView =
  | { kind: 'ok'; readAt: number }
  | { kind: 'not-found' }
  | { kind: 'unsupported-shape'; lastGoodAt: number | null }
```

Canal novo `main → renderer` `status:update: SaveStatusView`. Separado de `view:update` para
que uma falha de parse não obrigue a reenviar uma `View` que não mudou. Sem nome de perfil no
payload: o nome da pasta pode ser o nick da Steam ([save-model.md](./save-model.md)).

Um campo novo no `progressSchema`, em todos os níveis:

```ts
frequencies: { revealed: number; total: number }
```

`total` é `7`, o tamanho de `knownFrequencies` no save. Não depende do conteúdo, então o tile
funciona mesmo antes do dump ser importado.

## Onde mora

| Peça | Pacote | Função |
|---|---|---|
| Contagens por local, curiosidade, sinais, não lidos, "ao alcance" | `core` | `computeProgress(snapshot, structure, achievements): Progress` |
| Filtro por nível e montagem da `View` | `core` | `projectView(progress, names, level): DashboardView` |
| Status do save | `desktop/main` | pipeline do save decide e emite `status:update` |
| Renderização | `desktop/renderer/dashboard` | componentes: `Topbar`, `Hero`, `ProgressRows`, `AchievementsCard`, `StatusBanner` |

Nenhuma conta no renderer além de `Math.round` do percentual e `total - revealed` para a tag
"completo". Tudo o mais chega pronto na `View`.

## Testes

Obrigatórios ([hearthian-testing](../../.claude/skills/hearthian-testing/SKILL.md)):

- `computeProgress` contra `early.owsave.json`: 45/375, 12 não lidos, 4 sinais, loops 4/1,
  três locais visitados com as contagens do fixture; `empty.owsave.json` dá zero em tudo e
  listas vazias
- `projectView` em `none`: só locais e curiosidades com fato revelado; **falha se qualquer
  string de `names` de item não visitado ou de `text` aparecer na `View`**; a saída passa em
  `dashboardViewNoneSchema`
- `projectView` preserva a ordem de `structure`
- Fatos em `unknownFactIds` contam no total e em nenhum local

Não obrigatórios: snapshot de componente React. Teste de componente só onde houver lógica
(o tile "não lidos" destacar quando `> 0`, o card de conquistas com `remaining === null`).

## Escopo

Entra na Fase 1:

- Tela no nível `none` como descrita, incluindo os cinco estados
- `computeProgress` e `projectView` em `core`, para o nível `none`
- Canal `status:update` em `contracts`
- **Primeiro passo da fase:** conteúdo mínimo para a tela funcionar — `structure` de fatos,
  entradas, locais, curiosidades e sinais, e `names` de locais e curiosidades. Sem isso o
  dashboard não tem nome de local, agrupamento por curiosidade nem denominador de sinal.
  Origem do dump registrada em `SOURCES.md`. **`text/` não entra na Fase 1**: o nível `none`
  não mostra título nem texto de fato, então os 375 textos do Ship Log ficam para a Fase 2
- Conquistas: card com `remaining: null` e `reachable: 0` enquanto `structure/achievements`
  estiver vazio e não houver `AchievementSource`

Não entra:

- Níveis `locations`, `titles`, `full` (Fase 2)
- Lista de conquistas, opt-in por conquista, dicas (Fase 3)
- Overlay e toast (specs próprias)
- Histórico e gráfico de evolução (Fase 5)

## Pendências

1. **Conquistas em `none` sem lista.** `spoiler.md` prevê placeholders anônimos ("Conquista
   #7 · ao alcance") com opt-in individual, mas `DashboardViewNone.achievements` é só
   contagem e `achievement:reveal` precisa de um id. Resolver na spec de conquistas (Fase 3):
   ou a `View` de `none` ganha uma lista de `{ id, reachable }`, ou o opt-in só existe a partir
   de `titles`.
2. **Denominador de sinais.** Confirmar o total de sinais no conteúdo quando o dump for
   importado. O mock usou 31 (chaves vistas em saves reais).
3. **Ordem do Ship Log.** Confirmar que o dump comunitário preserva a ordem de exibição do
   jogo; se não, `Location` e `Curiosity` em `structure` precisam de `order`.
4. **N tentativas de `partial-write`** antes de mostrar erro: número a fixar na spec do watcher.
