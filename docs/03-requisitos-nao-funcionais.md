# 4. Requisitos não funcionais

Metas por estágio. **MVP** = validação com até ~1 k usuários; **V1** = primeira
versão pública (~10 k usuários); **Escala** = crescimento (~100 k+).

## Performance e latência

| Métrica                                  | MVP                | V1       | Escala   |
| ---------------------------------------- | ------------------ | -------- | -------- |
| LCP (páginas principais, p75, mobile)    | < 2,5 s            | < 2,0 s  | < 1,8 s  |
| API de leitura cacheada (p95)            | < 300 ms           | < 200 ms | < 150 ms |
| API de leitura não cacheada (p95)        | < 800 ms           | < 500 ms | < 400 ms |
| Atraso do placar vs. provedor            | ≤ 60 s             | ≤ 30 s   | ≤ 15 s   |
| Atualização da timeline ao vivo          | ≤ 60 s             | ≤ 30 s   | ≤ 20 s   |
| Primeira resposta da IA (streaming, p95) | < 4 s até 1º token | < 3 s    | < 3 s    |
| Resposta completa da IA (p95)            | < 20 s             | < 15 s   | < 12 s   |

_Nota_: o atraso total = atraso do provedor + nosso pipeline. Só controlamos o
nosso; medi-lo separado (`provider_lag` vs `pipeline_lag`) desde o MVP.

## Disponibilidade e confiabilidade

| Métrica                     | MVP                                              | V1           | Escala   |
| --------------------------- | ------------------------------------------------ | ------------ | -------- |
| Disponibilidade web         | 99 % (best effort)                               | 99,5 %       | 99,9 %   |
| Taxa de erro 5xx            | < 1 %                                            | < 0,5 %      | < 0,1 %  |
| Perda de eventos de partida | 0 tolerada (reconciliação corrige)               | idem         | idem     |
| RTO (recuperação de falha)  | < 4 h                                            | < 1 h        | < 15 min |
| RPO (perda de dados)        | ≤ 24 h (backup diário) + raw payloads rejogáveis | ≤ 1 h (PITR) | ≤ 5 min  |
| Jobs de ingestão atrasados  | alerta se > 5 min                                | > 2 min      | > 1 min  |

## Consistência de dados

- **Ao vivo**: eventual consistency aceitável; UI mostra "atualizado há Xs".
- **Pós-consolidação** (T+24 h): dados imutáveis salvo correção auditada;
  qualquer correção gera entrada em `audit_log` e badge visual.
- **Idempotência**: reprocessar o mesmo payload N vezes = mesmo estado final.
- **Agregados** nunca divergem dos eventos-base: são sempre derivados, nunca
  editados à mão.

## Segurança e LGPD (detalhes no doc 14)

- Secrets fora do código; permissões mínimas por serviço.
- Rate limiting por IP (anônimo) e por usuário (autenticado) em todas as APIs;
  limite agressivo na IA.
- Dados pessoais coletados: e-mail + histórico de perguntas. Política de
  retenção de logs de IA: 12 meses, anonimização depois. Endpoint de
  exclusão de conta (LGPD art. 18) desde o MVP.
- Admin atrás de role + 2FA (do provedor de auth).

## Custos (tetos operacionais, a calibrar com preços reais)

| Item                          | MVP                                            | Regra                                           |
| ----------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Provedor de dados             | teto mensal definido na Fase 0                 | alertar a 80 % do rate limit                    |
| Infra (Vercel+Railway+Neon)   | teto mensal baixo, revisado por mês            | alerta de billing em cada plataforma            |
| IA                            | custo por pergunta monitorado; hard cap mensal | free: 10 perguntas/dia; corte automático no cap |
| Custo total por usuário ativo | métrica acompanhada desde o MVP                | define preço do plano pago                      |

_Não estimo valores absolutos aqui — preços de provedores e de tokens mudam;
a Fase 0 preenche esta tabela com números reais._

## Observabilidade (detalhes no doc 07 §8.8)

- Logs estruturados (JSON) com `request_id`/`job_id` correlacionáveis.
- Métricas mínimas do MVP: latência de API, atraso de ingestão, profundidade
  de fila, erros por job, consumo de rate limit do provedor, custo de IA/dia.
- Error tracking (Sentry) em web e worker desde o dia 1.

## Cache

- Páginas: ISR/route cache do Next (60 s–1 h conforme volatilidade).
- Dados ao vivo: Redis, TTL 15–30 s, invalidado por escrita do worker.
- Agregados: views materializadas + cache de resposta 5–15 min.
- Regra: **toda resposta cacheada carrega `computed_at`** — o cache nunca pode
  quebrar a promessa de timestamp visível.

## Responsividade, acessibilidade, i18n, SEO

- Mobile-first; breakpoints testados em 360 px, 768 px, 1280 px.
- Acessibilidade: alvo WCAG AA em contraste e navegação por teclado no MVP;
  auditoria completa na V1.
- i18n: arquitetura preparada (strings centralizadas), mas **só pt-BR** até
  haver demanda real.
- SEO: páginas de partida/time/campeonato são públicas e renderizadas no
  servidor — SEO é canal de aquisição relevante (long-tail "flamengo x
  palmeiras estatísticas"). Sitemap + metadados estruturados (schema.org
  `SportsEvent`) na V1.
