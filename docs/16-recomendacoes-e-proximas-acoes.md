# 17. Recomendações finais

## Recomendação objetiva

Se eu fosse construir isto do zero, sozinho, otimizando velocidade + qualidade
+ confiabilidade + custo controlado + evolução:

1. **Nome**: **Súmula** — curto, brasileiro, e é literalmente o documento
   oficial e auditável da partida: o produto inteiro numa palavra. Repo
   `lsstomas/sumula` (privado); org `sumula-app` (livre no GitHub) quando
   abrir. Validar domínio (`sumula.app`/`sumula.com.br`) e colisões de marca
   no INPI na Fase 0 — a busca web estava indisponível na criação deste doc.
2. **Semana 1 em duas frentes**: trial de 2 provedores com jogos reais +
   monorepo com pipeline de fixtures. **Não escrever UI antes de ver a
   qualidade real dos dados** — é o maior risco do projeto (R2) e o mais
   barato de testar primeiro.
3. **Stack travada** (doc 06): pnpm monorepo · Next.js/TS na Vercel (RSC para
   leitura, Server Actions para mutação) · worker Node/BullMQ + Redis no
   Railway · Postgres no Supabase-SP (como Postgres puro) · Drizzle · Better
   Auth · AI SDK (modelo por evals) · Sentry/Axiom/Better Stack.
4. **Escopo travado** (doc 01): Série A + Copa do Brasil + Libertadores,
   3 temporadas, ao vivo ≤ 60 s, IA com tools fechadas, badges de confiança.
5. **Sequência**: Fase 1 (PoC de dados) antes de qualquer tela. A pergunta
   "média de escanteios do Flamengo nos últimos 10" respondida em SQL puro com
   proveniência é o marco que valida a fundação inteira.

### O que NÃO fazer agora

Segundo provedor · odds · alertas · app nativo · warehouse · microserviços ·
websockets · billing · i18n · SEO estruturado · estaduais. Tudo tem gatilho
definido nos docs 07/12 — nada disso é "nunca", é "ainda não".

### Perguntas estratégicas a responder antes de codar

1. Qual provedor passa no teste de cobertura BR (com árbitro)? → Fase 0
2. A persona-alvo paga? Por quê exatamente? → entrevistas Fase 0
3. Os termos do provedor permitem nosso modelo (armazenar, exibir, derivar)? → ⚖️
4. Qual o teto de gasto mensal aceitável até a monetização? (decisão pessoal
   de runway — trave um número)
5. Nome livre em domínio/INPI? (verificação pendente — web search indisponível
   na Fase -1)

### Artefatos antes de implementar

Todos criados neste repositório: visão/escopo (doc 01), requisitos (02/03),
estratégia e modelo de dados (04/05), arquitetura (06/07), realtime (08),
IA (09), UX (10), negócio (11), roadmap (12), specs (13), legal (14),
riscos (15). Falta produzir na Fase 0: matriz de provedores preenchida,
resumo das entrevistas, e o golden set inicial de perguntas.

### Métricas de sucesso do MVP

| Métrica | Meta |
|---|---|
| Retenção W1 dos cadastrados | ≥ 40 % |
| Retenção W4 | ≥ 25 % |
| Ativos usando IA/filtros ≥ 1×/semana | ≥ 30 % |
| Alucinação numérica no golden set | 0 |
| Atraso ao vivo ponta a ponta | ≤ 60 s |
| Eventos perdidos pós-consolidação | 0 |
| Intenção de pagamento (waitlist Pro) | ≥ 5 % dos ativos |
| Custo por usuário ativo/mês | < preço planejado do Pro |

---

# 18. Próximas ações imediatas (7 dias)

> Premissa: 1 dev full-stack, dedicação alta. Ajustar proporcionalmente.

## Dia 1 — Provedores: shortlist e inscrição
- **Objetivo**: iniciar os trials (é o caminho crítico do projeto).
- **Tarefas**: listar 3–4 candidatos (API-Football/API-Sports, Sportmonks,
  Football-Data.org como baseline grátis, +1 achado em pesquisa); criar contas
  trial/entry dos 2 mais promissores; ler docs de cobertura BR; **ler os
  termos de uso** com o checklist do doc 14; montar planilha da matriz de
  avaliação (critérios do doc 04).
- **Entregável**: 2 chaves de API ativas + matriz criada.
- **Decisão**: quais 2 entram no teste comparativo.
- **Risco**: cobertura de árbitro inexistente em ambos → acionar candidato 3.

## Dia 2 — Validação de dados com jogos reais
- **Objetivo**: dados reais fluindo em scripts descartáveis.
- **Tarefas**: scripts (fora do monorepo, `scratch/`) puxando: jogos de hoje,
  1 partida ao vivo (se houver), escalações, eventos, árbitro, histórico de 1
  time; gravar payloads como fixtures; comparar 1 jogo com a transmissão.
- **Entregável**: ~10 fixtures reais + primeiras notas na matriz.
- **Decisão**: latência e granularidade aceitáveis?
- **Risco**: sem jogo ao vivo no dia → usar replay de rodada do fim de semana.

## Dia 3 — Nome, repositório e fundação
- **Objetivo**: fundação oficial do projeto.
- **Tarefas**: verificar domínio sumula.app/.com.br + busca INPI (se
  conflito: decidir entre alternativas — ver nota abaixo); registrar domínio;
  monorepo SPEC-001 completo (workspaces, TS, lint, vitest, compose, CI);
  primeiro deploy "hello" na Vercel + Railway (esteira pronta cedo).
- **Entregável**: CI verde + deploy dummy nos 2 alvos.
- **Decisão**: nome final (gatilho para org/branding depois).
- **Risco**: bikeshedding de nome — timebox de 1 h; alternativas prontas:
  *Prancheta*, *Apito*, *Rodada*.

## Dia 4 — Schema core + migrations
- **Objetivo**: SPEC-003.
- **Tarefas**: schema core/ingest/app em Drizzle; migrations; seed de
  referência (competições, times da Série A); factories de teste; projetos
  Supabase dev e prod criados (região São Paulo), pooler configurado.
- **Entregável**: `pnpm db:migrate && pnpm db:seed` do zero, verde.
- **Decisão**: nenhuma nova — executar o doc 05.
- **Risco**: sobre-modelar. Regra: só tabelas que o MVP lê ou escreve.

## Dia 5 — Cliente do provedor + normalizadores
- **Objetivo**: SPEC-004 no provedor líder da matriz.
- **Tarefas**: client tipado com rate limiter; normalizadores puros
  payload→canônico; testes com as fixtures do Dia 2; provider_entity_map;
  raw_snapshot.
- **Entregável**: fixture de partida real → linhas corretas em match/
  match_event/match_team_stats, com proveniência.
- **Decisão parcial**: o provedor líder se confirma no código?
- **Risco**: IDs instáveis entre endpoints do provedor → é exatamente o que o
  entity_map existe para absorver; documentar o achado na matriz.

## Dia 6 — Backfill + primeiras respostas analíticas
- **Objetivo**: PoC de valor (marco da Fase 1).
- **Tarefas**: job de backfill (1 temporada da Série A, respeitando rate
  limit); MVs team_season/referee_profile; responder em SQL: média de
  escanteios do Flamengo (últimos 10), cartões/jogo de 3 árbitros, média de
  gols em 2 estádios; conferir 5 resultados à mão contra fonte pública.
- **Entregável**: as 3 perguntas-exemplo respondidas com dados reais e
  proveniência.
- **Decisão**: qualidade suficiente para assinar o provedor?
- **Risco**: buracos no histórico (jogos sem stats) → quantificar % e decidir
  se aceita, completa manual ou troca de provedor.

## Dia 7 — Consolidação e go/no-go da Fase 2
- **Objetivo**: fechar Fase 0/1 com decisão consciente.
- **Tarefas**: preencher matriz final; escrever ADR-001 (provedor) e ADR-002
  (nome) no repo; agendar 5 entrevistas com persona-alvo para a semana 2;
  atualizar `.context/` (ctx-sync) com estado e próximos passos; planejar
  semana 2 (SPEC-005/017: ingestão ao vivo).
- **Entregável**: decisão go/no-go do provedor documentada + plano da semana 2.
- **Decisão**: assinar o provedor (mensal, nunca anual ainda) e iniciar Fase 2.
- **Risco**: nenhum provedor passar → plano B explícito: reduzir MVP a
  histórico+analytics (sem ao vivo) enquanto testa provedor B2B, ou pausar.
  Melhor descobrir no dia 7 do que no mês 3.
