# ADR 0005 — Steam é adaptador opcional

**Status:** aceito
**Data:** 2026-09-18

## Contexto

O estado das conquistas não está no save; vem do Steamworks. A técnica do
SteamAchievementNotifier (`steamworks.js`, `init(753640)`, consultar `achievement.isActivated`)
funciona, mas exige a Steam aberta e faz a Steam registrar o app como "jogando Outer Wilds".

O briefing exige que o app funcione sem Steam, só com o save. A versão Epic do jogo não tem
Steamworks. E `steamworks.js` é módulo nativo, o que pesa no build.

## Decisão

`AchievementSource` é uma **interface em `packages/core`**:

```ts
interface AchievementSource {
  readonly kind: 'steam' | 'none'
  list(): Promise<readonly AchievementState[]>
  subscribe(listener: (states: readonly AchievementState[]) => void): () => void
}
```

`packages/steam` implementa `SteamworksAchievementSource` e `NullAchievementSource`. O `main`
escolhe no bootstrap conforme a Steam esteja rodando e a loja detectada, e troca em runtime.

Todo o resto (checklist, dicas, "ao alcance", ordem sugerida) funciona a partir de
`AchievementState[]`, e com `NullAchievementSource` mostra estado "desconhecido" em vez de
"faltando".

## Consequências

- Funciona sem Steam e na versão Epic: só perde o checklist de conquistas, e diz isso na UI.
- `steamworks.js` fica isolado num pacote. Se quebrar num build, o app segue com `Null`.
- O poll de conquistas só roda com `kind === 'steam'` e com intervalo largo (30 s ou mais):
  conquista não é frequente.
- A Steam vai mostrar "jogando Outer Wilds" enquanto a fonte estiver ativa. Documentado no
  README e desligável no settings.
- Flags do save podem servir de fallback para algumas conquistas; isso fica em `content`
  (`achievement.saveFlag?`), avaliado caso a caso quando o save real for inspecionado.

## Alternativas rejeitadas

| Alternativa | Por que não |
|---|---|
| Steam Web API | Exige API key do usuário e perfil público; latência de minutos |
| Só flags do save | Cobre poucas conquistas; a maioria não tem flag |
| Exigir Steam | Contraria o briefing; exclui Epic |
