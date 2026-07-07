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

| Referência | Onde |
| --- | --- |
| Decisões, specs e riscos | [docs/](docs/README.md) |
| Marca e design system | [DESIGN.md](DESIGN.md) + [assets/brand/](assets/brand/) |
| Regras para humanos e IAs | [AGENTS.md](AGENTS.md) (canônico; `CLAUDE.md` é symlink) |
| Gestão do projeto | Plane (via MCP — ver [§Ferramentas do time](#ferramentas-do-time-mcps)) |

## Stack

| Camada | Tecnologia |
| --- | --- |
| Web | Next.js (App Router) + React + Tailwind — deploy na Vercel |
| Worker de ingestão | Node + BullMQ — Docker no Railway |
| Banco | PostgreSQL (Supabase usado como **Postgres puro**, região São Paulo) |
| Cache/filas | Redis (Railway) |
| ORM/migrations | Drizzle + drizzle-kit |
| Auth | Better Auth |
| IA | Vercel AI SDK, tools fechadas com Zod (modelo escolhido por evals) |
| Qualidade | Biome (lint+format) · vitest · Playwright · lefthook · CodeRabbit |
| Observabilidade | Sentry (erros) · pino→Axiom (logs) · Better Stack (uptime) |

## Estrutura de pastas

```
placarium-app/
├── apps/                     # o que RODA (cada pasta = um deploy próprio)
│   ├── web/                  #   site Next.js (Vercel) — UI, leituras RSC, Server Actions
│   └── ingest/               #   worker 24/7 (Railway) — único processo que fala com o provedor
├── packages/                 # o que é IMPORTADO (bibliotecas internas dos apps)
│   ├── core/                 #   domínio puro: tipos, Zod, normalizadores, fixtures — ZERO I/O
│   ├── db/                   #   Drizzle: schema, migrations, clients, queries compartilhadas
│   └── ai/                   #   tools da IA, prompts, evals (golden set)
├── e2e/                      # Playwright: jornadas de usuário
├── scripts/                  # ferramental operacional (setup, gravação de fixtures)
├── design/                   # arquivos .pen do Pencil — UIs versionadas
├── docs/                     # fundação: decisões, specs 001–020, riscos
├── assets/brand/             # logo e tokens de cor
└── .agents/                  # agentes de IA canônicos (symlink: .claude/agents)
```

Cada módulo tem um `AGENTS.md` com organização interna, convenções e exemplos
de fazer/evitar — **leia antes de mexer nele**. Direção de dependências:
`core` não depende de nada; `db` → `core`; `ai` → `db`+`core`; `web` e
`ingest` usam os packages e **nunca** um ao outro.

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

Monolito modular com **2 deployables**. Usuários leem sempre do nosso
banco/cache — nunca do provedor externo — então o custo de API é função do
calendário de jogos, não do tráfego. Migrations são **Drizzle Kit** com
expand-and-contract, aplicadas por CI em produção (nunca na mão); qualquer
mudança de schema passa pelo agente `db-migrations`. Detalhes:
[docs/06](docs/06-arquitetura-tecnica.md) · [docs/07](docs/07-system-design-e-infra.md) · [docs/08](docs/08-realtime-e-ingestao.md).

## Setup local

Pré-requisitos: **Node ≥ 22** · **pnpm ≥ 10** (`corepack enable`) · **Docker**
(Windows: Docker Desktop com WSL Integration habilitada para a distro).

```bash
git clone git@github.com:placarium/placarium-app.git && cd placarium-app
pnpm install          # dependências + hooks git (lefthook)
pnpm setup:env        # cria .env da raiz + symlinks de env dos apps
pnpm dev:services     # Postgres + Redis locais (docker compose)
pnpm db:migrate       # migrations (disponível a partir da SPEC-003)
pnpm db:seed          # seed com fixtures (idem)
pnpm dev              # web (:3000) + worker, ambos em watch
```

### Portas padrão

| Porta | Serviço |
| --- | --- |
| 3000 | apps/web (Next.js) |
| 5432 | PostgreSQL (docker compose) |
| 6379 | Redis (docker compose) |

Conflito com outro projeto? Ajuste no seu `.env` — não edite o
`docker-compose.yml`.

### Ambientes e variáveis

- **Local**: um único **`.env` na raiz** (gitignorado). Os apps leem o mesmo
  arquivo via symlinks criados pelo `pnpm setup:env` (`apps/web/.env.local` e
  `apps/ingest/.env`). Todas as chaves documentadas em
  [.env.example](.env.example). Cada app valida suas variáveis no boot com
  `env.ts` (Zod) — em dev há defaults apontando para o docker compose; em
  produção nada tem default.
- **Preview (por PR)**: Vercel cria deploy automático apontando para o
  projeto Supabase **dev**; provedor esportivo sempre `mock`.
- **Produção**: variáveis configuradas **nos painéis** (Vercel/Railway).
  ⚠️ Arquivos `.env.dev`/`.env.prod` no repositório são proibidos — segredo
  em git é vazamento esperando data.
- Chave real do provedor esportivo existe **só em produção**; dev/CI/preview
  usam `FOOTBALL_PROVIDER=mock` (fixtures reais gravadas).

### Scripts

| Comando | Faz |
| --- | --- |
| `pnpm dev` / `dev:web` / `dev:ingest` | apps em watch (juntos ou separados) |
| `pnpm dev:services` / `dev:services:down` | sobe/derruba Postgres + Redis |
| `pnpm setup:env` | `.env` raiz + symlinks (idempotente) |
| `pnpm test` | unit/integração (vitest — rápido, roda no pre-push) |
| `pnpm test:e2e` | Playwright (1ª vez: `pnpm test:e2e:install`) |
| `pnpm lint` / `lint:fix` / `format` | Biome |
| `pnpm typecheck` | tsc em todos os pacotes |
| `pnpm db:generate` / `db:migrate` / `db:seed` / `db:studio` | banco (Drizzle) |

Utilitários avulsos moram em [scripts/](scripts/README.md).

## Qualidade e fluxo de contribuição

- **Main só via PR** com CI verde (Biome → typecheck → vitest → build).
  Review humano opcional; **CodeRabbit revisa toda PR** (config em
  [.coderabbit.yaml](.coderabbit.yaml)) e todo comentário é tratado — fix ou
  resposta, nunca silêncio.
- Branch `tipo/spec-XXX-slug` · squash merge · commits em português
  explicando o porquê.
- **Testes sempre**: feature sem teste não entra.
- Hooks (lefthook): Biome no pre-commit; typecheck + test no pre-push.
- Agentes de IA (`.agents/`, symlink `.claude/agents`): `pr-manager` (ciclo
  completo de PR) · `db-migrations` (qualquer schema) · `e2e-tester`
  (Playwright + exploração via agent-browser).

## Ferramentas do time (MCPs)

Dois MCPs fazem parte do fluxo oficial e devem ser configurados por cada dev:

### Plane (gestão do projeto)

Work items, cycles e módulos do Placarium vivem no Plane. Setup no Claude
Code (servidor hospedado, OAuth no navegador na primeira chamada):

```bash
claude mcp add --transport http plane https://mcp.plane.so/http/mcp
```

Alternativa com token (fluxos automatizados): gere um token em *Workspace
Settings → Access Tokens* e use `claude mcp add-json` com a URL
`https://mcp.plane.so/http/api-key/mcp` e headers `x-api-key` +
`x-workspace-slug` (doc oficial: developers.plane.so/dev-tools/mcp-server).
Verifique com `claude mcp list` ou `/mcp` dentro da sessão.

### Pencil (design de UI)

As UIs nascem como arquivos **`.pen`** em [design/](design/README.md),
versionados no repo e **anexados ao work item correspondente no Plane**.
Setup: instale o app do [pencil.dev](https://docs.pencil.dev/getting-started/ai-integration)
— o MCP é configurado automaticamente na instalação; confirme com `/mcp`
(deve listar `pencil` como conectado). Regras: `.pen` só é lido/editado via
MCP (nunca como texto), e o fluxo design→código usa os tokens de
`assets/brand/tokens/` — nada de hex inventado.

## Deploy

| Peça | Onde | Como |
| --- | --- | --- |
| `apps/web` | Vercel | Preview por PR; produção no merge da main |
| `apps/ingest` | Railway | Docker ([apps/ingest/Dockerfile](apps/ingest/Dockerfile), contexto = raiz) |
| Postgres | Supabase (São Paulo) | Projetos **dev** e **prod** separados; migrations só via Drizzle/CI |
| Redis | Railway | Mesmo projeto do worker |
| Observabilidade | Sentry · Axiom · Better Stack | DSNs via env dos painéis |

Checklist de contas (uma vez, pelo time): Vercel · Railway · Supabase
(dev+prod) · Sentry · Axiom · Better Stack · app do CodeRabbit na org ·
Plane workspace. Estratégia completa de ambientes:
[docs/07 §8.3](docs/07-system-design-e-infra.md).
