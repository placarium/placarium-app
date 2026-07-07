# 20. Provedores: pricing, demanda estimada e orçamento do MVP

> **Snapshot de preços: 2026-07-06** (fontes: páginas oficiais de pricing).
> Preços mudam — reconferir antes de assinar. Este doc alimenta a matriz de
> avaliação do doc 04; a decisão final continua dependendo do **trial com
> jogos reais** (qualidade > preço).

## 1. Pricing dos candidatos

| Provedor | Plano relevante | Preço | Limites | Cobertura |
|---|---|---|---|---|
| **API-Football** (api-sports.io) | Free | $0 | 100 req/dia | Todas as competições e endpoints em todos os planos |
| | **Pro** | **US$ 19/mês** | 7.500 req/dia | idem |
| | Ultra | US$ 29/mês | 75.000 req/dia | idem |
| | Mega | US$ 39/mês | 150.000 req/dia | idem |
| **Sportmonks** | **Starter** | **€ 29/mês** (€24 anual) | 2.000 chamadas/entidade/hora | Escolhe **5 ligas** (Série A, Copa do Brasil e Libertadores cabem); liga extra €4/mês |
| | Growth | € 99/mês | 2.500/entidade/hora | 30 ligas (inclui estaduais, Série B, Sudamericana) |
| | Pro | € 249/mês | 3.000/entidade/hora | 120 ligas |
| **Football-Data.org** | Free | € 0 | 10 req/min | 12 competições fixas (verificar inclusão da Série A na página de coverage) |
| | Free + Deep Data | € 29/mês | 30 req/min | + escalações/cartões; stats detalhadas são add-on de €15/mês |
| **Enterprise** (Opta/Stats Perform, Sportradar, Genius) | — | Sem preço público; tipicamente contrato anual de 4–5 dígitos/mês | SLA, direitos oficiais | Destino na escala B2B, fora do MVP |

Observações estruturais:
- **API-Football** cobra por volume, não por liga — todas as competições em
  qualquer plano. Melhor custo de entrada do mercado.
- **Sportmonks** cobra por liga — nosso escopo de 3 competições cabe no
  Starter, e expandir para estaduais/Série B (V1) já força o Growth (€99).
  Trial de 14 dias grátis.
- **Football-Data.org** não serve como primário (sem minuto a minuto rico,
  limites baixos, stats como add-on) — papel: baseline gratuita de conferência
  e fixtures de desenvolvimento.

## 2. Demanda estimada do Placarium (modelo de cálculo)

Escopo MVP: Série A (~380 jogos/ano) + Copa do Brasil (~120) + Libertadores
(~155) ≈ **655 jogos/ano** (~55/mês).

**Por jogo ao vivo** (polling adaptativo, média 20 s, janela de ~160 min =
15 min pré + jogo + buffer):
- Ao vivo: 160 min × 3 req/min ≈ **480 req**
- Pré-jogo (escalações, confirmações): ~4 req
- Consolidação T+2h e T+24h: ~8 req
- **Total ≈ 500 req/jogo**

| Cenário | Cálculo | Requests/dia |
|---|---|---|
| Dia médio (2 jogos) | 2 × 500 + crons (~50) | **~1.100** |
| Dia de rodada cheia (10 jogos) | 10 × 500 + crons | **~5.100** |
| Mês típico | 55 jogos × 500 + crons | **~29.000/mês** |
| Backfill histórico (one-time) | ~1.970 partidas × 4 req | ~8.000 (diluído em 2–3 dias) |
| Pico de taxa | 10 jogos simultâneos × 3 req/min | **30 req/min** |

**Conclusões do modelo:**
- O **Pro do API-Football (7.500/dia) cobre o pior dia com ~30 % de folga** —
  e o polling adaptativo (20 s → 30 s quando o orçamento aperta) dá margem
  extra. Ultra ($29) elimina qualquer preocupação.
- No Sportmonks Starter, 2.000/entidade/hora também comporta (30 req/min ≈
  1.800/h no pico), sem folga confortável — mitigável pelo adaptativo.
- O custo é **O(jogos), não O(usuários)** — usuários leem do nosso cache.
  1.000 usuários custam o mesmo que 10 em chamadas externas.

## 3. Orçamento mensal do MVP

| Item | Dev (agora) | Produção/beta |
|---|---|---|
| Provedor de dados | $0 (free tiers + trials) | **US$ 19–29** (API-Football Pro/Ultra) |
| Supabase (Postgres SP) | $0 (free) | US$ 25 (Pro: PITR, backups) |
| Railway (worker + Redis) | ~US$ 5 | ~US$ 10–15 |
| Vercel | $0 (Hobby) | $0–20 (Pro se exceder) |
| Sentry + Axiom + Better Stack | $0 (free tiers) | $0 |
| IA (dev + evals) | < US$ 5 | escala com uso; free tier limitado a ~US$ 0,02/pergunta |
| Domínios (anual, não mensal) | ~R$ 40 (.com.br) + ~US$ 15 (.app) | idem |
| **Total mensal** | **~US$ 10** (~R$ 55) | **~US$ 55–90** (~R$ 300–500) |

Teto de segurança recomendado até a monetização: **R$ 600/mês** — com alertas
de billing em cada plataforma (doc 07 §8.5).

## 4. Monetização (resumo executivo; detalhes no doc 11)

Unit economics decorrente do modelo acima:
- **Custo fixo** ≈ R$ 300–500/mês (independe de usuários).
- **Custo marginal por usuário ativo** ≈ só IA: free com 10 perguntas/dia,
  uso real esperado ~R$ 1–3/mês por ativo (com cache e triagem barata).
- **Plano Pro** com âncora R$ 19,90–29,90/mês (referência: ferramentas que a
  persona já assina) → **break-even com ~20–30 assinantes**.
- Sequência: waitlist com preço exposto no MVP → billing só na Fase 5 com
  ≥5 % de intenção → B2B/API própria como segundo ato (exige revisar cláusula
  de sublicenciamento do provedor).
- Fora da mesa: odds/afiliados de apostas (jurídico + posicionamento).

## 5. Recomendação

1. **Trial duplo imediato**: API-Football Pro (US$ 19, mensal, sem
   renovação automática) + Sportmonks Starter (14 dias grátis). Rodar as
   mesmas 2 rodadas nos dois; matriz do doc 04 decide. Critério eliminatório:
   árbitro por partida + minuto a minuto fiel + termos permitindo
   armazenamento e exibição.
2. **Hipótese a confirmar**: API-Football Pro como primário do MVP — melhor
   relação custo/cobertura ($19, todas as ligas, 7.500/dia). O risco a testar
   é qualidade/latência, não preço.
3. Football-Data.org free como baseline de conferência automática (V1:
   detector de divergência barato).
