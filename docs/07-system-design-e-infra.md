# 8. System design, ambientes, infraestrutura e hospedagem

## 8.1 System design macro

Componentes e responsabilidades (diagrama completo no doc 06):

| Componente | Tecnologia | Responsabilidade |
|---|---|---|
| Web/CDN | Next.js na Vercel | UI, SSR/ISR, API de leitura, rotas de IA, SEO |
| Worker | Node/BullMQ no Railway | Ingestão, polling ao vivo, consolidação, agregados, quality scan |
| Filas | BullMQ sobre Redis | Retry, backoff, repeatable jobs, deduplicação de jobs |
| Banco operacional | Postgres (Supabase, São Paulo) | Fonte de verdade |
| Camada analítica | MVs no mesmo Postgres | Agregados (doc 05) |
| Cache | Redis (Railway) | Estado ao vivo, respostas quentes, rate limiting |
| IA | Claude API via AI SDK | Chat com tools fechadas |
| Auth | Better Auth (no web) | Sessões, OAuth |
| Admin | Rotas `/admin` no próprio Next | Operação (RF-18) |
| Storage | — no MVP; S3/R2 na V1 | Arquivo de raw payloads antigos |
| Observabilidade | Sentry + Axiom + Better Stack | Erros, logs, uptime |

Fluxo usuário→dado: usuário → CDN/Next → (cache Redis | Postgres) ← worker ←
filas ← provedor externo. A IA atravessa: usuário → Next → tools → Postgres/
Redis → Claude → usuário, com log em `ai_answer`.

## 8.2 Decisões de hospedagem

### Comparativo honesto

| Opção | Prós | Contras | Veredito MVP |
|---|---|---|---|
| **Vercel** (web) | Melhor DX Next, preview deploys, CDN, ISR nativo | Funções com limite de duração; custo cresce com tráfego; worker impossível | ✅ para `apps/web` |
| **Railway** (worker+Redis) | Processos persistentes triviais, Redis no mesmo projeto (latência ~0), logs decentes, preço previsível | Menos maduro que AWS; sem multi-região | ✅ para `apps/ingest` + Redis |
| **Supabase** (Postgres) | Região **São Paulo** (colocation com usuários BR e Vercel `gru1`), dashboard excelente para inspecionar dados, backups geridos, free tier generoso | Branching de banco por PR menos maduro que o do Neon (pago); tentação de acoplar em Auth/RLS/Realtime — **usamos só o Postgres**, com disciplina: migrations via Drizzle, zero supabase-js, RLS off | ✅ para Postgres (como Postgres puro) |
| Neon (Postgres) | Branching por PR (preview com banco isolado), autoscaling | Sem região São Paulo próxima do nosso público na mesma medida; cold start em projetos idle | Alternativa forte; perdemos branching conscientemente (mitigação em §8.3) |
| Render / Fly.io | Equivalentes ao Railway; **Fly tem região GRU** | Fly: mais poder, mais atrito operacional (Dockerfile, Redis por conta própria) | Fly GRU é o plano de colocation do worker se o atraso de ingestão apertar (§8.2 racional) |
| AWS/GCP/Azure | Poder total, custo fino em escala | Semanas de setup para um dev solo; overengineering agora | ❌ MVP; candidato na escala |
| Upstash Redis | Serverless, barato | **Incompatível na prática com BullMQ** (conexões persistentes, custo por comando) | ❌ para filas |

### Racional

- **Serverless onde o tráfego é em picos e stateless** (páginas em dia de
  rodada) — Vercel.
- **Processo persistente onde há estado e continuidade** (polling, filas) —
  Railway.
- **Lock-in controlado**: Next é portável (Docker), worker é Node comum,
  Postgres é Postgres, Redis é Redis. O único acoplamento real é ISR/edge da
  Vercel — aceitável e reversível. Não gastar tempo "evitando lock-in" além
  disso.
- **Quando migrar**: custo Vercel > custo de um cluster gerenciado + tempo de
  ops, ou necessidade de rede privada entre serviços → consolidar em
  AWS/GCP (containers ECS/Cloud Run). Sinal esperado só bem depois da V1.

## 8.3 Ambientes

| Ambiente | Objetivo | Serviços | Dados | IA | Provedor externo |
|---|---|---|---|---|---|
| **Local** | Dev diário | Docker Compose: Postgres + Redis; web e worker via pnpm | Seed sintético + fixtures de partidas reais gravadas | Chave dev com cap baixo | **Mock server** (fixtures) por padrão; chave real só sob flag |
| **Preview** (por PR) | Revisar feature | Vercel preview + **banco de dev compartilhado** (projeto Supabase separado do prod, seeds idempotentes); Redis compartilhado de dev com prefixo por PR | Seed sintético | Chave dev | Mock |
| **Produção** | Usuários reais | Vercel prod + Railway prod + Neon main | Reais | Chave prod com caps | Chave real (a única que polla de verdade) |

**Staging dedicado: adiado deliberadamente.** Com um dev, preview-por-PR sobre
um banco de dev compartilhado cobre a maior parte do valor de staging sem o
custo de manter um ambiente que apodrece. Se o compartilhamento virar dor
(migrations conflitantes entre PRs), avaliar o branching pago do Supabase — é
uma dor boa de ter, significa ritmo alto. Criar staging quando: houver 2+ devs, ou
billing (testar webhooks de Stripe), ou o segundo provedor de dados (testar
reconciliação com tráfego real). Regra anti-burocracia: cada ambiente novo
precisa de um dono e de um motivo escrito.

**Regras transversais**:
- Secrets por ambiente, nos cofres das plataformas (Vercel/Railway env vars),
  nunca em arquivo commitado; `.env.example` documenta as chaves.
- **A chave real do provedor só existe em produção** — evita consumir rate
  limit e violar termos em testes.
- Webhooks (quando houver): URL por ambiente + secret de assinatura por
  ambiente.

## 8.4 Setup local

```bash
git clone git@github.com:stats-hub/stats-hub-monorepo.git && cd stats-hub-monorepo
pnpm install
cp .env.example .env          # preencher 3–4 chaves mínimas
pnpm dev:services             # docker compose up -d (postgres + redis)
pnpm db:migrate               # drizzle migrations
pnpm db:seed                  # times/competições + ~50 partidas de fixture
pnpm dev                      # web + worker em modo watch (turbo/concurrently)
pnpm test                     # vitest
```

- **Fixtures de partidas reais**: gravar respostas do provedor de ~10 partidas
  (1 rodada) como JSON em `packages/core/fixtures/` — alimentam o mock server,
  os testes de normalização e o seed. É o ativo de teste mais valioso do
  projeto.
- Qualidade: ESLint + Prettier + typecheck estrito; hooks via lefthook
  (pre-commit: lint-staged; pre-push: typecheck+test).
- Onboarding: este repositório de docs + `CONTRIBUTING.md` com o bloco acima.

## 8.5 Estratégia de deploy

- **Pipeline**: PR → CI (lint, typecheck, vitest, build) → preview deploy
  (banco dev) → merge em `main` → CI aplica migrations em prod → deploy
  web (Vercel) e worker (Railway) → smoke test (`/api/health` + 1 query de
  leitura + job de teste na fila) → alerta no fail.
- **Migrations seguras — expand-and-contract obrigatório**: (1) adicionar
  coluna/tabela nova compatível; (2) deploy do código que escreve nas duas;
  (3) backfill; (4) deploy que lê da nova; (5) remover a antiga em migration
  posterior. Nunca `DROP`/`RENAME` no mesmo deploy que o código.
- **Worker antigo × evento novo**: deploy do worker **antes** do web quando a
  mudança toca contratos de fila; payloads de job carregam `schema_version`;
  worker rejeita versão que não conhece (vai para DLQ, alerta).
- **Rollback**: web = redeploy do build anterior (instantâneo na Vercel);
  worker = redeploy da imagem anterior; migrations não são revertidas —
  roll-forward (por isso expand-and-contract).
- **Feature flags**: variável de ambiente + tabela `feature_flag` simples no
  MVP (sem SaaS de flags ainda). Toda feature arriscada nasce atrás de flag.
- **Cache pós-deploy**: chaves Redis versionadas (`v2:live:{matchId}`) — deploy
  que muda formato de payload muda o prefixo; sem invalidação manual.
- **Custo pós-deploy**: alertas de billing nas 3 plataformas + métrica de
  chamadas ao provedor por hora (um bug de polling pode estourar o rate limit
  em minutos — alarme se > 120 % do esperado).

## 8.6 Banco e ambientes de dados

- **Backups**: backups automáticos do Supabase (PITR no plano pago desde que
  houver produção) + dump lógico semanal para storage externo (não deixar
  todos os ovos no Supabase). Testar restore 1×/trimestre.
- **Retenção**: `raw_snapshot` ao vivo 90 dias → arquivar/expurgar; snapshot
  final permanente; logs de IA 12 meses (LGPD, doc 14); `ingestion_job` 6
  meses.
- **Dados sensíveis**: e-mail + perguntas de IA são dados pessoais → nunca em
  seeds/preview; seeds usam usuários fake. Perguntas de IA não vão para logs
  de aplicação (só para a tabela auditada `ai_query`).
- **Dados licenciados**: separados por proveniência no schema (tudo tem
  `source_provider_id`) — se um contrato acabar, sabemos exatamente o que
  expurgar ou re-licenciar.
- **Correções pós-jogo e inconsistências**: doc 05 (audit_log, disputed).

## 8.7 Infraestrutura para tempo real

Decisão MVP: **polling nas duas pontas, com cache no meio** (worker→provedor
15–60 s adaptativo; cliente→API 10–20 s com ETag/304 sobre Redis).
Justificativa: meta de atraso é 60 s; polling é a solução mais simples,
observável e barata que cumpre a meta. WebSockets/SSE agora seria otimizar o
que ninguém pediu. Detalhes operacionais (dedup, backoff, idempotência,
janelas): doc 08.

Evolução: V1 = SSE servido pelo worker no Railway (conexões persistentes ok)
com fallback para polling; Escala = pub/sub gerenciado (Ably/Pusher) se
conexões simultâneas virarem custo/ops relevante.

## 8.8 Observabilidade e operação

| Sinal | MVP (essencial) | V1+ |
|---|---|---|
| Erros | Sentry (web + worker), release tracking | + alertas por taxa |
| Logs | pino JSON → Axiom; `request_id`/`job_id` correlacionados | retenção maior, dashboards |
| Uptime | Better Stack em `/` e `/api/health` (web) + heartbeat do worker | multi-região |
| Métricas | Mínimas via logs estruturados: atraso de ingestão, profundidade de fila, rate limit consumido, custo IA/dia | Prometheus/OTel + Grafana |
| Filas | Bull Board embutido no admin | alertas de DLQ |
| IA | Toda pergunta/resposta em `ai_query`/`ai_answer` com custo e tools chamadas | evals contínuos (doc 09) |
| Ingestão | `ingestion_job` + tela admin | SLO formal de frescor |

**Alertas mínimos do MVP** (poucos e acionáveis): site down, worker heartbeat
perdido > 5 min, fila > 100 jobs atrasados, taxa de erro do provedor > 20 %,
custo IA diário > teto, migration falhou.

## 8.9 Resiliência e tolerância a falhas

| Cenário | Impacto | Comportamento esperado | Mitigação/Fallback | Alerta | Prioridade |
|---|---|---|---|---|---|
| Provedor fora do ar | Sem atualização ao vivo | UI mostra "atualizado há X min", nunca dado inventado; circuit breaker pausa polling e testa a cada 2 min | Reconciliação preenche buracos quando voltar | Sim, imediato | P0 |
| Provedor atrasado | Placar defasado | Timestamp visível protege a confiança; medir provider_lag | — | Se > 5 min | P1 |
| Evento duplicado | Stats infladas | `dedup_key` UNIQUE ignora silenciosamente | — | Métrica | P0 (design) |
| Evento corrigido depois | Timeline muda | supersede + audit + badge (doc 05) | — | Não | P0 (design) |
| Conflito entre provedores | (V2) | flag `disputed`, exibe fonte primária | Triagem admin | Sim | V2 |
| Postgres indisponível | Site fora | Páginas ISR sobrevivem em cache; API 503 com retry-after | HA do Supabase; restore testado | Sim, imediato | P0 |
| Redis indisponível | Sem ao vivo/cache | **Degradar, não cair**: API cai para Postgres direto (mais lento); polling do cliente continua | Redis é reconstituível (cache-only) | Sim | P1 |
| Fila travada / worker morto | Ingestão para | Heartbeat + restart automático (Railway); jobs com retry/backoff; DLQ | Reconciliação recupera perdidos | Sim > 5 min | P0 |
| IA fora do ar | Chat indisponível | Mensagem honesta + resto do site intacto (IA é feature, não fundação) | Retry com backoff; fila de espera | Se > 15 min | P2 |
| Deploy com bug | Regressão | Smoke test pós-deploy; rollback 1-clique; flags | — | Sim | P0 |
| Pico de tráfego (jogo grande) | Custo/latência | Páginas quentes são ISR/CDN (escala sozinho); API ao vivo é 1 GET cacheado no Redis | Rate limit por IP | Billing alert | P1 |

## 8.10 Segurança de infraestrutura

- Secrets nos cofres das plataformas, por ambiente; rotação semestral e a cada
  suspeita; nenhuma secret em log (redaction no pino).
- Permissões mínimas: token do worker só escreve nas tabelas de ingestão? Na
  prática MVP: um role Postgres para web (leitura + tabelas app) e um para
  worker (escrita core/ingest) — barato de fazer com Postgres roles e evita
  classe inteira de bugs.
- `/admin` e Bull Board atrás de auth + role admin + (V1) IP allowlist.
- Rate limiting: por IP (anônimo) e por user (autenticado), Redis
  sliding-window; IA com limite diário por plano.
- Webhooks de entrada (quando existirem): validação de assinatura + replay
  protection (nonce/timestamp).
- Payload externo é **input hostil**: validação Zod na fronteira
  (`packages/core`), nunca `payload.x` direto no banco.
- Segregação total preview/prod: chaves diferentes, bancos diferentes, sem
  dados reais fora de prod.

## 8.11 Escalabilidade progressiva

| Estágio | Gargalo esperado | Ação | O que NÃO fazer ainda |
|---|---|---|---|
| MVP (≤ 1 k users) | Nenhum técnico; foco em produto | Stack deste doc | Warehouse, k8s, multi-região, microserviços |
| Dados reais + primeiros usuários | Rate limit do provedor | Polling adaptativo, priorização de partidas (doc 08) | Segundo provedor |
| Primeira versão pública | Picos em rodada | ISR agressivo, tuning de índices, réplicas de leitura Neon | Reescrever em Go 🙂 |
| + campeonatos | Custo provedor + refresh de MVs | Upgrade de plano do provedor; MVs incrementais ou por competição | ClickHouse por reflexo |
| + usuários simultâneos | Conexões SSE/polling | SSE no worker → pub/sub gerenciado | Infra própria de websocket |
| + analytics avançado | Queries analíticas no operacional | Réplica de leitura dedicada a analytics → DuckDB/ClickHouse se doer | — |
| + IA intensiva | Custo de tokens | Cache semântico de respostas, modelos menores para triagem, batch de agregados pré-computados para perguntas comuns | Fine-tuning prematuro |
| B2B/API | Isolamento e SLA | Extrair API pública como serviço separado (primeira fronteira de microsserviço legítima) | — |

Sinal geral de "hora de evoluir": a mitigação simples (cache, índice, upgrade
de plano) deixou de resolver **duas vezes seguidas** no mesmo gargalo.

## 8.12 Recomendação final de arquitetura operacional

| Aspecto | MVP | V1 | Escala |
|---|---|---|---|
| Frontend/web | Vercel | Vercel | Vercel ou containers (custo) |
| Worker/jobs | Railway (1 serviço, restart automático) | Railway (2+ réplicas, filas separadas live/batch) | Containers (ECS/Cloud Run) |
| Postgres | Supabase SP (plano pago desde produção: PITR) | Supabase + réplica leitura | Gerenciado (RDS/Cloud SQL) ou Postgres próprio se preço/recursos exigirem — saída limpa garantida pela disciplina "Postgres puro" |
| Redis | Railway | Railway | Gerenciado (ElastiCache/Memorystore) |
| CI/CD | GitHub Actions + deploys nativos | idem + smoke tests ricos | + canary |
| Secrets | Cofres Vercel/Railway | idem + rotação formal | Vault/SSM |
| Monitoramento | Sentry+Axiom+Better Stack | + OTel/Grafana | + on-call formal |
| Backups | Neon PITR + dump semanal externo | + restore testado trimestral | + DR multi-região |
| Deploy seguro | expand-contract + smoke + rollback 1-clique | + canary de worker | + blue/green |
