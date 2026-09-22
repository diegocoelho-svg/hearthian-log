# Como trabalhamos

Projeto pessoal de portfólio. Estas regras existem para o código ser apresentável e para a
colaboração com agentes não sair do controle.

## A regra principal

**Spec aprovada antes de código.** Se o que você vai construir não está em `specs/`, pare:
escreva a spec (a skill `hearthian-spec` diz como) e peça aprovação ao Diego.

Corolário: **checklist antes de implementar.** Apresente o plano do que vai mexer e espere o ok.

## Decisões

As decisões estão em [`specs/decisions/`](specs/decisions/). **Contrariar uma exige um ADR
novo** que a substitua, com o contexto que mudou. Não altere a decisão antiga em silêncio.

## Git

- **Branch por fase/tarefa.** Nada direto na `main`. Worktrees gerenciadas pelo Orca.
- **Commit só com autorização explícita do Diego.** Nunca por iniciativa própria.
- **Conventional Commits:** `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`. Curto, em
  inglês. Sem `Co-Authored-By`, sem trailer de assinatura.
- Commit no fim de um trabalho coeso, não a cada arquivo salvo.
- Se a mudança afeta comportamento documentado, **atualize a spec no mesmo commit**.

## Código

- **Sem comentário. Nenhum.** JSDoc, inline, cabeçalho de arquivo, `TODO`, `eslint-disable`
  com explicação — nada disso. Se o código precisa de comentário, ele precisa de um nome
  melhor ou de uma função menor. Vale para teste e config.
- **Tudo em inglês:** identificador, arquivo, pasta, commit, branch. `specs/*.md` em português.
- **`pnpm`, nunca `npm`.** Dependência de app instala no app: `pnpm --filter desktop add x`.
  Na raiz só ferramenta de repo.
- **Regra de dependência:** ver [Arquitetura](specs/domain/arquitetura.md). `packages/core`
  não importa Node nem Electron. O renderer não importa `@hearthian/content`.
- Não otimize sem medir. O app fica em segundo plano — o que importa é RAM ociosa e não
  competir com o jogo.

## Save do jogo

- O save é **somente leitura**.
- Save real tem o nome do perfil do jogador no caminho. **Nunca commitar save real.** Fixtures de teste vivem em
  `packages/core/fixtures/` anonimizadas; saves reais ficam em `fixtures/private/`, ignorado.

## Quando parar e perguntar

- A tarefa cresceu no meio
- Duas specs se contradizem
- Um campo do save não bate com o que a spec assume
- A mudança faz conteúdo do jogo (nome, título, texto) aparecer num nível de spoiler que não
  permite
- Você precisaria de um módulo nativo novo
