# 16. Riscos e trade-offs

Impacto/Probabilidade: A(lto) M(édio) B(aixo).

| # | Risco | Imp. | Prob. | Mitigação | Decisão recomendada | Sinal de alerta |
|---|---|---|---|---|---|---|
| R1 | Custo de dados maior que o previsto | A | M | Escopo de 3 competições; polling O(jogos); trial antes de contrato anual | Teto mensal definido na Fase 0; plano B = só Série A | Fatura > 120 % do planejado por 2 meses |
| R2 | Cobertura BR do provedor pior que anunciada (árbitro, minuto a minuto) | A | A | Trial com 2 rodadas reais + gold standard manual antes de assinar | Critério eliminatório na Fase 0 | > 5 % de eventos divergentes da TV |
| R3 | Dependência de fornecedor único | A | M | raw_snapshots + modelo próprio + provider_entity_map = migração possível | Aceitar no MVP (redundância é V2); cláusula de saída no contrato | Aumento de preço/mudança de termos |
| R4 | Latência/atraso do provedor | M | M | Medir provider_lag separado; timestamp visível na UI protege a confiança | Aceitar 60 s no MVP | provider_lag > 2 min recorrente |
| R5 | Dados inconsistentes/corrigidos | M | A | Reconciliação T+2h/T+24h; audit; quality issues; triagem | Já desenhado (docs 05/08) | Fila de quality issues crescendo semana a semana |
| R6 | Complexidade do real-time subestimada | M | M | Polling simples; SSE adiado; janela de monitoramento bem definida | Não construir websocket no MVP | Bugs recorrentes de dedup/ordenação |
| R7 | Custo de IA por usuário free | A | M | Limite 10/dia; cache; Haiku para triagem; cap global | Limites agressivos desde o dia 1 | Custo IA > 30 % do custo total |
| R8 | IA alucinando apesar dos guardrails | A | B | Tools fechadas + validação numérica de saída + evals com falha dura | Já desenhado (doc 09) | Qualquer alucinação no golden set |
| R9 | Monetização não valida | A | M | Waitlist com preço antes de billing; entrevistas Fase 0 | Billing só na Fase 5 com sinais claros | < 5 % de intenção na waitlist |
| R10 | Concorrência (SofaScore etc. lançam IA) | M | A | Diferencial = confiabilidade+BR+árbitro, não "ter IA" | Não competir em amplitude; nicho analítico | Feature-parity anunciada por um grande |
| R11 | Escopo inflar ("mais um campeonato...") | A | A | Critérios de saída por fase; este doc como contrato consigo mesmo | Recusar expansão antes da Fase 4 | Fase 2 passar de 8 semanas |
| R12 | Virar "mais um site de placar" | A | M | O básico é canal de aquisição, não o produto; investir nos cruzamentos e na IA | Métrica-guia = uso de IA/filtros, não pageviews | Retenção ok mas 0 uso analítico |
| R13 | Risco jurídico (licença, LGPD, apostas) | A | B/M | Doc 14; validações ⚖️ na Fase 0/1 | Sem odds; sem scraping; termos revisados | Notificação de provedor/titular |
| R14 | Custo operacional de um dev solo (burnout de ops) | M | M | Serviços gerenciados; alertas mínimos acionáveis; runbooks | Aceitar custo de PaaS como preço da sanidade | Semana gasta majoritariamente em ops |
| R15 | Histórico caro de manter (storage/reprocessamento) | B | B | Retenção por camada (doc 07 §8.6); arquivar raw antigo | Adiar otimização | Storage > 20 % do custo de infra |

## Trade-offs estruturais assumidos

1. **1 provedor vs. redundância**: aceito risco R3 para cortar 50 % da
   complexidade de ingestão do MVP. Reversível na V2.
2. **Polling vs. push**: aceito 60 s de atraso para eliminar infra de
   streaming. Meta de produto, não limitação técnica disfarçada.
3. **Postgres para tudo vs. stack especializada**: aceito MVs "artesanais"
   para operar um único banco. Gatilhos de saída documentados (doc 05).
4. **Vercel+Railway+Neon vs. cloud única**: aceito 3 dashboards para ter o
   melhor de cada camada com DX máxima. Consolidação é decisão de escala.
5. **IA com tools fechadas vs. NL→SQL**: aceito cobrir menos perguntas em
   troca de zero alucinação. O catálogo cresce guiado pela demanda logada.
