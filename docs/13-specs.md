# 14. Specs de desenvolvimento

Formato: objetivo · escopo (in/out) · entidades · endpoints/jobs · critérios de
aceite (CA) · dependências (dep) · riscos/notas. Cada spec vira um doc próprio
(`SPEC-XXX-*.md` efêmero no `.context/` ou PR description) quando entrar em
desenvolvimento — aqui está a definição de fundação.

---

## SPEC-001 · Setup do projeto
**Objetivo**: monorepo funcional com qualidade automatizada.
**Escopo**: pnpm workspaces (`apps/web`, `apps/ingest`, `packages/{db,core,ai}`);
TS estrito compartilhado; ESLint+Prettier; vitest; lefthook; Docker Compose
(postgres+redis); `.env.example`; GitHub Actions (lint+typecheck+test+build);
scripts `dev`, `dev:services`, `db:migrate`, `db:seed`, `test`.
**Fora**: qualquer feature de produto.
**CA**: clone→rodando em ≤ 5 comandos; CI verde obrigatória para merge.

## SPEC-002 · Autenticação
**Objetivo**: contas com atrito mínimo.
**Escopo**: Better Auth + Drizzle adapter; magic link + Google; sessão cookie
httpOnly; middleware de proteção; RBAC user/admin; exclusão de conta (soft
delete + purga assíncrona em 30 dias).
**Fora**: planos/billing, 2FA de usuário final.
**Entidades**: user, session, account. **Dep**: 001.
**CA**: login por e-mail e Google; rota admin bloqueada para user; conta
excluída não aparece em nenhuma query após purga.

## SPEC-003 · Modelagem inicial do banco
**Objetivo**: schema core + proveniência do doc 05 migrado e testado.
**Escopo**: tabelas core/ingest/app; índices; enums; seeds de referência
(países, competições MVP); factories de teste.
**Fora**: MVs analíticas (SPEC-009).
**CA**: migrations aplicam do zero e são idempotentes; toda tabela de fato tem
source_provider_id/fetched_at/confidence NOT NULL; fixtures inserem uma rodada
completa sem violar constraints. **Dep**: 001.
**Nota técnica (Supabase)**: Next/serverless conecta via pooler (Supavisor,
transaction mode — Drizzle sem prepared statements); o worker usa conexão
direta. Funções Vercel em `gru1`, banco em São Paulo. Errar isso só aparece em
produção — nasce certo aqui.

## SPEC-004 · Integração com provedor
**Objetivo**: cliente tipado + normalizadores puros para o provedor escolhido.
**Escopo**: client HTTP com rate limiter e retry; Zod na fronteira;
normalizadores payload→{match,events,stats,lineups} como funções puras;
`provider_entity_map` + resolução de entidades; mock server a partir de
fixtures gravadas; gravação de raw_snapshot.
**Fora**: agendamento (SPEC-005).
**CA**: normalizadores cobertos por fixtures de ≥ 10 partidas reais incluindo
casos: pênalti, expulsão, gol anulado por VAR, substituição no intervalo;
payload inválido → quality issue, nunca crash. **Dep**: 003.
**Risco**: granularidade do provedor menor que o esperado → descoberto aqui,
barato.

## SPEC-005 · Ingestão de partidas
**Objetivo**: pipeline completo do doc 08.
**Escopo**: BullMQ queues (live, batch); jobs discover_fixtures,
live_window_scheduler, poll_live, consolidate, backfill; dedup por dedup_key;
circuit breaker; DLQ; ingestion_job logging.
**Fora**: refresh de MVs (SPEC-009), publicação p/ clientes (SPEC-019).
**CA**: partida simulada via mock passa pelo fluxo 1→10 do doc 08; replay do
mesmo snapshot = zero mudanças; kill do worker no meio do jogo → recuperação
sem evento perdido após consolidação. **Dep**: 004, 017.

## SPEC-006 · Dashboard de jogos ao vivo
**Objetivo**: home com jogos do dia (RF-02).
**Escopo**: RSC + polling do cliente no endpoint live; MatchCard com estados;
agrupamento por competição; filtro por competição; indicador de frescor.
**CA**: atraso ≤ 60 s vs provedor em teste real; skeleton/vazio/erro
implementados; LCP < 2,5 s mobile. **Dep**: 005, 018, 019.

## SPEC-007 · Página de partida
**Objetivo**: RF-03 nos 3 estados (pré/live/pós).
**Escopo**: placar, timeline ordenada com correções marcadas, stats com
TrustBadge, escalações, H2H resumido, dados do árbitro; ISR + revalidateTag.
**CA**: evento corrigido exibe badge; partida sem cobertura de eventos mostra
estado "sem cobertura"; página consolidada exibe stats_locked_at. **Dep**: 005.

## SPEC-008 · Histórico e filtros
**Objetivo**: RF-10 — busca e listagem filtrável de partidas.
**Escopo**: busca por nome (pg_trgm + alias); filtros: competição, temporada,
time, mando, resultado, árbitro, faixa de data; paginação; URL como estado
(shareable).
**CA**: qualquer combinação de filtros < 800 ms p95 no dataset de 3 temporadas;
URLs compartilháveis reproduzem a busca. **Dep**: 003, 009.

## SPEC-009 · Estatísticas agregadas
**Objetivo**: camada analítica do doc 05.
**Escopo**: MVs team_season/rolling/referee/stadium/standing/h2h; job
refresh_aggregates disparado pela consolidação + cron noturno;
formula_version; computed_at em tudo.
**CA**: agregados de 10 partidas validados manualmente; refresh completo
< 60 s no dataset MVP; agregado nunca diverge de recontagem direta dos eventos
(teste automatizado). **Dep**: 005.

## SPEC-010 · Camada de IA
**Objetivo**: chat do doc 09.
**Escopo**: /api/chat streaming (AI SDK); 10–14 tools da tabela do doc 09;
resposta estruturada com fontes; validação numérica de saída; rate limit por
plano; ai_query/ai_answer; golden set 50 perguntas + eval script em CI; telas
de chat (mobile full, desktop painel).
**Fora**: memória longa entre conversas; geração de gráficos custom (V1).
**CA**: metas de eval do doc 09; custo por pergunta logado; pergunta sem dado
→ recusa estruturada com alternativa. **Dep**: 009, 002.

## SPEC-011 · Auditoria e fontes
**Objetivo**: rastreabilidade visível (RF-15).
**Escopo**: TrustBadge component; tooltip fonte+timestamp; página "nossos
dados"; audit_log escrito em toda correção; tela admin de audit por entidade.
**CA**: todo número renderizado no produto tem badge acessível; correção da
reconciliação aparece no audit e na UI. **Dep**: 003, 005.

## SPEC-012 · Observabilidade
**Objetivo**: doc 07 §8.8 essencial.
**Escopo**: Sentry (web+worker); pino→Axiom com request_id/job_id; Better
Stack (uptime + heartbeat do worker); Bull Board no admin; alertas mínimos
(§8.8); dashboard de custo IA/provedor (queries sobre nossas tabelas).
**CA**: erro forçado aparece no Sentry com release; job falhado → alerta;
matar worker → alerta em ≤ 5 min. **Dep**: 001.

## SPEC-013 · Admin
**Objetivo**: RF-18 mínimo.
**Escopo**: /admin com role; lista de ingestion_jobs com re-run; fila de
data_quality_issues com ações; saúde do provedor; botão reconciliar partida;
gestão de provider_entity_map (corrigir mapeamento errado).
**CA**: mapeamento corrigido reprocessa partidas afetadas; issue resolvida
some da fila com resolução registrada. **Dep**: 005, 002.

## SPEC-014 · Billing (Fase 5)
**Objetivo**: assinatura Pro.
**Escopo**: Stripe Checkout + customer portal; webhook (assinado) de
subscription; gates por plano (limites IA, filtros, export); página de preços.
**CA**: upgrade/downgrade/cancelamento refletem em ≤ 1 min; falha de webhook
→ retry + alerta; nenhum gate depende só do cliente. **Dep**: 002, 010.

## SPEC-015 · Hardening de produção (Fase 6)
**Objetivo**: robustez pós-validação.
**Escopo**: rate limiting completo; security headers/CSP; testes de restore;
canary de worker; runbooks de incidente; revisão de permissões; pentest leve.
**CA**: checklist de segurança do doc 07 §8.10 completo e verificado.

## SPEC-016 · Ambientes e deploy
**Objetivo**: doc 07 §8.3/8.5 operacional.
**Escopo**: projetos Vercel/Railway/Supabase (dev e prod separados); preview
por PR apontando para o banco dev com seeds idempotentes; pipeline de
migrations expand-contract; smoke test pós-deploy; rollback documentado;
secrets por ambiente.
**CA**: PR aberto → preview funcional em < 5 min; migration com erro bloqueia
deploy; rollback testado uma vez de verdade. **Dep**: 001.

## SPEC-017 · Workers e filas
**Objetivo**: fundação BullMQ do apps/ingest.
**Escopo**: bootstrap do worker; filas live/batch com prioridades; retry/
backoff padrão; DLQ + alerta; graceful shutdown (termina job atual);
schema_version em payloads; heartbeat.
**CA**: deploy durante job em execução não perde nem duplica o job; job com
versão desconhecida vai à DLQ. **Dep**: 001.

## SPEC-018 · Sistema de cache
**Objetivo**: camada Redis + estratégia ISR.
**Escopo**: client Redis compartilhado; chaves versionadas (v1:live:{id});
TTLs por tipo; helpers de invalidação por tag do Next; rate limiting
sliding-window; fallback Postgres quando Redis cai (degradar, não quebrar).
**CA**: derrubar Redis em dev → site funciona mais lento, sem erro 500;
computed_at presente em toda resposta cacheada. **Dep**: 001.

## SPEC-019 · Realtime updates
**Objetivo**: entrega ao cliente (doc 08 passos 7–8).
**Escopo**: GET /api/live/:matchId e /api/live/today com ETag/304 servidos do
Redis; hook useLivePolling (10–20 s, pausa em aba oculta, "modo quente"
pós-gol); revalidateTag na escrita do worker.
**Fora**: SSE (V1 — interface do hook já preparada para trocar transporte).
**CA**: 304 quando nada mudou (medido); aba em background não polla; gol
aparece em ≤ 60 s ponta a ponta. **Dep**: 005, 018.

## SPEC-020 · Data quality e reconciliação
**Objetivo**: RF-19 + reconciliação do doc 08.
**Escopo**: consolidate T+2h/T+24h com diff auditado; detectores: stats
faltantes, evento órfão, valor suspeito (ex.: 30 escanteios), entidade não
mapeada, partida live sem update > 3 min; severidades; quality_scan diário;
divergência de placar → triagem manual obrigatória.
**CA**: correção simulada no mock aparece como diff auditado + badge; placar
divergente NÃO aplica automático; relatório semanal de qualidade por
competição (base para decidir expansão de cobertura). **Dep**: 005, 013.

---

## Ordem de implementação sugerida

```
001 → 003 → 004 → 017 → 005 → 018 → 009 → 019 → 006/007 (paralelo) → 008
 → 002 → 011 → 012 → 013 → 020 → [MVP fechado] → 010 → [Fase 3 fechada]
 → 016 permeia desde 001 (preview) e fecha antes do beta
```
