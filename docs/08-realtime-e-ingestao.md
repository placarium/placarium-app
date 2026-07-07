# 9. Real-time e ingestão de eventos

## Escolha do mecanismo

| Opção                       | Quando faz sentido                         | Decisão                                                                                     |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Polling (worker→provedor)   | Sempre disponível, controlável, observável | ✅ MVP                                                                                      |
| Webhooks do provedor        | Se o provedor oferecer com confiabilidade  | Usar como **acelerador** do polling (nunca substituto: webhook perdido = buraco silencioso) |
| Streaming do provedor       | Planos enterprise                          | Escala futura                                                                               |
| Polling (cliente→nossa API) | Simples, cacheável, funciona em serverless | ✅ MVP (10–20 s, ETag/304)                                                                  |
| SSE (nossa API→cliente)     | Reduz latência e requests                  | V1, servido pelo worker                                                                     |
| WebSockets                  | Bidirecional — não precisamos              | Só se produto exigir (chat ao vivo etc.)                                                    |

## Fluxo completo de uma partida

```
1. DESCOBERTA    discover_fixtures (cron diário 05:00): busca calendário das
                 competições ativas → upsert matches (status=scheduled)
                 → agenda checagem D-1 (confirma horário/adiamento)
2. JANELA        live_window_scheduler (cron a cada 1 min): partidas com
                 kickoff_at - 15min <= now <= fim estimado + 30min
                 → garante um job poll_live:{matchId} repetível na fila LIVE
3. POLLING       poll_live:{matchId} a cada 15–60s (adaptativo):
                 fetch estado completo da partida no provedor
4. NORMALIZAÇÃO  packages/core: payload bruto → eventos/stats canônicos
                 (função pura, testada com fixtures) + grava raw_snapshot
5. DEDUP/DIFF    upsert por dedup_key: evento novo → insere; mudou → marca
                 is_corrected + audit; sumiu do provedor → marca removed
                 (nunca DELETE físico durante o jogo)
6. AGREGADOS     stats da partida (match_team_stats) atualizadas; MVs de
                 médias NÃO são refrescadas ao vivo (só na consolidação)
7. CACHE         snapshot leve (placar, minuto, últimos eventos, stats) →
                 Redis v1:live:{matchId} + revalidateTag da página
8. CLIENTE       polling GET /api/live/:matchId com If-None-Match
                 → 304 (barato) ou JSON novo → UI atualiza incremental
9. AUDITORIA     ingestion_job registra cada ciclo (latência, mudanças, erros)
10. CONSOLIDAÇÃO status final → consolidate:{matchId} em T+2h e T+24h:
                 re-fetch completo, diff, correções auditadas, stats_locked_at,
                 refresh MVs, recálculo de rolling stats e standings,
                 revalidação de páginas, partida → status=consolidated
```

## Polling adaptativo e priorização

- **Frequência por estado**: bola rolando 15–20 s; intervalo 60 s; pré-jogo
  (janela -15 min) 60 s; jogo com evento recente (gol/VAR) 10 s por 2 min
  ("modo quente").
- **Prioridade por importância**: `competition.tier` + flag `is_derby` →
  partidas tier 1 pollam a 15 s, tier 2 a 30 s quando o rate limit apertar.
  Orçamento de requests calculado dinamicamente: `budget_por_min =
rate_limit × 0.7` (30 % de folga), distribuído por prioridade.
- **Jogos simultâneos**: rodada cheia ≈ 10 jogos × 1 req/15 s ≈ 40 req/min —
  validar contra o plano do provedor na Fase 0; é O(jogos), não O(usuários),
  porque **usuários leem do nosso cache, nunca do provedor**.

## Confiabilidade da ingestão

- **Idempotência**: `dedup_key` UNIQUE por evento (id do provedor quando
  existir; senão hash de match+tipo+minuto+jogador+seq). Reprocessar payload =
  no-op.
- **Retry/backoff**: BullMQ exponencial (1 s → 60 s, 5 tentativas) → DLQ com
  alerta. Erros 429 respeitam `Retry-After` e reduzem o orçamento global.
- **Circuit breaker por provedor**: > 50 % de erro em 2 min → pausa polling,
  proba a cada 2 min, alerta. UI segue mostrando último estado + timestamp.
- **Detecção de falha silenciosa**: partida `live` sem snapshot novo há
  > 3 min → quality issue + alerta (pode ser jogo parado real — triagem).
- **Ordenação**: eventos ordenados por `(minute, minute_extra, seq)`; `seq` é
  a ordem de chegada do provedor no mesmo minuto. Não confiar em timestamps
  de chegada.
- **Snapshots de estado**: cada ciclo grava `raw_snapshot` → histórico
  completo da evolução da partida (útil para depurar "o placar piscou errado")
  e para replay.

## Reconciliação pós-jogo

Duas passadas (T+2 h pega correções da súmula rápida; T+24 h pega correções
tardias — gol trocado de autor, cartão ajustado):

1. Re-fetch completo da partida.
2. Diff campo a campo contra o estado gravado.
3. Divergência → correção com `audit_log` (actor=reconciliation) + badge.
4. Divergência acima de tolerância (placar diferente!) → `data_quality_issue`
   severidade alta + **não** aplica automaticamente → triagem no admin.
5. `stats_locked_at` preenchido; MVs e rolling stats refrescadas; cache e
   páginas revalidados.

## Custo e eficiência

- Nunca fan-out provedor→usuários: 1 fetch alimenta N usuários via cache.
- ETag/304 no endpoint ao vivo: resposta média cai para bytes.
- Fora de janela ao vivo, o sistema faz ~0 chamadas externas (só crons
  diários) — custo de provedor é função de jogos, previsível por calendário.
- Métrica-guia: `requests_ao_provedor / partida` e `% do rate limit usado no
pico de rodada`.
