# scripts/ — ferramental operacional

Scripts utilitários do projeto (setup, exploração, operação). **Não são código
de produto**: nada aqui é importado pelos apps/packages.

## Regras de higiene

1. Script que virar código de produto **migra** para o app/package dono.
2. Script one-shot que já cumpriu o papel: **delete** (o git history guarda).
3. Todo script tem cabeçalho explicando o que faz e como rodar.
4. `.mjs` roda com `node scripts/x.mjs`; `.ts` roda com `pnpm dlx tsx scripts/x.ts`.

## Scripts atuais

| Script | Faz | Rodar |
| --- | --- | --- |
| `setup-env.mjs` | Cria `.env` da raiz (a partir do example) + symlinks de env dos apps | `pnpm setup:env` |
| `record-fixtures.ts` | Grava respostas reais do provedor como fixtures em `packages/core/fixtures/` | aguarda SPEC-004 (chave trial) |
