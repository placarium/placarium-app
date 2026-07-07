# Placarium

Plataforma de dados, analytics e IA para futebol — o observatório onde cada
número tem **fonte, timestamp e nível de confiança**. Essa promessa tem
precedência sobre qualquer atalho técnico: na dúvida entre conveniente e
auditável, escolha auditável.

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
├── docs/             # Fundação: decisões, specs 001–020, riscos (índice no README)
├── assets/brand/     # Logo, tokens de cor (fonte de verdade: DESIGN.md)
├── .agents/          # Agentes do projeto (symlink em .claude/agents)
└── .context/         # Estado de sessão por branch (ctx-kit, gitignored)
```

## Arquitetura em uma tela

```
usuário ⇄ web (Vercel): RSC lê Postgres · actions mutam · /api/live lê Redis
                                  ▲                                ▲
                       Postgres (Supabase SP, puro)          Redis (Railway)
                                  ▲                                ▲
        ingest (Railway): poll provedor → raw_snapshot → normaliza (core)
             → upsert dedup → recalcula MVs → publica snapshot no cache
IA: /api/chat → tools de packages/ai (queries fechadas) → resposta com fontes
```

- **Leitura**: RSC consulta o banco direto (pooler); páginas cacheadas por
  ISR/tags; placar ao vivo via polling do cliente em `/api/live/*` (Redis).
- **Escrita de dados esportivos**: só o worker. **Escrita de dados de
  usuário**: só Server Actions.
- **IA**: tools fechadas com contrato Zod; catálogo cresce guiado pelas
  recusas logadas (híbrido progressivo, docs/09). NL→SQL é proibido.

## Módulos (overview; detalhe no CLAUDE.md de cada um)

| Módulo          | Papel                                     | Nunca deve                                                       |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `apps/web`      | Experiência do usuário e leitura de dados | Falar com provedor externo; conter regra de domínio              |
| `apps/ingest`   | Ingestão, consolidação, agregados         | Servir requests de usuário; transformar payload (delega ao core) |
| `packages/core` | Domínio puro e fixtures canônicas         | Fazer I/O; depender de outro package                             |
| `packages/db`   | Schema, migrations, acesso a dados        | Ser alterado sem o agente `db-migrations`                        |
| `packages/ai`   | Tools, prompts, evals da IA               | Executar SQL livre; responder sem proveniência                   |
| `e2e`           | Jornadas de usuário no Playwright         | Usar chave real de provedor; depender de ordem de execução       |

## Decisões travadas (não reabrir sem o fundador)

pnpm monorepo · Next.js/Vercel · worker Node+BullMQ+Redis (Railway) ·
Supabase como **Postgres puro** (sem supabase-js/RLS/Supabase Auth; migrations
só via Drizzle) · Better Auth · AI SDK · polling+cache (SSE só na V1) · views
materializadas para agregados · sem odds, sem scraping, sem previsões.
Racional completo em `docs/` — consulte antes de propor mudança.

## Comandos

| Comando                                        | Faz                                      |
| ---------------------------------------------- | ---------------------------------------- |
| `pnpm dev`                                     | web + ingest em watch                    |
| `pnpm dev:services`                            | Postgres + Redis locais (docker compose) |
| `pnpm test` / `pnpm test:e2e`                  | vitest (rápido) / Playwright (jornadas)  |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | qualidade                                |
| `pnpm db:generate                              | migrate                                  | seed | studio` | banco (via agente `db-migrations`) |

## Fluxo de trabalho

- **Passo a passo, uma spec por vez**, na ordem de `docs/13-specs.md`.
  Não comece spec nova com a anterior meio-pronta.
- Sessões: retome com `/ctx-load`; sincronize com `/ctx-sync` ao pausar.
- Gestão do projeto: **Plane** (externo). Não usar Linear.
- Agentes: `db-migrations` para qualquer mudança de schema; `e2e-tester`
  para E2E. Estão em `.agents/` (symlink `.claude/agents`).
- Ao criar módulo/pasta com convenção própria, crie o CLAUDE.md dela junto —
  curto, com exemplos de fazer/evitar. Atualize quando a convenção mudar.
- Commits em português explicando o porquê; nunca commitar `.env`.
- Chave real de provedor só em produção; dev/CI usam `FOOTBALL_PROVIDER=mock`.

## Instruções do fundador

- **NUNCA use o dietitian.**
- Com calma, passo a passo — qualidade sobre velocidade.
