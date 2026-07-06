# 3. Requisitos funcionais

Prioridades: **MVP** (indispensável), **V1** (primeira versão pública madura),
**Futuro** (pós-validação). Complexidade: B(aixa) / M(édia) / A(lta).

## Tabela-mestre

| # | Módulo | Descrição | Prioridade | Compl. | Dependências | Observações |
|---|---|---|---|---|---|---|
| RF-01 | Autenticação | Magic link + Google OAuth, sessão, perfil mínimo | MVP | B | — | Necessária para rate limit de IA por usuário |
| RF-02 | Dashboard ao vivo | Jogos do dia agrupados por competição, placar, minuto, eventos-chave | MVP | M | RF-16, RF-17 | Polling adaptativo sobre cache |
| RF-03 | Página de partida | Placar, escalações, timeline minuto a minuto, stats do jogo, H2H resumido, árbitro | MVP | A | RF-16, RF-17 | Tela mais importante do produto |
| RF-04 | Página de time | Elenco, últimos/próximos jogos, médias (gols, cartões, escanteios, casa/fora, 1º/2º tempo) | MVP | M | RF-09 | Agregados vêm materializados |
| RF-05 | Página de campeonato | Tabela, rodadas, artilharia, stats agregadas da competição | MVP | M | RF-09 | Standings materializados |
| RF-06 | Página de árbitro | Perfil + médias derivadas: cartões/jogo, pênaltis, acréscimos | MVP (básico) | M | RF-09 | Derivado dos nossos eventos; diferencial barato |
| RF-07 | Página de jogador | Perfil, stats por temporada, histórico disciplinar | V1 | M | RF-16 | Granularidade depende do provedor |
| RF-08 | Página de estádio | Perfil + média de gols/cartões no local | V1 | B | RF-09 | Deriva das mesmas tabelas |
| RF-09 | Estatísticas agregadas | Views materializadas de médias por time/árbitro/estádio/competição, janelas (últimos N, casa/fora, tempo do jogo) | MVP | A | RF-16 | Coração analítico; recalculadas pós-jogo |
| RF-10 | Histórico e busca | Lista de partidas com filtros (time, competição, temporada, mando, resultado, árbitro) + busca por nome | MVP | M | RF-16 | Busca textual simples (pg_trgm) no MVP |
| RF-11 | Filtros avançados | Combinações salvas, filtros por faixa estatística ("jogos com >10 escanteios") | V1 | A | RF-09, RF-10 | No MVP, a IA cobre parte disso |
| RF-12 | Comparação entre times | H2H completo, forma recente lado a lado | V1 | M | RF-09 | MVP tem H2H resumido na página de partida |
| RF-13 | Alertas | Gol/cartão/início de jogo por push/e-mail; alertas estatísticos ("jogo passou de N escanteios") | V1/Futuro | A | RF-17 | Alertas estatísticos são diferencial, mas caros |
| RF-14 | Camada de IA | Chat com tools fechadas, respostas com fonte/confiança, histórico de conversas, limites por plano | MVP | A | RF-09, RF-15 | Doc 09 detalha |
| RF-15 | Auditoria de fontes | Toda entidade/stat expõe origem, timestamp, confiança; página "de onde vêm os dados" | MVP | M | RF-16 | Nasce no schema, não é retrofit |
| RF-16 | Ingestão e sync | Descoberta de partidas, polling ao vivo, consolidação pós-jogo, backfill histórico, mapeamento de entidades | MVP | A | provedor | Doc 08 detalha |
| RF-17 | Realtime updates | Propagação de atualização ao cliente (polling cacheado → SSE na V1) | MVP | M | RF-16 | Doc 08 |
| RF-18 | Painel admin | Status de jobs, saúde do provedor, fila de data quality, re-disparo de reconciliação, gestão de mapeamentos | MVP (mínimo) | M | RF-16 | Interno, atrás de role admin |
| RF-19 | Data quality | Detecção de anomalias (stats faltantes, eventos órfãos, divergências), fila de triagem | MVP (básico) / V1 (completo) | A | RF-16 | MVP: flags automáticas + triagem manual |
| RF-20 | Billing | Assinatura, planos, gates de feature | Fase 5 | M | RF-01 | Stripe; só após validar disposição a pagar |

## Detalhamento dos módulos MVP

### RF-02 Dashboard ao vivo
- **Objetivo**: em ≤ 3 s o usuário sabe o que está acontecendo agora.
- **Funcionalidades**: lista de jogos por status (ao vivo / hoje / encerrados),
  placar, minuto, cartões e gols como ícones, filtro por competição, indicador
  de "dados atualizados há Xs".
- **Dados**: `matches` do dia + snapshot ao vivo do Redis.
- **Critério de aceite**: placar reflete o provedor com ≤ 60 s de atraso; sem
  refresh manual.

### RF-03 Página de partida
- **Estados**: pré-jogo (escalações prováveis/confirmadas, H2H, árbitro),
  ao vivo (timeline + stats atualizando), pós-jogo (consolidado + badge
  "dados consolidados em <timestamp>").
- **Timeline**: eventos ordenados por minuto+sequência, com tipo, jogador,
  time; correções pós-jogo marcadas visualmente ("evento corrigido").
- **Stats**: posse, chutes, chutes a gol, escanteios, faltas, impedimentos,
  cartões — cada bloco com badge de origem.

### RF-14 Camada de IA (resumo; detalhes no doc 09)
- Chat com streaming; tools fechadas; resposta estruturada com: resposta
  direta, dados usados, filtros aplicados, período, fonte, timestamp,
  confiança, limitações, sugestões de refinamento.
- Limite de uso: N perguntas/dia no free (proposta inicial: 10/dia; calibrar
  por custo real).

### RF-18 Admin (mínimo do MVP)
- Tabela de `ingestion_jobs` com status/erros/latência.
- Fila de `data_quality_issues` com ações: ignorar, reprocessar, corrigir
  mapeamento.
- Botão "reconciliar partida" manual.
- Health do provedor: taxa de erro, latência, consumo de rate limit.
