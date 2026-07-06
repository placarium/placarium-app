# Súmula

> Tudo que acontece em campo — com fonte, timestamp e nível de confiança.

**Súmula** é uma plataforma web de dados, analytics e IA para futebol: jogos ao
vivo, histórico auditável, estatísticas cruzadas por múltiplas dimensões
(time, jogador, árbitro, estádio, campeonato, confronto) e uma camada de IA
conversacional que **nunca inventa estatística** — toda resposta vem de
ferramentas que consultam dados rastreáveis.

O nome vem da **súmula** — o documento oficial em que o árbitro registra tudo
que aconteceu na partida. É exatamente a proposta do produto: ser o registro
confiável, auditável e pesquisável do futebol.

## Estado do projeto

**Fase 0 — pesquisa, validação e definição de escopo.** Nenhuma linha de código
de produto ainda; este repositório contém a documentação de fundação que guia o
desenvolvimento. Comece por [docs/16-recomendacoes-e-proximas-acoes.md](docs/16-recomendacoes-e-proximas-acoes.md).

## Documentação

| Doc | Conteúdo |
|---|---|
| [01](docs/01-visao-geral-e-mvp.md) | Visão geral do produto, personas, diferencial, escopo do MVP |
| [02](docs/02-requisitos-funcionais.md) | Requisitos funcionais por módulo |
| [03](docs/03-requisitos-nao-funcionais.md) | Requisitos não funcionais com metas por estágio |
| [04](docs/04-estrategia-de-dados.md) | Estratégia de dados e avaliação de provedores |
| [05](docs/05-modelo-de-dados.md) | Modelo de domínio, entidades, pseudo-schema |
| [06](docs/06-arquitetura-tecnica.md) | Arquitetura técnica e stack |
| [07](docs/07-system-design-e-infra.md) | System design, ambientes, hospedagem, deploy, resiliência |
| [08](docs/08-realtime-e-ingestao.md) | Real-time e ingestão de eventos |
| [09](docs/09-ia-e-confiabilidade.md) | Camada de IA, tools, anti-alucinação, evals |
| [10](docs/10-ux-e-interface.md) | UX, telas do MVP, mobile/desktop |
| [11](docs/11-modelo-de-negocio.md) | Hipóteses de monetização e validação |
| [12](docs/12-roadmap.md) | Roadmap por fases (0 a 6) |
| [13](docs/13-specs.md) | SPEC-001 a SPEC-020 |
| [14](docs/14-seguranca-legal-compliance.md) | LGPD, licenciamento de dados, riscos legais |
| [15](docs/15-riscos-e-tradeoffs.md) | Matriz de riscos e trade-offs |
| [16](docs/16-recomendacoes-e-proximas-acoes.md) | Recomendação objetiva e plano dos próximos 7 dias |

## Decisões de fundação (resumo)

- **Monorepo** pnpm: `apps/web` (Next.js), `apps/ingest` (worker Node/BullMQ),
  `packages/db` (Drizzle), `packages/core` (domínio), `packages/ai` (tools).
- **Infra MVP**: Vercel (web) + Railway (worker + Redis) + Neon (Postgres).
- **Cobertura MVP**: Brasileirão Série A + Copa do Brasil + Libertadores,
  1 provedor de dados, 3 temporadas de histórico.
- **Real-time MVP**: polling adaptativo (10–20 s) sobre cache Redis; SSE na V1.
- **IA**: Vercel AI SDK + Claude, tools tipadas com Zod sobre camada semântica
  de queries pré-aprovadas. Sem NL→SQL livre.
- **Confiabilidade em primeiro lugar**: todo dado tem origem, timestamp e nível
  de confiança; payloads brutos são arquivados para reprocessamento.

Detalhes e trade-offs de cada decisão estão nos docs correspondentes.
