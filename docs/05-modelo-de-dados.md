# 6. Modelo de dados

Banco operacional: **PostgreSQL**. Convenções: PKs `uuid` (v7, ordenável por
tempo), timestamps `timestamptz`, snake_case. ORM: Drizzle (migrations SQL
explícitas).

## Visão geral das camadas

| Camada | Onde | Conteúdo |
|---|---|---|
| Operacional | Postgres (schema `core`) | Entidades, partidas, eventos, stats |
| Proveniência | Postgres (`ingest`) | providers, jobs, raw_snapshots, quality issues, audit |
| Analítica | Postgres (**materialized views**, schema `analytics`) | Agregados, standings, perfis. Warehouse dedicado só quando MVs não aguentarem (ver "Evolução") |
| Cache | Redis | Estado ao vivo, respostas quentes, rate limit |
| Busca | Postgres `pg_trgm` no MVP | Nomes de times/jogadores/árbitros. Busca dedicada (Typesense/Meili) só na V2 |
| Usuário/IA | Postgres (`app`) | users, ai_queries, ai_answers |

**Não haverá event store dedicado no MVP**: `match_events` + `raw_snapshots`
cumprem o papel (eventos são naturalmente um log). Kafka/event sourcing formal
seria overengineering aqui.

## Pseudo-schema — núcleo

```sql
-- Referência
country(id, name, code, flag_url)
competition(id, country_id?, name, kind enum(league|cup|international),
            tier, coverage_level enum(full|basic|results_only), logo_url)
season(id, competition_id, label '2025', starts_on, ends_on, is_current)
stage(id, season_id, name 'Fase de grupos', ordering)   -- copas/Libertadores
round(id, season_id, stage_id?, number, label 'Rodada 12')

team(id, name, short_name, slug UNIQUE, country_id, kind enum(club|national),
     founded_year?, colors?, logo_url)
stadium(id, name, slug, city, country_id, capacity?, lat?, lng?)
  -- estádios renomeados: name é atual; aliases em entity_alias
player(id, full_name, known_as, slug, birth_date?, nationality_id?,
       position enum?, foot?)  -- dados pessoais mínimos; ver doc 14
player_team_stint(id, player_id, team_id, from_date, to_date?, shirt_number?)
  -- resolve transferências: stats históricas apontam para o stint vigente na data
coach(id, full_name, slug, nationality_id?)
coach_team_stint(id, coach_id, team_id, from_date, to_date?)
referee(id, full_name, slug, nationality_id?)  -- dados frequentemente incompletos: tolerar NULLs

-- Partida
match(id, season_id, round_id?, stage_id?,
      home_team_id, away_team_id, stadium_id?, referee_id?,
      kickoff_at, status enum(scheduled|postponed|cancelled|live|ht|ft|aet|pen|abandoned|consolidated),
      home_score, away_score, home_score_ht, away_score_ht,
      periods jsonb,            -- acréscimos por tempo, pênaltis etc.
      attendance?,
      stats_locked_at?,         -- consolidação: depois disso, mudanças só via audit
      source_provider_id, source_fetched_at, confidence)
  INDEX (season_id, kickoff_at), (status, kickoff_at),
        (home_team_id, kickoff_at), (away_team_id, kickoff_at)

match_event(id, match_id,
      type enum(goal|own_goal|penalty_goal|missed_penalty|yellow|second_yellow|red|
                sub|corner|shot|shot_on_target|foul|offside|var_decision|
                goal_disallowed|injury_time|period_start|period_end),
      minute, minute_extra?, second?, seq,      -- ordenação: (minute, minute_extra, seq)
      team_id?, player_id?, related_player_id?, -- assistente, substituído...
      detail jsonb,                              -- corpo específico por tipo (posição do chute, motivo do VAR...)
      dedup_key UNIQUE,   -- hash(provider, provider_event_id) ou hash(match,type,minute,player,seq)
      is_corrected bool DEFAULT false, superseded_by_event_id?,
      source_provider_id, source_fetched_at, confidence)
  INDEX (match_id, minute, seq), (player_id, type), (type, match_id)
  -- Card/Goal/Shot/Corner/Foul/VARDecision são TIPOS de match_event, não tabelas
  -- próprias: a timeline é a consulta dominante e eventos compartilham 90% dos campos.

match_team_stats(match_id, team_id, period enum(full|1st|2nd),
      possession?, shots?, shots_on_target?, corners?, fouls?, offsides?,
      yellow_cards?, red_cards?, passes?, pass_accuracy?, saves?, xg?,
      source..., confidence)  PK(match_id, team_id, period)
match_player_stats(match_id, player_id, team_id, minutes_played, rating?,
      goals, assists, shots?, passes?, tackles?, ...,
      source..., confidence)  PK(match_id, player_id)

lineup(id, match_id, team_id, formation?, is_confirmed bool, coach_id?)
lineup_player(lineup_id, player_id, position?, shirt_number?, is_starter bool)
-- Substituição = match_event(type=sub, player_id=entra, related_player_id=sai)
```

## Pseudo-schema — proveniência e ingestão

```sql
provider(id, name, base_url, rate_limit_per_min, is_active)
provider_entity_map(provider_id, entity_type enum(team|player|match|...),
      provider_key text, internal_id uuid,
      UNIQUE(provider_id, entity_type, provider_key))
  -- resolve "Palmeiras" vs "SE Palmeiras" vs id 121: mapeamento explícito, nunca por nome
entity_alias(entity_type, internal_id, alias, source)  -- nomes antigos, apelidos, busca

ingestion_job(id, kind enum(discover_fixtures|poll_live|consolidate|backfill|refresh_aggregates|quality_scan),
      target_ref?,  -- ex.: match_id
      status enum(queued|running|success|failed|dead), attempts,
      started_at, finished_at, error?, stats jsonb)  INDEX (kind, status, started_at)
raw_snapshot(id, provider_id, endpoint, target_ref, payload jsonb, payload_hash,
      fetched_at, ingestion_job_id)  INDEX (target_ref, fetched_at)
data_quality_issue(id, kind enum(missing_stats|orphan_event|conflict|suspect_value|unmapped_entity),
      entity_type, entity_id, description, severity, status enum(open|resolved|ignored),
      detected_at, resolved_by?, resolution?)
audit_log(id, actor enum(system|admin|reconciliation), entity_type, entity_id,
      field, old_value, new_value, reason, created_at)
```

## Pseudo-schema — app e IA

```sql
user(id, email UNIQUE, name?, role enum(user|admin), plan enum(free|pro),
     created_at, deleted_at?)   -- soft delete p/ LGPD, purga assíncrona
ai_query(id, user_id, question, intent?, created_at)
ai_answer(id, ai_query_id, answer_md, tools_called jsonb,  -- nome+args+row counts
     sources jsonb, confidence, latency_ms, tokens_in, tokens_out, cost_usd,
     feedback enum(up|down)?)   -- auditoria completa de cada resposta
```

## Camada analítica (materializada)

```sql
-- Schema analytics — SEMPRE derivado, recalculável, com computed_at
team_season_aggregates(team_id, season_id, scope enum(all|home|away),
     matches, wins, draws, losses, goals_for, goals_against,
     corners_avg, cards_avg, fouls_avg, goals_1st_half, goals_2nd_half, ...,
     computed_at, formula_version)
team_rolling_stats(team_id, as_of_date, window int,  -- "últimos 10 jogos"
     ...mesmas métricas..., computed_at)
referee_profile(referee_id, season_id?, matches, yellows_avg, reds_avg,
     penalties_avg, added_time_avg, computed_at)
stadium_profile(stadium_id, season_id?, matches, goals_avg, cards_avg, computed_at)
standing(season_id, round_number, team_id, position, points, ...)  -- por rodada = histórico de tabela
h2h_summary(team_a_id, team_b_id, matches, a_wins, draws, b_wins, ..., computed_at)
```

Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY` disparado pelo job de
consolidação (pós-jogo) + cron noturno de segurança. Na escala do MVP
(≤ ~2 k partidas/temporada) isso roda em segundos.

## Desafios de modelagem e como o modelo responde

| Desafio | Resposta no modelo |
|---|---|
| Nomes diferentes entre provedores | `provider_entity_map` + `entity_alias`; matching por chave do provedor, nunca por string |
| Jogador transferido | `player_team_stint`; stats de partida apontam para (player, team) da data |
| Temporadas com formatos diferentes | `season` + `stage` + `round` flexíveis; copas usam stages |
| Partida adiada | `status=postponed` + novo `kickoff_at`; histórico no audit_log |
| Evento corrigido depois | `is_corrected` + `superseded_by_event_id` + audit_log; UI marca |
| Árbitro com dados incompletos | NULLs tolerados; perfil só é publicado com `matches >= 5` |
| Estádio renomeado | nome atual + `entity_alias` com nomes históricos |
| Stats divergentes entre fontes | 1 fonte no MVP; V2: `disputed` + fonte primária por categoria |
| Cobertura parcial | `competition.coverage_level` orienta UI e IA |

## Evolução da camada analítica

Gatilhos para sair de MVs no Postgres para algo dedicado (DuckDB/ClickHouse/
warehouse): refresh > 5 min, queries analíticas degradando o operacional,
ou análises ad-hoc pesadas (xG próprio, modelos). Antes disso, é
overengineering — Postgres bem indexado com MVs atende dezenas de milhares de
partidas tranquilamente.
