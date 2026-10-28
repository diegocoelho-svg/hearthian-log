# Fontes

Cada arquivo de `data/` registra aqui de onde veio, com URL, data de acesso e versão do jogo.

| Arquivo | Fonte | Acesso | Versão do jogo |
|---|---|---|---|
| `data/structure/locations.json` | Ids: XMLs do Ship Log (abaixo). Ordem, `kind` e `parentId`: autoral, em `scripts/ship-log-supplement.json` | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/structure/curiosities.json` | Ids: XMLs do Ship Log. Ordem e `color`: autoral, no suplemento | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/structure/entries.json` | XMLs do Ship Log | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/structure/facts.json` | XMLs do Ship Log | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/structure/signals.json` | Ids: enum `SignalName` da `Assembly-CSharp.dll`. `frequencyIndex` e `locationId`: autoral, no suplemento | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/names/locations.json` | Tabela de tradução inglesa (`table_ui`), pela `uiTextKey` do suplemento | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/names/curiosities.json` | `<Name>` da entrada marcada `<IsCuriosity/>` nos XMLs do Ship Log | 2026-10-27 | 1.1.16.1372 (Steam) |
| `data/structure/achievements.json` | — Fase 3 | — | — |
| `data/names/fact-titles.json`, `data/names/achievements.json` | — Fase 2 e 3 | — | — |
| `data/text/*.json` | — Fase 2 | — | — |

## Como regerar

```
pnpm --filter @hearthian/content import:ship-log --game "<pasta do Outer Wilds>"
```

O script lê a instalação local do jogo e só escreve `data/structure/{locations,curiosities,entries,facts,signals}.json`
e `data/names/{locations,curiosities}.json`. Os XMLs e a tabela de tradução não entram no
repositório. Rodar duas vezes sobre a mesma instalação gera os mesmos arquivos.

| Origem | Arquivo do jogo | O que tem |
|---|---|---|
| XMLs do Ship Log | `OuterWilds_Data/sharedassets1.assets` | 14 `<AstroObjectEntry>` em texto puro: entradas, aninhamento, curiosidade, fatos |
| Tabela de tradução inglesa | `OuterWilds_Data/resources.assets` | `TranslationTable_XML` cujo `table_shipLog` mapeia os nomes das curiosidades para eles mesmos |
| Enums de sinal e frequência | `OuterWilds_Data/Managed/Assembly-CSharp.dll` | Lidos uma vez por reflection; o resultado está no suplemento |

## Não confirmado

- **`frequencyIndex` dos sinais** vem do prefixo do enum (`Traveler_*` → 1, `Quantum_*` → 2,
  `EscapePod_*` → 3, `WhiteHole_*` → 4, `HideAndSeek_*` → 5, `RadioTower`/`MapSatellite` → 6),
  com os índices de `AudioSignal.FrequencyToIndex`. O valor real está no componente da cena.
  Duvidosos: `Traveler_Nomai` (15), `Traveler_Prisoner` (16) e `HideAndSeek_*`. Num save real,
  60 e 61 aparecem conhecidos com a frequência 5 ainda desconhecida.
- **`locationId` dos sinais** vem do código no nome do enum ou do viajante. `MapSatellite`
  fica `null`.
- **Cores das curiosidades** são autorais. O jogo tem as próprias, na cena; não foram extraídas.
- **`BH_BLACK_HOLE_FORGE_X2`** existe nos saves, mas em nenhum arquivo do jogo 1.1.16. É fato
  antigo: cai em `unknownFactIds`.
