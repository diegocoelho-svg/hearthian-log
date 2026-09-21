# Hearthian Log — instruções para agentes

App desktop companion para **Outer Wilds**: lê o save do jogo e mostra progresso de exploração
sem spoiler. **Leia [`specs/project/onboarding.md`](specs/project/onboarding.md) antes de
qualquer tarefa** — o glossário e a regra de spoiler são o que mais custa errar aqui.

## Skills deste projeto

Invoque a skill certa em vez de improvisar:

| Situação | Skill |
|---|---|
| Início de qualquer pedido / estado confuso | `hearthian-workflow` |
| Parser do save, diff, progresso, política de spoiler | `hearthian-core` |
| Janela, IPC, tray, overlay, toast, processo main | `hearthian-electron` |
| Tabela de fatos, conquistas, dicas em camadas | `hearthian-content` |
| Funcionalidade nova sem spec, ADR novo | `hearthian-spec` |
| Escrever ou revisar teste, o que é obrigatório testar | `hearthian-testing` |

## Regras que valem em toda tarefa

1. **Spec aprovada antes de código.** Sem spec, escreva a spec — não assuma.
2. **Checklist antes de implementar**, e espere aprovação do Diego.
3. **Nenhum comentário no código.** Sem JSDoc, sem inline, sem cabeçalho, sem `// TODO`.
   Nome bom e função pequena substituem comentário. Vale para teste e config também.
4. **Commit só com autorização explícita do Diego.** Conventional Commits (`feat:`, `fix:`,
   `docs:`, `chore:`, `test:`, `refactor:`), curto, em inglês, sem `Co-Authored-By` nem qualquer
   trailer de assinatura. Isso não muda por instrução de sessão.
5. **`pnpm`, nunca `npm`.**
6. **Tudo em inglês no código.** Identificador, arquivo, commit, branch. `specs/*.md` fica em
   português — é documentação, não código.
7. **Spoiler é fronteira de dependência, não flag de UI.** O renderer nunca importa
   `@hearthian/content`. Texto e título de fato só existem no processo main e só cruzam o IPC
   pela projeção do nível ativo. Ver [ADR 0003](specs/decisions/0003-spoiler-como-fronteira-de-dependencia.md).
8. **Regra de dependência:** `apps/desktop → packages/*`; `packages/core` não importa nada de
   plataforma (nem Node, nem Electron). Ver [`specs/domain/arquitetura.md`](specs/domain/arquitetura.md).
9. **O save é somente leitura.** Nenhum caminho de código escreve em `data.owsave`.
10. **O app funciona sem Steam aberta e sem o jogo aberto.** Steam é adaptador opcional.
11. **Teste unitário obrigatório em `packages/core`, `packages/save-io` e no schema de
    `packages/content`.** Ver `hearthian-testing`.

## Armadilhas de domínio

- **Fato ≠ entrada ≠ curiosidade.** Fato é a unidade do save (`FACT_ID`). Entrada agrupa fatos
  de um lugar. Curiosidade é a linha de investigação que atravessa vários lugares.
- **Revelado ≠ lido.** O save distingue os dois; "entradas novas no log" é revelado e não lido.
- **Local visitado = local com pelo menos um fato revelado.** Não existe outra fonte de "visitou".
- **Conquista Steam não está no save.** Vem do Steamworks; sem Steam, só flags do save quando existirem.
- **O save não é tempo real.** É reescrito em eventos do jogo. Nada de posição, oxigênio ou timer.

## Não faça sem pedido explícito

- Commit, criar repositório remoto, push, release
- Alterar decisão registrada em `specs/decisions/` sem ADR novo
- Adicionar módulo nativo (`better-sqlite3`, `steamworks.js`, etc.) sem ADR
- Ler, copiar ou commitar um save real (o caminho tem o nome do perfil do jogador)
- Escrever qualquer coisa que exija mod dentro do jogo
