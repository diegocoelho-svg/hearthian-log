---
name: hearthian-testing
description: Regra de teste do Hearthian Log — Vitest, o que é obrigatório e o que não é. Use ao escrever ou revisar parser, diff, progress, projeção de spoiler, watcher, locator, schema de conteúdo ou qualquer lógica em apps/desktop.
---

# Hearthian Log — Teste

## O que é obrigatório

| Onde | O quê | Por quê |
|---|---|---|
| `packages/core/src/save/` | `parseSave` contra cada fixture; `diffSnapshots` para cada `SaveEvent` | É a fonte da verdade |
| `packages/core/src/progress/` | Contagens por local, curiosidade, geral, não lidos | É o que o jogador vê |
| `packages/core/src/spoiler/` | **Um teste por nível** que serializa a `View` e falha se achar string de `names`/`text` proibida | É a promessa do produto |
| `packages/core/src/achievements/` | Reachability e ordem sugerida | Lógica de negócio |
| `packages/save-io/` | Locator com fs em tmp dir; watcher com escrita em duas etapas, hash igual, arquivo sumindo | É onde o mundo real morde |
| `packages/content/` | `validate` roda como teste; schemas rejeitam fixtures inválidas | CI barra conteúdo quebrado |
| `apps/desktop/src/main/settings/` | Defaults, migração, escrita atômica | Corromper settings trava o app |
| `apps/desktop/src/main/ipc/` | Handler rejeita payload inválido; `spoiler:request` não muda nada sem confirmação | Porta de exposição |
| Build | Bundle do renderer não contém sentinela do `content` | Última linha de defesa |

## O que não é obrigatório

- Componente React sem lógica. Hook com lógica (`useSpoilerLevel`, `useToastQueue`) é.
- Código de janela (`new BrowserWindow(...)`). É configuração.
- E2E com Electron (Playwright). Decisão adiada; ADR quando fizer sentido.

Na dúvida: se o código decide um valor, um nível ou um evento, testa. Se só renderiza ou
configura, não.

## Como

- **Vitest**, colocado ao lado do arquivo: `parseSave.ts` → `parseSave.test.ts`. Sem pasta
  `__tests__/`.
- `vitest.config.ts` de cada pacote só reexporta `@hearthian/config/vitest.base`.
- `pnpm test` na raiz roda tudo via turbo; `pnpm --filter core test` roda um pacote.
- **Sem comentário nos testes.** O nome do `it` é a documentação.

### Testando `core` — sem mock, é lógica pura

```ts
import { describe, expect, it } from "vitest";
import { parseSave } from "./parseSave.js";
import early from "../../fixtures/early.json";

describe("parseSave", () => {
  it("marks facts with a reveal order as revealed", () => {
    const snapshot = parseSave(JSON.stringify(early));
    expect(snapshot.facts.get(factId("TH_VILLAGE_X1"))?.revealed).toBe(true);
  });

  it("returns a partial-write error for truncated json", () => {
    const result = parseSave(JSON.stringify(early).slice(0, 200));
    expect(result).toMatchObject({ kind: "partial-write" });
  });
});
```

### Testando projeção — o teste que protege o produto

```ts
describe("projectView at level none", () => {
  it("never includes a name of an unvisited location", () => {
    const view = projectView(progress, contentWithoutText, "none");
    const serialized = JSON.stringify(view);
    for (const name of unvisitedLocationNames) {
      expect(serialized).not.toContain(name);
    }
  });
});
```

### Testando watcher — fs real em tmp dir

```ts
it("emits one snapshot after a two-step write", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hearthian-"));
  const file = join(dir, "data.owsave");
  const events: WatchEvent[] = [];
  const stop = watchSave(file, (event) => events.push(event), { stabilityThreshold: 50 });

  await writeFile(file, fixtureText.slice(0, 100));
  await writeFile(file, fixtureText);
  await waitFor(() => events.length === 1);

  stop();
  expect(events[0]).toMatchObject({ kind: "snapshot" });
});
```

### Testando IPC — handler isolado, Electron mockado no limite

Mock só `dialog.showMessageBox`. O handler é uma função que recebe dependências; teste a
função, não o `ipcMain`.

## Nunca

- Mock de `core` num teste de `core`
- Teste que só repete a implementação
- Fixture com nome de perfil ou caminho real
- `it.skip` para "arrumar depois"
