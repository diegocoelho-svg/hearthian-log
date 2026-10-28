---
tags: [hearthian-log, content]
---

# Modelo de Conteúdo

Tabela estática que dá sentido aos `FACT_ID`s do save, mais o conteúdo autoral do guia de
100%. Vive em `packages/content`, é dado (JSON), validado por schema Zod, versionado. Ver
[ADR 0006](../decisions/0006-conteudo-como-dado-versionado.md).

## Fontes

| Dado | Origem | Status |
|---|---|---|
| Fatos, entradas, locais, curiosidades | XMLs do Ship Log em `sharedassets1.assets` da instalação local, via `scripts/import-ship-log.ts` | Importado (1.1.16.1372) |
| Nomes de locais e curiosidades | Tabela de tradução inglesa em `resources.assets` e `<Name>` das entradas `<IsCuriosity/>` | Importado |
| Sinais e frequências | Enum `SignalName` da `Assembly-CSharp.dll`; frequência e local autorais | Importado; frequência por prefixo, não confirmada |
| Grafo de rumores | `<SourceID>` dos `RumorFact` | Fase 2 — ver [Pendências](#pendências) |
| Lista de conquistas | Steamworks (`GetAchievementDisplayAttribute`) + Steam DB | A extrair |
| Dicas em camadas | **Autoral** | A escrever, uma conquista por vez |
| Fatos relacionados a conquista | Autoral | A escrever |

A fonte de cada arquivo fica em `packages/content/SOURCES.md` com URL, data e versão do jogo.
O que o jogo não tem — ordem, `kind` e `parentId` dos locais, cores, frequência e local dos
sinais — fica em `packages/content/scripts/ship-log-supplement.json`, fora de `data/`, para que
regerar não apague trabalho autoral.

Os locais são gravados em ordem de órbita a partir do Sol. O Ship Log do jogo é espacial no modo
mapa e não define uma lista, então essa ordem é escolha nossa e a ordem do array é a ordem de
exibição. Não existe campo `order`.

## Três entradas, três níveis de exposição

```
@hearthian/content/structure    ids, relações, totais — nunca uma string legível
@hearthian/content/names        nomes e títulos
@hearthian/content/text         texto de fato, descrição e dicas de conquista
```

Arquivos correspondentes: `data/structure/*.json`, `data/names/*.json`, `data/text/*.json`.
O que decide o que cada nível carrega está em [spoiler.md](./spoiler.md).

As três entradas exportam a mesma constante `contentBundleSentinel`. O teste de build da
Fase 1 procura essa string no bundle do renderer e falha se encontrar.

## Entidades

```ts
type Location = { id: LocationId; kind: 'planet' | 'moon' | 'station' | 'other'; parentId: LocationId | null }
type Curiosity = { id: CuriosityId; color: string }
type Entry = { id: EntryId; locationId: LocationId; curiosityId: CuriosityId | null; parentEntryId: EntryId | null }
type Fact = { id: FactId; entryId: EntryId; kind: 'explore' | 'rumor'; targets: EntryId[] }
type Signal = { id: SignalId; frequencyIndex: FrequencyIndex; locationId: LocationId | null }
type Achievement = {
  id: AchievementId
  hidden: boolean
  relatedFactIds: FactId[]
  prerequisiteFactIds: FactId[]
  order: number
}
```

`frequencyIndex` é o índice em `knownFrequencies` do save — a frequência não tem id próprio no
jogo. Os schemas são estritos: chave desconhecida é erro, para nome nenhum entrar em
`structure` por acidente.

`names`:

```ts
type LocationName = { id: LocationId; name: string }
type CuriosityName = { id: CuriosityId; name: string }
type FactTitle = { id: FactId; title: string }
type AchievementName = { id: AchievementId; name: string }
```

`text`:

```ts
type FactText = { id: FactId; text: string }
type AchievementText = {
  id: AchievementId
  description: string
  hints: [vague: string, medium: string, explicit: string]
}
```

## Regras de conteúdo autoral

- `prerequisiteFactIds`: fatos que, revelados, tornam a conquista "ao alcance". Vazio significa
  "sempre ao alcance".
- `order`: posição na ordem sugerida. Conquistas com pré-requisitos satisfeitos sobem na lista
  em runtime; `order` é o desempate.
- Dica vaga **não pode conter nome de local não visitado** — regra checada em code review, não
  por schema. Escreva "um planeta que você já visitou", não "Ember Twin".
- Dica média pode citar mecânica (Signalscope, lançador) e local já visitado.
- Dica explícita é passo a passo e pode conter tudo.

## Versionamento

`packages/content/version.json`:

```json
{ "schemaVersion": 1, "gameVersion": "1.1.15", "contentRevision": 1 }
```

- `schemaVersion` sobe quando os tipos mudam; `core` recusa conteúdo de schema desconhecido
- `gameVersion` é a versão do jogo de que o dump veio
- `contentRevision` sobe a cada mudança de dado

## Validação

`pnpm --filter content validate` roda no CI e checa:

1. Todo arquivo bate com o schema Zod
2. Toda referência (`entryId`, `locationId`, `curiosityId`, `targets`, `relatedFactIds`) existe
3. Todo `id` em `names` e `text` existe em `structure`. O contrário — todo `id` de
   `structure` coberto — é erro para locais, curiosidades e conquistas e **aviso** para
   `names/fact-titles` e `text/facts`, que só são preenchidos na Fase 2
4. Todo `FactId` visto em `packages/core/fixtures/` existe em `structure` (avisa, não falha)
5. Nenhum arquivo de `structure` contém um valor de `names` ou `text` (grep por string)

## Pendências

1. **Fato não tem título no jogo.** O XML do Ship Log dá a fato só texto; quem tem nome é a
   entrada (e alguns rumores têm `<RumorName>`). `names/fact-titles` e o nível `titles` de
   [spoiler.md](./spoiler.md) assumem um título por fato. Resolver na spec da Fase 2: título vira
   nome da entrada, `RumorName`, ou o nível muda.
2. **Direção do rumor.** No jogo o `RumorFact` fica dentro da entrada de *destino*, e
   `<SourceID>` é a entrada onde ele é encontrado. Na Fase 1, `entryId` é a entrada que contém
   o fato — é assim que o jogo conta por local — e `targets` fica vazio. O modelo do grafo
   (provavelmente `sourceEntryId` em vez de `targets`) entra com a spec da Fase 2.
