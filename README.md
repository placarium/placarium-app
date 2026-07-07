<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/wordmark/placarium-wordmark-dark.svg">
    <img src="assets/brand/wordmark/placarium-wordmark-light.svg" alt="Placarium" width="360">
  </picture>
</p>

<p align="center"><em>O observatório do futebol — tudo que acontece em campo, com fonte, timestamp e nível de confiança.</em></p>

**Placarium** é uma plataforma web de dados, analytics e IA para futebol:
jogos ao vivo, histórico auditável, estatísticas cruzadas por múltiplas
dimensões (time, jogador, árbitro, estádio, campeonato, confronto) e uma
camada de IA conversacional que **nunca inventa estatística** — toda resposta
vem de ferramentas que consultam dados rastreáveis.

- 📚 **Decisões e specs**: [docs/](docs/README.md) · 🎨 **Marca/UI**: [DESIGN.md](DESIGN.md)
- 🤖 **Regras para humanos e IAs**: [AGENTS.md](AGENTS.md) (canônico; `CLAUDE.md` é symlink)

## Estrutura de pastas

```
placarium-app/
├── apps/
│   ├── web/          # Next.js (App Router): UI + leituras (RSC) + mutações (Server Actions)
│   └── ingest/       # Worker Node/BullMQ: único processo que fala com o provedor de dados
├── packages/
│   ├── core/         # Domínio puro (tipos, Zod, normalizadores, fixtures) — zero I/O
│   ├── db/           # Drizzle: schema, migrations, client, queries compartilhadas
│   └── ai/           # Tools da IA, camada semântica, prompts, evals (golden set)
├── e2e/              # Playwright: jornadas de usuário
├── docs/             # Fundação: decisões, specs 001–020, riscos → docs/README.md
├── assets/brand/     # Logo e tokens de cor (fonte de verdade: DESIGN.md)
└── .agents/          # Agentes de IA canônicos (symlink: .claude/agents)
```

Cada módulo tem um `AGENTS.md` próprio com convenções e exemplos — leia antes
de mexer nele.

## Arquitetura

```
usuário ⇄ web (Vercel): RSC lê Postgres · actions mutam · /api/live lê Redis
                                  ▲                                ▲
                       Postgres (Supabase SP, puro)          Redis (Railway)
                                  ▲                                ▲
        ingest (Railway, Docker): poll provedor → raw_snapshot → normaliza (core)
             → upsert com dedup → recalcula agregados (MVs) → snapshot no cache
IA: /api/chat → tools fechadas (packages/ai) → resposta com fontes e confiança
```

Monolito modular com **2 deployables**: o site (serverless, Vercel) e o worker
de ingestão (container, Railway). Usuários leem sempre do nosso banco/cache —
nunca do provedor externo — então o custo de API é função do calendário de
jogos, não do tráfego. Detalhes: [docs/06](docs/06-arquitetura-tecnica.md) e
[docs/07](docs/07-system-design-e-infra.md).

**Stack**: pnpm workspaces · Next.js/React · Node + BullMQ · PostgreSQL
(Supabase como Postgres puro) · Redis · Drizzle · Better Auth · AI SDK ·
Biome · vitest · Playwright.

## Setup local

Pré-requisitos: **Node ≥ 22**, **pnpm ≥ 10** (`corepack enable`), **Docker**
(no Windows/WSL: Docker Desktop com WSL Integration habilitada).

```bash
git clone git@github.com:placarium/placarium-app.git && cd placarium-app
pnpm install            # dependências + hooks (lefthook)
cp .env.example .env    # preencha conforme necessário
pnpm dev:services       # Postgres + Redis locais (docker compose)
pnpm db:migrate         # migrations (disponível a partir da SPEC-003)
pnpm db:seed            # seed de referência (idem)
pnpm dev                # web (localhost:3000) + worker em watch
```

### Scripts

| Comando                          | Faz                                           |
| -------------------------------- | --------------------------------------------- |
| `pnpm dev` / `dev:web` / `dev:ingest` | apps em watch (juntos ou individualmente) |
| `pnpm dev:services` / `dev:services:down` | sobe/derruba Postgres + Redis locais  |
| `pnpm test`                      | testes unit/integração (vitest, rápido)       |
| `pnpm test:e2e`                  | Playwright (antes, 1×: `pnpm test:e2e:install`) |
| `pnpm lint` / `pnpm lint:fix`    | Biome check (sem/com autofix)                 |
| `pnpm format` / `format:check`   | Biome format                                  |
| `pnpm typecheck`                 | tsc em todos os pacotes                       |
| `pnpm db:*`                      | generate · migrate · seed · studio            |

### Variáveis de ambiente

Documentadas em [.env.example](.env.example). Regras: `FOOTBALL_PROVIDER=mock`
em dev/CI (chave real de provedor **só em produção**); nunca commitar `.env`.

## Qualidade e fluxo de contribuição

- **Main só via PR** com CI verde (Biome → typecheck → vitest → build).
  Review humano opcional; **CodeRabbit** revisa toda PR e os comentários são
  sempre tratados. Branch: `tipo/spec-XXX-slug`; squash merge; commits em pt.
- **Testes sempre**: feature sem teste não entra.
- Hooks locais (lefthook): Biome no pre-commit; typecheck+test no pre-push.
- Agentes de IA do projeto (`.agents/`): `pr-manager` (ciclo de PR),
  `db-migrations` (qualquer schema), `e2e-tester` (E2E + agent-browser).

## Deploy e serviços

| Peça | Onde | Como |
| --- | --- | --- |
| `apps/web` | Vercel | Preview automático por PR; produção no merge da main |
| `apps/ingest` | Railway | Docker ([apps/ingest/Dockerfile](apps/ingest/Dockerfile), contexto = raiz) |
| Postgres | Supabase (região São Paulo) | Projetos separados dev e prod; migrations só via Drizzle |
| Redis | Railway | Mesmo projeto do worker |
| Observabilidade | Sentry (erros) · pino→Axiom (logs) · Better Stack (uptime) | DSNs via env |

Setup de contas pendente (checklist): Vercel + Railway + Supabase (dev/prod) +
Sentry + Axiom + Better Stack + instalação do app do CodeRabbit na org.
Ambientes e estratégia completa: [docs/07](docs/07-system-design-e-infra.md).
