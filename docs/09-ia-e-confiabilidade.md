# 10. IA, RAG e confiabilidade

## Princípio arquitetural

O LLM **nunca é fonte de dados** — é um tradutor de intenção e um redator de
resposta. Fatos vêm exclusivamente de tools que executam queries controladas
sobre o nosso banco. Se as tools não retornam o dado, a resposta é "não tenho
esse dado", nunca uma estimativa do modelo.

```
Pergunta → [Guardrails de entrada] → [LLM: planeja e chama tools]
        → [Camada semântica: queries parametrizadas] → Postgres/Redis
        → [LLM: redige com base SOMENTE nos resultados]
        → [Validação de saída] → Resposta estruturada com fontes
        → ai_query/ai_answer (auditoria completa)
```

## Quando usar e não usar LLM

- **Usar**: interpretar pergunta em linguagem natural; escolher tools e
  parâmetros; redigir explicação; sugerir refinamentos; detectar ambiguidade.
- **Não usar**: calcular estatística (SQL calcula); ranquear/agregar (SQL);
  decidir o que é "confiável" (metadado decide); responder fato sem tool.
- Modelo: **recomendação inicial** Claude (Sonnet para a conversa; Haiku para
  triagem barata de intenção e moderação de entrada) — mas a arquitetura é
  agnóstica de provedor (AI SDK): as tools, a camada semântica e os evals não
  mudam. **A decisão de produção sai do golden set** (abaixo), comparando 2–3
  modelos em alucinação numérica, acerto de tool, qualidade de pt-BR, latência
  e custo/pergunta. Em dev, tier grátis de qualquer provedor serve — com a
  ressalva de nunca enviar dados de usuário real a planos que usem prompts
  para treino (verificar termos).

## Camada semântica (o coração)

**Não é NL→SQL livre.** É um catálogo de consultas parametrizadas, revisadas e
testadas — cada tool expõe um contrato Zod e executa SQL fixo com parâmetros
validados:

```ts
// packages/ai/tools/getRefereeCardAverage.ts
inputSchema = z.object({
  refereeSlug: z.string(),
  seasonLabel: z.string().optional(),      // default: temporada atual
  competitionSlug: z.string().optional(),
  onlyDerbies: z.boolean().default(false),
  minMatches: z.number().int().min(1).default(5),
})
// SQL fixo sobre analytics.referee_profile + filtro; retorna dados + meta:
// { rows, meta: { source, computed_at, sample_size, confidence, query_id } }
```

Toda tool retorna **dados + proveniência**. O prompt de sistema instrui: cite
apenas números presentes em `rows`; inclua `meta` na resposta; se
`sample_size < minMatches`, diga que a amostra é pequena.

## Catálogo de tools (MVP)

| Tool | Responde perguntas como |
|---|---|
| `getLiveMatches()` | "quais jogos estão rolando?" |
| `getMatchDetail(matchId)` | "como está o jogo do Flamengo?" |
| `getTeamRecentStats(team, window, scope, metric)` | "média de escanteios do Flamengo nos últimos 10 jogos" |
| `getTeamSeasonStats(team, season, scope)` | "quantos gols o Palmeiras sofreu fora de casa?" |
| `getRefereeProfile(referee, season?)` | "quantos cartões esse árbitro dá por jogo?" |
| `getStadiumStats(stadium, season?)` | "qual a média de gols no Maracanã?" |
| `getHeadToHead(teamA, teamB)` | "histórico de Grenal" |
| `searchMatches(filtros)` | "jogos do Corinthians com +10 escanteios em 2024" |
| `getCompetitionStats(competition, season)` | "qual campeonato tem mais cartões?" |
| `getPlayerDisciplinaryHistory(player)` | "cartões do Felipe Melo contra o Palmeiras" (V1 se granularidade permitir) |
| `getStandings(competition, season, round?)` | "tabela na rodada 20" |
| `explainDataSource(entityType, id)` | "de onde vem esse dado?" |
| `resolveEntity(name, type)` | desambiguação "qual 'Botafogo'?" — usa alias + trgm |
| `suggestFilters(question)` | converte pergunta em filtros da busca avançada |

Regras: máx. 5 tool calls por pergunta; timeout 10 s por tool; resultados
truncados a N linhas com aviso explícito de truncamento.

## Anti-alucinação e validação

1. **Prompt de sistema**: "Você só afirma números presentes nos resultados
   das tools. Sem resultado = diga que não há dado. Nunca estime."
2. **Validação de saída (determinística)**: extrair números da resposta e
   conferir contra os resultados das tools; discrepância → regenerar 1× →
   persiste → resposta degradada ("encontrei os dados abaixo" + tabela crua).
   Isso torna a alucinação numérica um bug detectável, não um risco difuso.
3. **Resposta estruturada obrigatória** (schema, não texto livre):

```json
{
  "answer_md": "O árbitro X aplicou em média 5,2 cartões...",
  "data_used": [{ "tool": "getRefereeCardAverage", "args": {...}, "rows": 1 }],
  "filters_applied": { "season": "2026", "competition": "brasileirao-a" },
  "period": "Brasileirão 2026, 14 partidas",
  "sources": [{ "provider": "…", "fetched_at": "…", "computed_at": "…" }],
  "confidence": "provider_confirmed | derived | partial",
  "limitations": "Não inclui jogos de Copa do Brasil.",
  "suggested_followups": ["Comparar com a média da competição"]
}
```

## Casos de borda (comportamento definido, não improvisado)

| Caso | Comportamento |
|---|---|
| Dado inexistente | "Não temos esse dado" + o que temos de mais próximo + por quê (coverage_level) |
| Dado incompleto | Responde com o disponível + limitação explícita ("só 2 das 3 temporadas") |
| Dado conflitante | (V2) Mostra fonte primária + nota de divergência |
| Dado desatualizado | Sempre mostra `computed_at`; se partida ao vivo, avisa que consolida após o jogo |
| Pergunta ambígua | `resolveEntity` → pede desambiguação com opções clicáveis |
| Fonte externa não integrada | "Não cobrimos X (ex.: mercado de transferências)" — sem tentar responder |
| Fato × opinião | Responde o fato com dados; opinião declarada como interpretação, sem números inventados |
| Probabilidade/previsão | **Não prevê.** Mostra padrão histórico ("nos últimos 20 jogos, 65 % tiveram +9 escanteios") com aviso: padrão ≠ previsão. Nunca sugerir aposta |

## Segurança

- **Prompt injection**: conteúdo de banco/usuário nunca vira instrução —
  resultados de tools entram como dados delimitados; instruções fixas no
  system prompt; tools são read-only por construção (role Postgres de leitura
  + statement timeout); sem tool de "executar SQL".
- **Abuso**: rate limit por usuário/plano; moderação de entrada (Haiku) para
  desvio de finalidade; cap de custo diário global com desligamento gracioso.
- **Auditoria**: `ai_query`/`ai_answer` guardam pergunta, tools+args,
  resposta, custo, latência, feedback 👍/👎 — base dos evals e da melhoria.

## Evals (desde o MVP, simples)

- **Golden set**: ~50 perguntas reais (as deste documento + entrevistas) com
  resposta esperada verificada à mão contra o banco de fixtures.
- Rodar em CI semanal + a cada mudança de prompt/tool: acurácia numérica
  (contra fixtures), taxa de recusa correta (perguntas sem dado), taxa de
  alucinação (números fora das tools = falha dura), custo médio.
- Meta MVP: 0 alucinação numérica no golden set; ≥ 90 % de acerto de tool
  escolhida; 100 % das respostas com bloco de fontes.
- Feedback 👍/👎 dos usuários alimenta novos casos do golden set.
