# e2e — Testes end-to-end (Playwright)

Jornadas de usuário validadas contra os critérios de aceite de
`docs/13-specs.md`. **Use o agente `e2e-tester`** — ele carrega as regras
completas; este arquivo é o resumo de bolso.

## Essencial

- Web-first assertions (`await expect(locator).toBeVisible()`);
  `waitForTimeout` como sincronização é proibido.
- Seletores só por `data-testid` (kebab-case). Nunca classe do Tailwind,
  copy ou posição no DOM.
- Testes independentes e idempotentes: passam em qualquer ordem, em paralelo.
- Dados: banco seedado + `FOOTBALL_PROVIDER=mock` com fixtures canônicas de
  `packages/core/fixtures/`. **Nunca** chave real de provedor.
- Ao vivo é simulado (mock avança eventos) — nunca espere jogo real.
- Flaky = bug P1: conserte a causa, não adicione retry.
- Os 4 estados de tela (loading/vazio/sem cobertura/erro) são casos de
  teste, não detalhes.

## Rodar

```
pnpm test:e2e:install   # uma vez (baixa Chromium)
pnpm test:e2e           # sobe o web dev server sozinho (webServer no config)
```

E2E fica fora de `pnpm test` de propósito — o loop rápido é vitest.
