# packages/core — Domínio puro

Tipos canônicos, schemas Zod, normalizadores (payload do provedor → entidades
nossas) e regras de negócio. É a base do workspace e o pacote mais testado.

## A regra de ouro: ZERO I/O

Nada aqui faz fetch, toca banco, lê env ou importa outro package do
workspace. Tudo é função pura e determinística — entra valor, sai valor.
Se precisa de "agora", recebe `now: Date` por parâmetro. Se precisa de
aleatoriedade, recebe seed. Isso é o que torna o domínio testável sem mock.

## O que mora aqui

- `types` — entidades canônicas (Match, MatchEvent, Confidence...)
- `schemas` — Zod das fronteiras (payloads de provedor, inputs)
- `normalizers` — payload bruto → entidades canônicas (1 módulo por provedor)
- `fixtures/` — **o ativo de teste mais valioso do projeto**: respostas reais
  gravadas do provedor (jogos com pênalti, VAR, expulsão, virada...)

## Convenções

- Normalizador nunca lança para payload estranho: retorna
  `{ ok: entidades } | { issue: DataQualityIssue }` — quem decide o que fazer
  é o chamador (ingest).
- Todo normalizador tem teste com fixture real cobrindo os casos: gol,
  pênalti (convertido/perdido), gol anulado por VAR, expulsão, substituição
  no intervalo, dados faltantes.
- Enum fechado > string solta; `Confidence` e afins vivem aqui e são a
  referência para o schema do banco.
- Datas sempre `timestamptz`-compatíveis (ISO 8601 UTC) — timezone é
  responsabilidade da borda de exibição.

## Fazer / Evitar

- ✅ `normalizeFixture(payload, { now }): NormalizeResult`
- ❌ `await fetch(...)` ou `process.env.X` em qualquer arquivo deste pacote
- ✅ Fixture nova ao descobrir edge case real (nomeie pelo caso: `var-disallowed-goal.json`)
- ❌ Fixture editada à mão para "passar o teste" — grave uma real nova
- ❌ Depender de `@placarium/db` ou qualquer outro package (core é a raiz)
