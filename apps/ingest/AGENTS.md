# apps/ingest — Worker de ingestão (Node + BullMQ)

O único processo que fala com o provedor esportivo. Roda 24/7 no Railway.
Confiabilidade > latência: perder evento em silêncio é o pior bug possível.

## Fronteiras

- Orquestra jobs; **não transforma payload** — normalização é função pura de
  `@placarium/core` (payload → entidades canônicas).
- Escreve no banco via `@placarium/db`; publica snapshots no Redis.
- Nunca importa de `apps/web`; nunca serve request de usuário
  (exceção futura: health check e SSE na V1).

## Convenções

- Jobs nomeados e pequenos: `discover_fixtures`, `live_window_scheduler`,
  `poll_live:{matchId}`, `consolidate:{matchId}`, `refresh_aggregates`,
  `backfill`. Um job = uma responsabilidade (ver docs/08).
- **Idempotência obrigatória**: rodar duas vezes = mesmo resultado
  (`dedup_key` em eventos; upserts, não inserts cegos).
- Ordem de gravação por ciclo: `raw_snapshot` primeiro (auditoria), depois
  normaliza/upserta, depois cache. Se falhar no meio, o raw permite replay.
- Retry/backoff/DLQ são do BullMQ — não reinvente com try/catch+loop.
  `catch` sem rethrow/log estruturado é proibido.
- Rate limit do provedor é orçamento explícito (limiter do BullMQ), não
  torcida. 429 respeita `Retry-After`.
- Graceful shutdown: termina o job atual antes de morrer (deploys acontecem
  durante jogos).
- Logs estruturados (JSON) com `job_id`/`match_id` — nada de
  `console.log("aqui 2")`.

## Fazer / Evitar

- ✅ Job repetível do BullMQ para polling; ❌ `setInterval`/cron manual
- ✅ Estado no Redis/Postgres; ❌ estado em memória entre jobs
- ✅ Payload inválido → `data_quality_issue` + segue; ❌ crash do worker
- ❌ Chave real do provedor fora de produção (`FOOTBALL_PROVIDER=mock` em dev)

## Testes

Handlers testados com fixtures de `@placarium/core` e mocks de fila — sem
rede real. O fluxo completo (10 passos do docs/08) tem teste de integração
com o mock server.
