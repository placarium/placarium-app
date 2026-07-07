## O que muda

<!-- resumo objetivo do que esta PR faz -->

## Por quê

<!-- contexto/motivação; referencie a spec: SPEC-XXX (docs/13) -->

## Como testar

<!-- passos para validar localmente -->

## Checklist

- [ ] Testes cobrindo o comportamento novo/alterado
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes localmente
- [ ] Convenções dos AGENTS.md dos módulos tocados respeitadas
- [ ] Mudança de schema? Feita via agente `db-migrations` (expand-and-contract)
- [ ] Sem segredo/`.env`/hex hardcoded no diff
- [ ] Comentários do CodeRabbit tratados (fix ou resposta)
