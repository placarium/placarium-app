# 13. Roadmap de desenvolvimento

Fases sequenciais com critérios de saída explícitos. Não iniciar fase N+1 sem
fechar os critérios da fase N (exceção: pesquisa da fase seguinte pode rodar em
paralelo).

## Fase 0 — Pesquisa, validação e escopo (1–2 semanas)

- **Objetivo**: decidir provedor, validar personas, travar escopo do MVP.
- **Entregáveis**: matriz de avaliação de 2–3 provedores preenchida com trial
  real (doc 04); 10+ entrevistas com persona-alvo; escopo assinado (doc 01);
  verificação de nome/domínio/marca; leitura dos termos de uso dos provedores
  finalistas (doc 14).
- **Decisões**: provedor primário; competições do MVP; preço-âncora do Pro.
- **Riscos**: cobertura BR pior que o anunciado → por isso trial com jogos
  reais antes de assinar anual.
- **Critério de saída**: provedor escolhido com dados de árbitro + minuto a
  minuto validados em ≥ 2 rodadas reais do Brasileirão.

## Fase 1 — Prova de conceito com dados reais (2–3 semanas)

- **Objetivo**: validar modelo de dados e pipeline com histórico, sem UI
  bonita e sem ao vivo.
- **Entregáveis**: monorepo (SPEC-001), schema core (SPEC-003), cliente do
  provedor + normalizadores com fixtures (SPEC-004), backfill de 1 temporada
  da Série A (SPEC-005 parcial), MVs de agregados (SPEC-009 parcial), 5
  queries analíticas respondendo as perguntas-exemplo direto no SQL.
- **Decisões**: confirmar Drizzle/Neon na prática; granularidade real dos
  eventos.
- **Testes**: normalizadores 100 % cobertos por fixtures; agregados validados
  à mão contra 10 partidas assistidas.
- **Critério de saída**: "média de escanteios do Flamengo nos últimos 10
  jogos" responde correto no SQL, com proveniência preenchida.

## Fase 2 — MVP funcional (4–6 semanas)

- **Objetivo**: produto navegável com ao vivo, sem IA ainda.
- **Entregáveis**: ao vivo completo (SPEC-005, 017, 018, 019), dashboard +
  página de partida/time/campeonato/árbitro (SPEC-006, 007), histórico e
  filtros (SPEC-008), auth (SPEC-002), admin mínimo + auditoria (SPEC-011,
  013), observabilidade (SPEC-012), deploy prod (SPEC-016).
- **Riscos**: rate limit no pico de rodada; underestimar estados de UI
  (loading/vazio/sem cobertura).
- **Testes**: rodada completa do Brasileirão acompanhada em produção com
  ≤ 60 s de atraso e 0 evento perdido pós-consolidação.
- **Critério de saída**: 20 usuários beta acompanham uma rodada real sem
  suporte manual.

## Fase 3 — IA conversacional controlada (3–4 semanas)

- **Objetivo**: chat confiável sobre os dados existentes (SPEC-010).
- **Entregáveis**: camada semântica + 10–14 tools, resposta estruturada com
  fontes, guardrails, limites por usuário, golden set de 50 perguntas + evals
  em CI, telas de chat.
- **Riscos**: custo por pergunta; perguntas fora do escopo frustrando — medir
  taxa de recusa e iterar tools na ordem da demanda real.
- **Critério de saída**: evals com 0 alucinação numérica; ≥ 70 % das perguntas
  de beta-users respondidas com dado (não recusa).

## Fase 4 — Analytics avançado (contínuo, 3+ semanas)

- **Objetivo**: aprofundar o diferencial analítico.
- **Entregáveis**: filtros avançados/salvos (RF-11), comparador (RF-12),
  página de jogador completa (RF-07), rolling windows configuráveis, export
  CSV, + Série B/estaduais se cobertura validar.
- **Critério de saída**: guiado pelo uso — construir o que os logs de IA e
  busca mostram que as pessoas procuram.

## Fase 5 — Monetização (2–3 semanas)

- **Objetivo**: converter a waitlist validada.
- **Entregáveis**: Stripe + gates de plano (SPEC-014), página de preços,
  upgrade/downgrade, faturas.
- **Pré-condição**: sinais do doc 11 atingidos. Sem sinal → pivotar antes de
  construir billing.

## Fase 6 — Escala e hardening (contínuo)

- **Objetivo**: robustez para crescimento (SPEC-015 + doc 07 §8.11).
- **Entregáveis**: SSE, réplica de leitura, evals contínuos, segundo provedor
  (reconciliação), SEO estruturado, alertas (RF-13), API B2B se houver demanda.

## Decisões antes de codar vs. adiáveis

| Decidir JÁ (mudar depois é caro) | Adiar sem culpa |
|---|---|
| Provedor primário e termos de uso | Segundo provedor |
| Modelo de dados core + proveniência | Warehouse analítico |
| Monorepo/stack/hospedagem MVP | Migração para containers |
| Padrão de dedup/idempotência | SSE vs polling do cliente |
| Nome e domínio | Org GitHub, white-label, i18n |
| Política de dados pessoais (LGPD mínimo) | Certificações formais |
