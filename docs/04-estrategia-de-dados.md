# 5. Estratégia de dados

## Princípio

**Confiabilidade antes de abrangência.** Melhor 3 competições com dados
auditáveis do que 30 com buracos silenciosos. Todo dado no sistema responde a
três perguntas: _de onde veio? quando? quão confiável é?_

## Classificação dos dados

| Categoria       | Exemplos                                                  | Origem                                          | Atualização                              |
| --------------- | --------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| **Referência**  | países, competições, times, estádios, árbitros, jogadores | Provedor (backfill) + curadoria manual          | Batch diário/semanal                     |
| **Calendário**  | partidas futuras, horários, adiamentos                    | Provedor                                        | Batch diário + checagem D-1              |
| **Ao vivo**     | placar, eventos, stats em andamento                       | Provedor                                        | Polling 15–60 s durante a janela ao vivo |
| **Consolidado** | resultado final, stats fechadas, escalações finais        | Provedor (re-fetch pós-jogo)                    | T+2 h e T+24 h                           |
| **Derivado**    | médias, standings, perfis de árbitro, "últimos 10 jogos"  | **Calculado por nós** a partir dos consolidados | Recalculado pós-jogo                     |
| **Usuário**     | contas, perguntas de IA, preferências                     | Interno                                         | Tempo real                               |

**Regra de ouro**: dados derivados são sempre recalculáveis do zero a partir
dos dados-base + payloads brutos arquivados. Nunca editar derivado à mão.

## O que armazenar internamente

- **Tudo que exibimos**, normalizado no nosso modelo (doc 05). Não servir
  passthrough da API externa: (a) rate limit, (b) latência, (c) sem
  rastreabilidade, (d) lock-in total.
- **Payloads brutos** (`raw_snapshots`): resposta original do provedor,
  comprimida, com hash. Permite reprocessar sem re-fetch, auditar divergências
  e migrar de provedor. Retenção: ao vivo 90 dias; snapshot final da partida
  permanente (barato, JSONB comprimido ou objeto em storage S3-like na V1).
- **Atenção legal**: verificar no contrato do provedor se armazenamento
  persistente e exibição derivada são permitidos (doc 14). Isso é critério
  eliminatório de escolha.

## Proveniência, versionamento e confiança

Todo registro de fato esportivo carrega:

```
source_provider_id   -- quem forneceu
source_fetched_at    -- quando buscamos
ingestion_job_id     -- qual job gravou (auditoria completa da cadeia)
confidence           -- enum: provider_confirmed | provider_live | derived | manual | disputed
```

- `provider_live`: veio durante o jogo, sujeito a correção.
- `provider_confirmed`: re-verificado na consolidação pós-jogo.
- `derived`: calculado por nós (carrega `computed_at` + versão da fórmula).
- `disputed`: divergência detectada, em triagem no admin.

**Versionamento**: fatos ao vivo são atualizáveis até a consolidação
(`stats_locked_at`). Depois disso, qualquer mudança = novo registro em
`audit_log` com valor anterior, novo valor, motivo e origem. A UI marca
"corrigido".

**Conflitos entre fontes** (relevante a partir da V2 multi-provedor): fonte
primária por categoria de dado + flag `disputed` quando fontes divergem acima
de tolerância; nunca fazer média silenciosa de fontes.

## Reprocessamento e cobertura parcial

- **Reprocessar partida**: replay dos `raw_snapshots` pela mesma pipeline de
  normalização (que deve ser função pura payload→eventos). Botão no admin.
- **Cobertura parcial** (ex.: competição sem minuto a minuto): o modelo tolera
  ausência — página mostra "dados de eventos não disponíveis para esta
  competição" em vez de zeros enganosos. `competition.coverage_level`
  (full / basic / results_only) controla o que a UI promete.
- **Backfill histórico**: job dedicado, fora da janela ao vivo, respeitando
  rate limit (backfill de 3 temporadas × 3 competições ≈ 1,5 k partidas — dias
  de execução lenta, não horas).

## Tipos de provedores

| Tipo                          | Exemplos (a validar, sem assumir preço/disponibilidade)                     | Perfil                                                                    |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Indie-friendly por assinatura | API-Football (API-Sports), Sportmonks, Football-Data.org (grátis, limitado) | Preço acessível, cobertura ampla mas qualidade variável por liga          |
| Profissional B2B              | Sportradar, Stats Perform/Opta, Genius Sports                               | Qualidade e SLA altos; contrato enterprise, provavelmente inviável no MVP |
| Analítico especializado       | StatsBomb, Wyscout/Hudl                                                     | Dados ricos (xG, tracking); foco em clubes, não em live scores            |
| Scraping                      | SofaScore, ge, oGol                                                         | **Descartado**: risco legal + fragilidade                                 |

## Critérios de avaliação (checklist da Fase 0)

Pontuar cada candidato 1–5 em:

1. **Cobertura BR**: Série A com minuto a minuto? Copa do Brasil? Libertadores?
   Escalações? **Árbitro por partida?** (crítico para nosso diferencial)
2. Histórico disponível (≥ 3 temporadas com stats?)
3. Latência de eventos ao vivo (medir num jogo real durante o trial)
4. Granularidade (eventos com minuto+jogador? stats de jogador por partida?)
5. Rate limits vs. nossa necessidade (~10 jogos simultâneos × 1 req/20 s
   ≈ 30 req/min no pico + páginas de contexto)
6. Webhooks/push disponíveis? (reduz polling)
7. Direitos de uso: armazenamento persistente? exibição pública? derivados?
8. Qualidade da documentação e estabilidade de IDs entre temporadas
9. SLA/status page/histórico de incidentes
10. Custo mensal e degraus de upgrade

**Processo**: assinar trial/mês dos 2 finalistas, rodar as mesmas 2 rodadas do
Brasileirão nos dois, comparar contra o que passou na TV (gold standard
manual). Decidir com dados, não com marketing.

## Estratégia de início pequeno

1. **Fase 1 (PoC)**: 1 provedor, 1 competição (Série A), sem ao vivo — só
   ingestão de histórico + agregados. Valida modelo de dados e qualidade.
2. **MVP**: + ao vivo na Série A, + Copa do Brasil e Libertadores se a
   cobertura passar no teste.
3. **V1**: + Série B/estaduais _se_ a cobertura for aceitável; + página de
   jogador completa.
4. **V2**: segundo provedor para redundância/reconciliação nas competições
   core.
