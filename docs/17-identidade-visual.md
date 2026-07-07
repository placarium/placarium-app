# 19. Identidade visual — paleta de cores

## Decisão

**Direção escolhida pelo fundador (2026-07-06): C — "Imprensa esportiva"**,
com refinamento técnico para resolver o conflito entre a cor de marca e as
cores semânticas (abaixo). As direções A ("Radar", azul) e B ("Gramado
noturno", verde) foram consideradas e descartadas; ficam como referência para
temas alternativos futuros.

> **Fonte de verdade da identidade**: [`DESIGN.md`](../DESIGN.md) +
> `assets/brand/` (criados pelo fundador em 2026-07-06 — logo "Colunas":
> gráfico de barras minimalista formando um P subliminar, com variantes
> dark/light em SVG e PNG). Este doc preserva o racional das direções
> avaliadas; em caso de divergência de token, vale o DESIGN.md.

## Restrição de projeto (vem antes do gosto)

Num produto de estatística de futebol, **as cores semânticas são sagradas**:
cartão amarelo É amarelo, vermelho É derrota/expulsão, verde É vitória. A
direção C usa família quente (âmbar/laranja) como marca, o que exige duas
regras a mais que as outras direções não exigiriam:

1. **A marca é laranja queimado, nunca âmbar/amarelo** — hue claramente
   deslocado do amarelo de cartão.
2. **Codificação por forma é obrigatória**: cartão amarelo sempre renderiza
   como chip em formato de cartão (retângulo vertical), nunca como dot ou
   texto colorido; badges têm ícone + label; a marca vive em botões/links.
   Cor nunca é o único canal — em C isso deixa de ser só acessibilidade e
   vira condição de legibilidade.

## Tokens — Direção C refinada

Dark mode padrão (antracite quente); light mode derivado.

| Token            | Dark (padrão) | Light     | Uso                                           |
| ---------------- | ------------- | --------- | --------------------------------------------- |
| `bg`             | `#141110`     | `#FAF7F2` | Fundo da página (antracite quente / papel)    |
| `surface`        | `#1C1917`     | `#FFFFFF` | Cards, tabelas                                |
| `surface-2`      | `#262019`     | `#F1ECE3` | Hover, células alternadas, chips              |
| `border`         | `#3A322A`     | `#E0D8CC` | Bordas e divisores                            |
| `text`           | `#F0EBE4`     | `#1C1917` | Texto principal                               |
| `text-2`         | `#A89F94`     | `#57534E` | Texto secundário, labels                      |
| `text-3`         | `#6E665C`     | `#A8A29E` | Muted, timestamps                             |
| `primary`        | `#FF6B35`     | `#D9480F` | Marca (laranja queimado), links, botões, tabs |
| `primary-hover`  | `#FF8657`     | `#B93A0A` | Estados hover/active                          |
| `primary-subtle` | `#3B2114`     | `#FFE8DC` | Fundos de destaque suave                      |
| `on-primary`     | `#401803`     | `#FFFFFF` | Texto sobre a marca                           |

**Semânticas** (com codificação por forma obrigatória):

| Token             | Hex (dark) | Uso                                               |
| ----------------- | ---------- | ------------------------------------------------- |
| `win` / `success` | `#2FBF71`  | Vitória, confirmações                             |
| `loss` / `danger` | `#E5484D`  | Derrota, cartão vermelho, erros                   |
| `draw`            | `#A89F94`  | Empate                                            |
| `card-yellow`     | `#FFD60A`  | Cartão amarelo — **só em chip formato cartão**    |
| `live`            | `#FF4757`  | Indicador pulsante de jogo ao vivo (dot + minuto) |

**Badges de confiança** (doc 10 — TrustBadge; diferenciados por ícone + label,
não só por cor):

| Badge                  | Hex       | Forma                                     |
| ---------------------- | --------- | ----------------------------------------- |
| ✓ confirmado           | `#34D399` | pill verde                                |
| ● provisório (ao vivo) | `#FBBF24` | pill âmbar com dot pulsante               |
| ƒ derivado             | `#6CA0F5` | pill azul (tooltip com fórmula e amostra) |
| ⚠ parcial              | `#D97706` | pill outline tracejado com ícone ⚠        |

**Tipografia** (parte da identidade C): serif de display para manchetes e
números-herói (ex.: Fraunces/Playfair — validar licença), sans para UI (ex.:
Inter/Geist), **mono tabular para colunas de números** (alinhamento de
tabelas densas). Nunca serif em labels de UI.

## Direções descartadas (referência)

- **A — "Radar"**: grafite azulado `#0A0F1C`, marca azul elétrico `#3E7BFA`,
  accent ciano `#22D3EE`. Semanticamente a mais limpa; candidata natural a
  tema alternativo.
- **B — "Gramado noturno"**: verde-preto `#0B1210`, marca lima `#A3E635`.
  Marca compete com o verde semântico; descartada.

## Regras de aplicação

1. Cor nunca é o único canal: cartões têm forma+ícone, W/E/D têm letra, live
   tem label de minuto.
2. Contraste AA mínimo verificado nos dois temas antes de entrar no design
   system (atenção especial: `primary` sobre `bg` e `card-yellow` sobre
   `surface` no light mode).
3. Tokens viram CSS variables + config do Tailwind na SPEC-001; nenhum hex
   hardcoded em componente.
4. Máximo um elemento `primary` sólido por vista (botão principal); o resto
   usa outline/ghost — a paleta quente satura rápido.

## Pendências

- [x] Logo/wordmark do Placarium — entregue em `assets/brand/` (2026-07-06)
- [ ] Validar contraste AA do light mode (`card-yellow` é o caso difícil)
- [ ] Verificação de contraste automatizada no Storybook/CI (V1)
