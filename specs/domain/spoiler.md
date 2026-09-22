---
tags: [hearthian-log, spoiler]
---

# Spoiler

A restrição central do produto. Não é uma flag de UI: é uma **fronteira de dados**. O que o
nível não permite **não existe no renderer**, nem escondido, nem em memória.

## Níveis

```ts
type SpoilerLevel = 'none' | 'locations' | 'titles' | 'full'
```

| Nível | Locais | Curiosidades | Fatos revelados | Fatos não revelados | Conquistas |
|---|---|---|---|---|---|
| `none` | Só visitados, com contagem | Só as que têm fato revelado, com contagem | Contagem | Contagem | Quantas faltam, quantas "ao alcance" |
| `locations` | Todos, com contagem | Idem `none` | Contagem | Contagem | Idem |
| `titles` | Todos | Todas, com nome | Título | Título | Nome |
| `full` | Todos | Todas | Título e texto | Título e texto | Nome, descrição e todas as dicas |

Contagem inclui denominador: "12/19" mostra que existem 19 fatos em Brittle Hollow. Isso é
aceito no nível `none` porque o jogo mostra o mesmo no Ship Log de um local visitado.

## O que cada nível libera de *conteúdo*

O pacote `content` expõe três entradas separadas, e o `main` só carrega o que o nível permite:

```
@hearthian/content/structure   ids, locationId, curiosityId, entryId, arestas do grafo, totais
@hearthian/content/names       nomes de locais, curiosidades, conquistas, títulos de fatos
@hearthian/content/text        texto dos fatos, descrições e dicas de conquistas
```

| Nível | structure | names | text |
|---|---|---|---|
| `none` | ✅ | só nomes de locais e curiosidades **visitados** | ✗ |
| `locations` | ✅ | nomes de locais e curiosidades | ✗ |
| `titles` | ✅ | ✅ | ✗ |
| `full` | ✅ | ✅ | ✅ |

`text` só é importado dinamicamente quando `level === 'full'` ou quando um opt-in individual
exige. Nunca no bundle inicial do main; nunca no renderer.

## Projeção

```ts
projectView(progress: Progress, content: LoadedContent, level: SpoilerLevel): DashboardView
```

Função pura em `core`. A `View` é um tipo do `contracts` e **não tem campos opcionais que
carregam conteúdo**: no nível `none` a lista de locais é de `VisitedLocationView`
`{ id, name, facts }` e só contém visitados; a partir de `locations` é de `LocationView`
`{ id, name, visited, facts }` e contém todos. Fatos só existem na `View` a partir de `titles`
(`{ id, title, revealed, read }`) e só ganham `text` em `full`. São tipos diferentes, unidos
pelo discriminante `level`. Não existe `name?: string` que alguém esquece de apagar.

Os schemas Zod das `View`s em `packages/contracts` são estritos (`strictObject`): um campo a
mais é erro de validação nos dois lados do IPC. Um teste de tipo em `contracts` percorre as
chaves da `View` de cada nível e falha se `title`, `text`, `description` ou `hints` aparecer
onde o nível não permite.

## Subir de nível

1. Renderer envia `spoiler:request { level }`
2. Main abre diálogo nativo de confirmação com texto explícito do que passará a aparecer
3. Só depois grava no settings e reenvia a `View`

Descer de nível não pede confirmação.

## Opt-in por conquista

Independente do nível global. `achievementOptIns: Record<AchievementId, 0 | 1 | 2 | 3>` no
settings. Cada camada só abre por clique e só a próxima: não dá para pular da vaga para a
explícita. Camada 3 pede confirmação.

No nível `none`, a lista de conquistas mostra só placeholders anônimos ("Conquista #7 · ao
alcance"); o opt-in revela o nome e a camada 1 daquela conquista específica.

## Toasts

| Nível | Fato novo em local visitado | Fato novo em local não visitado |
|---|---|---|
| `none` | "Novo fato em Brittle Hollow" | "Novo fato descoberto" |
| `locations`+ | "Novo fato em Brittle Hollow" | "Novo fato em Dark Bramble" |

Nunca título nem texto no toast, em nenhum nível. Toast é para saber que algo aconteceu, não o quê.

## Como isso é garantido

1. Dependência: renderer não tem `@hearthian/content` no `package.json`
2. Lint: `no-restricted-imports` em `src/renderer/**`
3. Tipos: `View` sem campos opcionais de conteúdo; união discriminada por nível
4. Teste: `projectView` tem um teste por nível que **falha se qualquer string de `names` ou
   `text` aparecer na View de um nível que não permite**
5. Teste de build: bundle do renderer não contém uma string sentinela do pacote `content`
