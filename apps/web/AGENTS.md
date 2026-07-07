<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# apps/web — Next.js (App Router)

UI, leituras e mutações de usuário. É a vitrine da promessa do produto: todo
dado renderizado mostra origem/confiança (TrustBadge).

> ⚠️ Antes de escrever código Next.js, respeite o aviso acima: esta versão
> pode divergir do seu conhecimento de treino — consulte
> `node_modules/next/dist/docs/` para a API atual.

## Fronteiras

- Lê dados via `@placarium/db`; regra de domínio vem de `@placarium/core`.
  Componente não contém regra de negócio nem SQL.
- **Nunca** chama o provedor esportivo — isso é papel exclusivo do ingest.
- Nunca importa de `apps/ingest`.

## Convenções

- **RSC por padrão**; `"use client"` só com interatividade real (estado,
  eventos). Leitura de dado = RSC direto; **nunca** `useEffect`+fetch para
  dado que o servidor resolve.
- **Server Action = mutação** (com Zod no input); leitura nunca é action.
- Placar ao vivo: route handler GET `/api/live/*` com ETag lendo Redis —
  não é RSC nem action (precisa ser cacheável e barato).
- Toda tela de dados implementa os 4 estados: loading (skeleton com a forma
  real), vazio (com ação), **sem cobertura** (distinto de vazio) e erro
  (honesto + retry). Ver docs/10.
- Cores só via tokens (`assets/brand/tokens`); zero hex em componente.
- Elementos interativos/testáveis levam `data-testid` em kebab-case.
- Acessibilidade: cor nunca é o único canal (cartão = chip com forma+ícone).

## Fazer / Evitar

- ✅ `const stats = await getTeamStats(slug)` dentro do RSC
- ❌ `useEffect(() => fetch("/api/stats")...)` para conteúdo estático
- ✅ Componente pequeno e específico (`MatchCard`, `TrustBadge`)
- ❌ Componente genérico "configurável" antes do terceiro caso de uso
- ✅ `revalidateTag` na escrita; ❌ `router.refresh()` como muleta de cache

## Testes

Lógica visual pura (formatadores, mapeamentos) → vitest aqui. Jornadas → e2e/
(agente `e2e-tester`). Se um componente ficou difícil de testar, ele está
grande demais — divida.
