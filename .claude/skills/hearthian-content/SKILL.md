---
name: hearthian-content
description: Como adicionar ou alterar dados em packages/content do Hearthian Log — tabela de fatos, locais, curiosidades, grafo de rumores, sinais, conquistas e dicas em camadas. Use ao mexer em qualquer JSON de conteúdo, no schema, no validate ou no SOURCES.md.
---

# Hearthian Log — Conteúdo

Ler antes: `specs/domain/content-model.md` e `specs/domain/spoiler.md`.

## Estrutura

```
packages/content/
├── data/
│   ├── structure/    locations.json, curiosities.json, entries.json, facts.json, signals.json, achievements.json
│   ├── names/        locations.json, curiosities.json, fact-titles.json, achievements.json
│   └── text/         facts.json, achievements.json
├── src/
│   ├── schemas/      um schema Zod por arquivo
│   ├── structure.ts  entrada pública: só ids e relações
│   ├── names.ts      entrada pública: nomes e títulos
│   ├── text.ts       entrada pública: texto e dicas
│   └── validate.ts   script do CI
├── version.json
└── SOURCES.md
```

## Regras

- **`structure/` nunca contém string legível.** Só ids, enums e números. O `validate` faz grep
  cruzado com `names` e `text` e falha se achar.
- **Toda mudança de dado sobe `contentRevision`.** Mudança de tipo sobe `schemaVersion` e exige
  ajuste em `core/src/content/`.
- **Toda fonte externa entra em `SOURCES.md`** com URL, data de acesso e versão do jogo.
- **Ids são os do jogo.** `FactId` é o `FACT_ID` do save, sem renomear. `AchievementId` é o
  API name do Steamworks.
- **Rode `pnpm --filter content validate` antes de pedir revisão.**

## Escrevendo dica em camadas

Três camadas por conquista, nesta ordem, cada uma abre só depois da anterior:

| Camada | Pode conter | Não pode conter |
|---|---|---|
| 1 vaga | "um planeta que você já visitou", "envolve o Signalscope" | Nome de local, nome de personagem, nome de objeto único |
| 2 média | Mecânica, nome de local **se `prerequisiteFactIds` garante que foi visitado** | Passo a passo, nome de objeto único |
| 3 explícita | Tudo | — |

Checklist antes de salvar uma dica:

- [ ] A camada 1 faz sentido para alguém que só jogou 2 horas?
- [ ] A camada 2 cita algum local? Ele está coberto por `prerequisiteFactIds`?
- [ ] A camada 3 é executável sem consultar wiki?
- [ ] `relatedFactIds` lista os fatos do Ship Log que a conquista revela ou exige?

## Ordem sugerida

`order` é desempate estático. Em runtime, `core` sobe conquistas cujos `prerequisiteFactIds`
estão todos revelados. Ao definir `order`, pense: "sem saber nada, qual dá para fazer primeiro?"

## Nunca

- Colocar nome, título ou texto em `structure/`
- Renomear id do jogo para "ficar bonito"
- Importar `content/text` de qualquer lugar que não seja o `ContentLoader` do main
- Comentário no código ou no JSON (JSON não tem, e não vamos inventar campo `_comment`)
