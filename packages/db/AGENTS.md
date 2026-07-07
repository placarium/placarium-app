# packages/db — Schema, migrations e acesso a dados

Drizzle ORM sobre Postgres (Supabase usado como **Postgres puro**). Fonte de
verdade do schema descrita em `docs/05-modelo-de-dados.md`.

## Regra nº 1

**Qualquer mudança de schema passa pelo agente `db-migrations`** — ele carrega
o checklist completo (expand-and-contract, proveniência, verificação). Este
arquivo resume; o agente detalha.

## O que mora aqui

- `src/schema/` — tabelas por área (core, ingest, app, analytics)
- `migrations/` — SQL gerado pelo drizzle-kit (imutável após aplicado)
- `src/client.ts` — dois clients: pooler (web/serverless, **sem prepared
  statements** — Supavisor transaction mode) e conexão direta (worker)
- `src/queries/` — queries compartilhadas entre web e worker
- `seed/` — dados de referência + uma rodada de fixtures

## Convenções

- snake_case; PK `uuid` v7; `timestamptz`; enums Postgres para domínios
  fechados; FK sempre indexada.
- Tabela de fato esportivo → `source_provider_id`, `source_fetched_at`,
  `confidence` NOT NULL. Sem exceção, sem "depois eu adiciono".
- Agregado = view materializada com `computed_at` + `formula_version` no
  schema `analytics`. Nunca crie escrita manual em agregado.
- Query complexa reutilizada → função tipada em `src/queries/`, testada.
  Query de uso único pode viver no chamador.
- Migrations: aditiva primeiro; destrutiva só em migration posterior e com
  confirmação explícita (regra do agente).

## Fazer / Evitar

- ✅ `drizzle-kit generate` + revisão do SQL gerado antes de commitar
- ❌ Editar migration já aplicada (em qualquer ambiente) — roll-forward
- ❌ Mudança de schema pelo dashboard do Supabase ou via supabase-js
- ❌ RLS, triggers "espertos", stored procedures — lógica fica no código
- ✅ Teste que valida constraint nova (inserção inválida deve falhar)
