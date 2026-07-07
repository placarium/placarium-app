# 12. Modelo de negócio

**Tudo aqui é hipótese a validar** — nenhuma linha abaixo é certeza. Billing só
entra na Fase 5, depois de sinal claro de disposição a pagar.

## Hipótese principal: freemium B2C → B2B depois

| Camada               | O quê                                                                                                   | Por quê                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Free**             | Ao vivo, páginas de time/campeonato/partida, histórico da temporada atual, 10 perguntas de IA/dia       | Topo de funil + SEO; o básico é comoditizado, não dá para cobrar                                               |
| **Pro (individual)** | Histórico completo, filtros avançados/salvos, IA com limite alto, export CSV, (V1) alertas estatísticos | A dor real da persona-alvo está no cruzamento e na profundidade                                                |
| **Creator/Analista** | Tudo do Pro + gráficos exportáveis com marca, relatórios pré-jogo gerados                               | Valor profissional direto (conteúdo citável)                                                                   |
| **B2B (futuro)**     | API própria, white-label de widgets, relatórios para clubes/mídia                                       | Só com marca e dados validados; exige revisão de licença com o provedor (revenda de dados é cláusula sensível) |

## O que nunca fazer

- Vender "dicas de aposta" ou probabilidades — risco legal/regulatório
  (mercado de apostas regulado) e destrói o posicionamento de confiabilidade.
- Depender de odds como feature central antes de validação jurídica (doc 14).
- Prometer SLA de dados que dependem do rate limit de um provedor barato.

## Validação de disposição a pagar (antes de construir billing)

1. **Fase 0**: 10–15 entrevistas com a persona-alvo (grupos de apostas
   analíticas, criadores de conteúdo tático, cartoleiros hardcore).
2. **MVP**: waitlist do plano Pro com preço exposto (âncora: preço de
   ferramentas que já assinam) — mede intenção real, não elogio.
3. Sinal verde para billing: ≥ 5 % dos usuários ativos entram na waitlist
   **e** ≥ 30 % dos ativos usam IA/filtros (a feature paga) semanalmente.

## Métricas de acompanhamento

- Ativação: % de cadastros que consultam ≥ 3 páginas ou fazem 1 pergunta à IA
  na primeira sessão.
- Retenção semanal (W1, W4) — a métrica-rainha do MVP.
- Uso de IA: perguntas/usuário/semana; taxa de resposta útil (👍).
- Custo por usuário ativo (infra + dados + IA) — define viabilidade do free.
- Intenção: conversão para waitlist Pro.

## Riscos de negócio específicos

- **Custo por usuário free** com IA pode inviabilizar o funil → limites
  agressivos desde o dia 1, cache de respostas frequentes.
- **Licença do provedor pode proibir** exibição pública gratuita, export ou
  revenda → checar contrato antes de definir os planos (doc 14).
- **Sazonalidade**: entressafra do calendário BR derruba engajamento →
  conteúdo histórico/comparativo mitiga.
