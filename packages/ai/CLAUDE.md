# packages/ai — Camada de IA

Tools tipadas, camada semântica, prompts e evals. Aqui vive a promessa mais
visível do produto: **a IA nunca inventa estatística**. Arquitetura completa
em `docs/09-ia-e-confiabilidade.md`.

## O contrato de toda tool

```
input:  schema Zod estrito (parâmetros validados, nunca SQL/string livre)
corpo:  UMA query parametrizada fixa (via @placarium/db, role read-only)
output: { rows, meta: { source, computed_at, sample_size, confidence } }
```

Sem `meta`, a resposta não pode citar o número. Sem exceção.

## Regras

- **NL→SQL é proibido** (até V2, e lá será modo experimental sandboxed —
  decisão do fundador, docs/09). Nenhuma tool aceita SQL, nome de tabela ou
  expressão interpolável.
- Catálogo cresce pelo **híbrido progressivo**: recusa por falta de tool é
  logada com intent (`unanswerable_no_tool`); as recusas frequentes viram as
  próximas tools. Não crie tool especulativa.
- Máx. 5 tool calls por pergunta; timeout 10 s/tool; resultado truncado
  avisa que truncou.
- Resposta final segue o schema estruturado do docs/09 (answer + data_used +
  filters + period + sources + confidence + limitations).
- Modelo de LLM é configuração (AI SDK provider), nunca hardcoded em lógica.
- Toda pergunta/resposta persiste em `ai_query`/`ai_answer` com custo e
  latência — é a matéria-prima dos evals e do roadmap.

## Evals (tratado como teste, roda em CI)

- `evals/golden-set.json` — perguntas com resposta esperada verificada à mão
  contra fixtures. Falha dura: alucinação numérica = build vermelho.
- Mudou prompt ou tool? Rode os evals antes de commitar. Adicione caso novo
  ao golden set quando um bug de resposta for corrigido (regressão).

## Fazer / Evitar

- ✅ Tool nova nasce de recusa recorrente + teste + entrada no golden set
- ❌ Tool "genérica" que recebe nome de métrica/tabela como string aberta
- ❌ Prompt com número/estatística hardcoded como exemplo (o modelo repete)
- ❌ Dar acesso de escrita ao banco ou env de produção a qualquer tool
