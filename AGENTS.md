# Placarium

Plataforma de dados, analytics e IA para futebol — o observatório onde cada
número tem **fonte, timestamp e nível de confiança**. Essa promessa tem
precedência sobre qualquer atalho técnico: na dúvida entre conveniente e
auditável, escolha auditável.

## Contexto agnóstico de ferramenta (REGRA)

O time (Luis + Isaque) usa ferramentas de IA diferentes. Para consistência:

- **Fonte canônica**: `AGENTS.md` (raiz e em cada módulo) e `.agents/`
  (definições de agentes). `CLAUDE.md` e `.claude/agents` são **symlinks**
  para os canônicos — nunca edite o lado do symlink.
- Todo artefato de contexto novo (regra, agente, command) nasce agnóstico no
  canônico e ganha symlink para a pasta específica da ferramenta.
- Ao criar módulo/pasta com convenção própria, crie o `AGENTS.md` dela junto
  (+ symlink `CLAUDE.md`) — curto, com exemplos de fazer/evitar.

## Princípios da codebase

1. **Proveniência é lei.** Toda tabela de fato carrega `source_provider_id`,
   `source_fetched_at`, `confidence` NOT NULL. Agregados são sempre derivados
   e recalculáveis — nunca editados à mão.
2. **Testes sempre.** Feature sem teste não entra. Unit/integration com
   vitest; E2E com Playwright (agente `e2e-tester`). Normalizadores são
   funções puras 100% cobertas por fixtures reais.
3. **Simplicidade deliberada.** Nada de abstração antes do terceiro uso, nem
   helper para operação única, nem tratamento de erro para cenário
   impossível. Validação só nas fronteiras (payload externo, input de
   usuário); código interno confia em código interno.
4. **Domínio puro no core.** Regra de negócio vive em `packages/core` como
   função pura (zero I/O) — testável sem mock, reutilizável por web e worker.
5. **Fronteiras explícitas.** Payload de provedor e input de usuário são
   hostis: Zod antes de tocar o banco. Erros são explícitos e logados com
   contexto — nunca `catch` silencioso.
6. **Idempotência na ingestão.** Reprocessar o mesmo payload N vezes = mesmo
   estado final (`dedup_key`). Migrations seguem expand-and-contract.
7. **Tech chata, produto ousado.** A inovação do Placarium está no produto;
   a infraestrutura usa o caminho mais previsível e documentado.

## Estrutura do projeto

```
placarium-app/
├── apps/
│   ├── web/          # Next.js: UI + leituras (RSC) + mutações (Server Actions) + /api/live + /api/chat
│   └── ingest/       # Worker Node/BullMQ: ÚNICO processo que fala com o provedor externo
├── packages/
│   ├── core/         # Domínio puro: tipos, Zod, normalizadores, fixtures. ZERO I/O
│   ├── db/           # Drizzle: schema, migrations, client, queries compartilhadas
│   └── ai/           # Tools da IA, camada semântica, prompts, golden set/evals
├── e2e/              # Playwright: jornadas de usuário (agente e2e-tester)
├── scripts/          # Ferramental operacional — NÃO é código de produto (ver scripts/README.md)
├── design/           # Arquivos .pen (Pencil): UIs versionadas junto do código
├── docs/             # Fundação: decisões, specs 001–020, riscos (ver docs/README.md)
├── assets/brand/     # Logo, tokens de cor (fonte de verdade: DESIGN.md)
├── .agents/          # Agentes canônicos (symlink: .claude/agents)
└── .context/         # Estado de sessão por branch (ctx-kit, gitignored)
```

## Direção de dependências (REGRA)

```
core ← db ← ai        core não depende de NADA; db pode importar tipos do core;
  ↖    ↖    ↖         ai usa db+core; web e ingest usam os packages mas
  ingest   web        NUNCA importam um ao outro.
```

- Enforcement por convenção (CodeRabbit instruído) — ferramenta só se violado.
- Package novo apenas com **2 consumidores reais** (nada preventivo).
- Proibido diretório `utils/` genérico: helper vive junto de quem usa e só
  "sobe" no segundo uso. O client HTTP do provedor vive DENTRO do ingest.

## Arquitetura em uma tela

```
usuário ⇄ web (Vercel): RSC lê Postgres · actions mutam · /api/live lê Redis
                                  ▲                                ▲
                       Postgres (Supabase SP, puro)          Redis (Railway)
                                  ▲                                ▲
        ingest (Railway, Docker): poll provedor → raw_snapshot → normaliza (core)
             → upsert dedup → recalcula MVs → publica snapshot no cache
IA: /api/chat → tools de packages/ai (queries fechadas) → resposta com fontes
```

- **Leitura**: RSC consulta o banco direto (pooler); páginas cacheadas por
  ISR/tags; placar ao vivo via polling do cliente em `/api/live/*` (Redis).
- **Escrita de dados esportivos**: só o worker. **Escrita de dados de
  usuário**: só Server Actions.
- **IA**: tools fechadas com contrato Zod; catálogo cresce guiado pelas
  recusas logadas (híbrido progressivo, docs/09). NL→SQL é proibido.

## Módulos (overview; detalhe no AGENTS.md de cada um)

| Módulo          | Papel                                     | Nunca deve                                                       |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `apps/web`      | Experiência do usuário e leitura de dados | Falar com provedor externo; conter regra de domínio              |
| `apps/ingest`   | Ingestão, consolidação, agregados         | Servir requests de usuário; transformar payload (delega ao core) |
| `packages/core` | Domínio puro e fixtures canônicas         | Fazer I/O; depender de outro package                             |
| `packages/db`   | Schema, migrations, acesso a dados        | Ser alterado sem o agente `db-migrations`                        |
| `packages/ai`   | Tools, prompts, evals da IA               | Executar SQL livre; responder sem proveniência                   |
| `e2e`           | Jornadas de usuário no Playwright         | Usar chave real de provedor; depender de ordem de execução       |

## Decisões travadas (não reabrir sem o fundador)

pnpm monorepo · Next.js/Vercel · worker Node+BullMQ+Redis (Railway, Docker) ·
Supabase como **Postgres puro** (sem supabase-js/RLS/Supabase Auth; migrations
só via Drizzle) · Better Auth · AI SDK · polling+cache (SSE só na V1) · views
materializadas para agregados · **Biome** (lint+format; sem ESLint/Prettier) ·
sem odds, sem scraping, sem previsões. Racional completo em `docs/`.

## Comandos

| Comando                              | Faz                                      |
| ------------------------------------ | ---------------------------------------- |
| `pnpm dev`                           | web + ingest em watch                    |
| `pnpm dev:services`                  | Postgres + Redis locais (docker compose) |
| `pnpm test` / `pnpm test:e2e`        | vitest (rápido) / Playwright (jornadas)  |
| `pnpm lint` / `pnpm lint:fix`        | Biome check (sem/com autofix)            |
| `pnpm format` · `pnpm typecheck`     | Biome format · tsc                       |
| `pnpm db:generate` etc. (`db:*`)     | banco (via agente `db-migrations`)       |

## Fluxo de trabalho (time: Luis + Isaque)

- **Main protegida por convenção: só via PR.** Branch `tipo/spec-XXX-slug`
  (ex.: `feat/spec-003-schema-core`), CI verde obrigatória, review humano
  opcional (recomendado), **CodeRabbit revisa toda PR** — comentários são
  tratados (fix ou resposta), nunca ignorados. Use o agente `pr-manager`.
- **Uma spec por dev por vez**, na ordem de `docs/13-specs.md`. Não comece
  spec nova com a sua anterior meio-pronta.
- Sessões: retome com `/ctx-load`; sincronize com `/ctx-sync` ao pausar.
- Gestão do projeto: **Plane** (externo). Não usar Linear.
- Agentes (`.agents/`): `pr-manager` (preparar/revisar PRs) ·
  `db-migrations` (todo schema) · `e2e-tester` (E2E + agent-browser).
- **Envs**: um único `.env` na raiz (symlinks criados por `pnpm setup:env`);
  cada app valida com `env.ts` (Zod) no boot. Preview/prod vivem SÓ nos
  painéis Vercel/Railway — arquivos `.env.dev`/`.env.prod` são proibidos.
- **Design & PM**: UIs nascem no **Pencil** (arquivos `.pen` em `design/`,
  versionados) e são anexadas aos work items do **Plane**. Ambos conectados
  por MCP — setup no README §Ferramentas do time.
- Commits em português explicando o porquê; nunca commitar `.env`.
- Chave real de provedor só em produção; dev/CI usam `FOOTBALL_PROVIDER=mock`.

## Instruções do fundador

- **NUNCA use o dietitian.**
- Com calma, passo a passo — qualidade sobre velocidade.
