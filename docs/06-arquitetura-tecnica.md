# 7. Arquitetura técnica

## Decisão central: monolito modular em monorepo

Dois deployables, um repositório, pacotes compartilhados. Microsserviços estão
descartados até haver dor real (equipes múltiplas ou perfis de carga
irreconciliáveis).

```
sumula/  (pnpm workspaces)
├── apps/
│   ├── web/        # Next.js 15+ (App Router) — UI + API de leitura + rotas de IA
│   └── ingest/     # Worker Node persistente — BullMQ: polling, consolidação, agregados
├── packages/
│   ├── db/         # Drizzle: schema, migrations, client
│   ├── core/       # Domínio: tipos, Zod schemas, normalizadores payload→eventos (funções puras)
│   └── ai/         # Tools da IA + camada semântica (queries parametrizadas)
└── docs/
```

**Por que dois deployables**: o worker precisa de processo persistente
(polling contínuo, conexões BullMQ) — incompatível com serverless puro. A web
se beneficia de serverless/edge (tráfego em picos de jogo). Separar os dois é
a única fronteira de deploy que o MVP precisa.

## Stack e justificativas

| Camada | Escolha | Por quê | Alternativa considerada |
|---|---|---|---|
| Frontend/SSR | Next.js 15+ App Router, TypeScript estrito | SSR/ISR para SEO e cache; RSC reduz JS no cliente; ecossistema | Remix/TanStack Start — viáveis, menor ecossistema de AI SDK |
| UI | Tailwind + shadcn/ui + Recharts | Velocidade de um dev solo; componentes acessíveis | Mantine |
| API de leitura | Route handlers + Server Actions no próprio Next | Evita 3º deployable; leitura é o caso dominante | Fastify separado — só se a API pública B2B virar produto |
| Worker | Node + BullMQ | Filas com retry/backoff/repeatable jobs maduras; mesma linguagem | Temporal (poderoso, pesado demais); cron puro (sem retry/observabilidade) |
| Banco | PostgreSQL 16 (Neon) | Modelo relacional forte, MVs, pg_trgm; Neon: branching por PR | Supabase (bom, mas acopla auth/realtime que resolvemos melhor de outro jeito) |
| ORM | Drizzle | SQL-first, migrations explícitas, tipos exatos, leve no worker | Prisma (DX boa, mas engine mais pesada e SQL menos transparente) |
| Cache/filas | Redis (Railway, mesmo projeto do worker) | BullMQ exige Redis com conexão persistente — **Upstash serverless não serve para BullMQ** | — |
| Auth | Better Auth | Magic link + OAuth simples, dono da tabela de users no nosso Postgres | Auth.js, Clerk (custo/lock-in) |
| IA | Vercel AI SDK + Claude (Sonnet como padrão; Haiku para triagem de intenção) | Tool calling tipado com Zod, streaming pronto no App Router | LangChain (abstração excessiva para tools fechadas) |
| Observabilidade | Sentry (erros) + pino→Axiom (logs) + Better Stack (uptime) | Cobertura essencial com setup de horas | OTel completo — V1+ |
| CI/CD | GitHub Actions + deploy nativo Vercel/Railway | Zero manutenção de runner | — |

## Diagrama

```
                    ┌─────────────────────────────────────────────┐
                    │                  USUÁRIO                     │
                    └────────────┬────────────────────────────────┘
                                 │ HTTPS (CDN Vercel)
                    ┌────────────▼────────────────────────────────┐
                    │  apps/web — Next.js (Vercel)                 │
                    │  RSC/ISR │ API leitura │ /api/chat (AI SDK)  │
                    └───┬──────────────┬──────────────┬───────────┘
                  leitura│        cache│         tools│
                    ┌────▼─────┐  ┌────▼────┐   ┌─────▼──────────┐
                    │ Postgres │  │  Redis   │   │ packages/ai    │
                    │  (Neon)  │  │(Railway) │   │ camada semânt. │──► Claude API
                    │ core+MVs │  │live+cache│   │ queries fechad.│
                    └────▲─────┘  └────▲────┘   └────────────────┘
                   writes│      publica│estado
                    ┌────┴─────────────┴──────────────────────────┐
                    │  apps/ingest — Worker BullMQ (Railway)       │
                    │  discover │ poll_live │ consolidate │ aggreg.│
                    └────────────────────┬────────────────────────┘
                                         │ HTTPS polling (+webhooks se houver)
                    ┌────────────────────▼────────────────────────┐
                    │       PROVEDOR DE DADOS ESPORTIVOS           │
                    └─────────────────────────────────────────────┘
        Sentry ◄─ erros (web+worker)   Axiom ◄─ logs   Better Stack ◄─ uptime
```

## Fluxos principais

- **Leitura de página**: RSC consulta Postgres (ou cache) no servidor →
  HTML cacheado por ISR → revalidação por tag quando o worker escreve.
- **Ao vivo**: worker polla provedor → normaliza (`packages/core`) → grava
  Postgres → publica snapshot leve no Redis → cliente polla
  `/api/live/:matchId` (servido do Redis, ETag) a cada 10–20 s.
- **IA**: `/api/chat` → AI SDK com tools de `packages/ai` → tools executam
  queries parametrizadas → resposta com fontes → log em `ai_query/ai_answer`.
- **Consolidação**: T+2 h e T+24 h re-fetch completo → diff contra o gravado →
  correções auditadas → refresh das MVs → revalidação de tags do Next.

## Autenticação e autorização

- Better Auth com adapter Drizzle (tabela `user` nossa — doc 05).
- Sessões via cookie httpOnly; middleware do Next protege rotas de conta/IA.
- RBAC mínimo: `user` | `admin`. Admin = rotas `/admin` + checagem server-side.

## Ambientes e CI/CD (detalhado no doc 07)

- PR → lint + typecheck + testes + preview deploy (Vercel) com branch de banco
  (Neon).
- `main` → staging implícito? Não: MVP usa **preview + produção** apenas
  (justificativa no doc 07 §8.3).
- Migrations: `drizzle-kit` gera SQL revisável; aplicadas por step de CI antes
  do deploy; padrão expand-and-contract (doc 07 §8.5).
