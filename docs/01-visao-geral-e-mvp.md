# 1. Visão geral do produto

## O que é

**Placarium** é uma plataforma web que reúne, organiza e torna pesquisável
praticamente tudo que envolve uma partida de futebol: jogos ao vivo, histórico,
estatísticas por time/jogador/árbitro/estádio/campeonato, timeline minuto a
minuto — tudo com **origem, timestamp e nível de confiança explícitos** — mais
uma camada de IA conversacional que responde perguntas em linguagem natural
consultando exclusivamente esses dados.

## Problema que resolve

Hoje, quem quer responder uma pergunta como _"quantos cartões esse árbitro dá
por jogo em clássicos?"_ precisa:

1. Garimpar 3–4 sites (SofaScore, ge, Wikipedia, oGol), cada um com recorte
   diferente e sem dizer de onde o dado veio;
2. Montar planilha manual, sem garantia de consistência;
3. Confiar em "estatísticas de Twitter" sem fonte.

Sites de placar mostram **o que está acontecendo**; quase nenhum permite
**cruzar dimensões** (árbitro × estádio × confronto × período do jogo) nem
garante rastreabilidade. E os que permitem (Opta/StatsPerform, Wyscout) são
B2B, caros e fechados. O Placarium ocupa o meio: profundidade analítica de
ferramenta profissional com UX de produto de consumo, com prioridade para
**Brasil e América do Sul** — justamente onde a cobertura dos players globais é
mais rasa.

## Personas

| Persona                          | Job-to-be-done                                                                          | Disposição a pagar (hipótese) |
| -------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| Torcedor avançado                | Acompanhar o time com contexto que o placar não dá                                      | Baixa–média                   |
| Apostador analítico              | Basear decisões em padrões históricos verificáveis (sem tips, sem incentivo — só dados) | **Alta**                      |
| Criador de conteúdo / jornalista | Estatística citável com fonte, rápida de achar antes do deadline/vídeo                  | Média–alta                    |
| Analista de desempenho / scout   | Filtros cruzados e exportação para relatórios                                           | Alta (B2B)                    |
| Fantasy player (Cartola)         | Tendências de scout por jogador/adversário                                              | Média                         |
| Clube pequeno                    | Análise de adversário sem pagar Wyscout                                                 | Média (B2B)                   |
| Usuário comum                    | Ver jogos de hoje com mais contexto                                                     | Nula (topo de funil)          |

**Persona-alvo do MVP**: apostador analítico + criador de conteúdo. São os que
sentem a dor com mais frequência (toda rodada), verbalizam perguntas
específicas (encaixa na IA) e têm referência de pagamento (já assinam
FootyStats, RedGol etc.). _Hipótese a validar na Fase 0 com entrevistas._

## Diferencial competitivo

1. **Rastreabilidade como feature visível** — todo número tem badge de origem,
   timestamp e confiança. Nenhum concorrente de consumo faz isso.
2. **IA que não inventa** — responde só via ferramentas sobre dados auditados,
   diz "não tenho esse dado" quando não tem, e mostra a consulta que fez.
3. **Dimensão árbitro como cidadã de primeira classe** — média de cartões,
   pênaltis, acréscimos por árbitro; praticamente inexistente em produtos BR.
4. **Foco Brasil/América do Sul** — cobertura e nomenclatura locais (fases de
   Libertadores, estaduais no futuro), enquanto FotMob/SofaScore tratam a
   região como periferia.

## Referências de mercado

- **SofaScore, FotMob, Flashscore**: placar + stats de consumo. Fortes em
  amplitude, fracos em cruzamento e rastreabilidade. Não competir em amplitude.
- **FootyStats, WhoScored, Understat**: stats para apostadores/analíticos.
  Referência de tabelas densas; UX datada; cobertura BR mediana.
- **Opta/StatsPerform, StatsBomb, Wyscout/Hudl**: B2B profissional. Referência
  de rigor; inacessíveis ao nosso público.
- **ge.globo**: alcance BR gigante, análise rasa. Referência de linguagem, não
  de produto.

## Oportunidades

- Nenhum player combina **BR-first + rastreabilidade + IA conversacional**.
- Mercado de apostas regulamentado no Brasil (Lei 14.790/2023) criou demanda
  explícita por dados confiáveis — sem precisarmos ser um produto de apostas.
- Criadores de conteúdo esportivo em vídeo/newsletter crescem e precisam de
  estatística citável.

## O que torna o projeto difícil

- **Dados custam caro** e o licenciamento restringe o que se pode exibir e
  armazenar (ver doc 14).
- **Qualidade de cobertura BR** varia por provedor; minuto a minuto de Série B
  para baixo é fraco em quase todos.
- **Real-time é operacionalmente caro** (rate limits, picos, reconciliação).
- **Concorrentes gratuitos e excelentes** no básico — o básico não diferencia.
- **IA confiável sobre dados é trabalho de engenharia**, não de prompt.

---

# 2. Escopo do MVP

## Princípio

O MVP existe para validar UMA tese: _"pessoas analíticas pagam por estatística
de futebol cruzável, confiável e perguntável em linguagem natural, focada no
Brasil"_. Tudo que não testa essa tese fica fora.

## Dentro do MVP

| Item                                                                                                 | Por quê                                                                     |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **3 competições**: Brasileirão Série A, Copa do Brasil, Libertadores                                 | Suficiente para a persona-alvo; limita custo de dados. Fallback: só Série A |
| **1 provedor de dados**                                                                              | Reconciliação multi-fonte é V2; 1 fonte bem auditada > 2 mal integradas     |
| Placar ao vivo + timeline de eventos (atraso ≤ 60 s)                                                 | Tese exige "ao vivo", mas 60 s bastam — não é produto de trading            |
| Histórico de 3 temporadas                                                                            | Mínimo para médias móveis fazerem sentido ("últimos 10 jogos")              |
| Páginas: home/ao vivo, partida, time, campeonato, árbitro (perfil básico derivado)                   | Núcleo navegável                                                            |
| Filtros essenciais: por time, competição, temporada, mandante/visitante, período do jogo             | Cobrem 80 % das perguntas-exemplo                                           |
| Estatísticas agregadas materializadas (médias de gols, cartões, escanteios por time/árbitro/estádio) | É o diferencial; derivável dos eventos que já ingerimos                     |
| **IA conversacional com 8–12 tools fechadas**                                                        | Escopo controlado; sem SQL livre                                            |
| Badge de origem/timestamp/confiança em todo dado                                                     | Diferencial nº 1; barato se nascer no modelo de dados                       |
| Auth simples (magic link + Google)                                                                   | Necessária para limitar custo de IA por usuário                             |
| Admin mínimo: status de ingestão + fila de data quality                                              | Sem isso, operar às cegas                                                   |
| Observabilidade essencial: Sentry, logs estruturados, uptime                                         | Custo baixo, evita voar às cegas                                            |

## Fora do MVP (e por quê)

| Item                                      | Destino                      | Motivo                                                          |
| ----------------------------------------- | ---------------------------- | --------------------------------------------------------------- |
| Odds                                      | Avaliar na V2+, com jurídico | Risco legal/licenciamento; não testa a tese                     |
| Alertas/push                              | V1                           | Exige infra de notificação; valor só com base de usuários       |
| Comparador visual de times                | V1                           | A IA cobre o caso de uso no MVP                                 |
| Multi-provedor + reconciliação automática | V2                           | Complexidade alta; começar com flags de qualidade manuais       |
| Página de jogador completa                | V1                           | Depende de granularidade do provedor; perfil básico ok          |
| App nativo                                | Futuro                       | Web responsiva valida a tese                                    |
| API pública / B2B                         | Futuro                       | Sem demanda comprovada ainda                                    |
| xG e métricas avançadas                   | V2                           | Ou vem caro do provedor, ou exige modelo próprio                |
| Internacionalização                       | Futuro                       | BR-first é o diferencial                                        |
| Billing                                   | Fase 5                       | Validar disposição a pagar com waitlist/entrevistas antes       |
| Websockets                                | V1                           | Polling sobre cache atende 60 s de atraso por fração do esforço |
| Estaduais e Série B                       | V1+                          | Cobertura de provedor tipicamente pior; validar antes           |

## Funcionalidades perigosas no início

- **Scraping** de SofaScore/ge para "completar" dados: risco legal e de
  qualidade. Não fazer.
- **NL→SQL aberto** na IA: risco de vazamento, custo e alucinação. Tools
  fechadas apenas.
- **Cobrir "todos os campeonatos"**: multiplica custo de dados e suporte sem
  multiplicar aprendizado.
- **Data warehouse dedicado no dia 1**: Postgres + views materializadas
  aguentam anos nessa escala (ver doc 05).

## Critério de sucesso do MVP

Ver métricas em [16-recomendacoes-e-proximas-acoes.md](16-recomendacoes-e-proximas-acoes.md).
Resumo: retenção semanal ≥ 25 % dos cadastrados, ≥ 30 % dos ativos usam a IA
mais de 1×/semana, NPS qualitativo das entrevistas, lista de espera para plano
pago com ≥ 5 % de conversão de intenção.
