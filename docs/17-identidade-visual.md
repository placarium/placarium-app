# 19. Identidade visual — paleta de cores

## Restrição de projeto (vem antes do gosto)

Num produto de estatística de futebol, **as cores semânticas são sagradas e
inegociáveis**: cartão amarelo É amarelo, cartão vermelho/derrota É vermelho,
vitória É verde, e os badges de confiança (doc 10) precisam de verde/âmbar/
azul/laranja legíveis. Logo, **a cor de marca não pode competir com elas** —
isso elimina verde, vermelho, amarelo e laranja como primária. Sobram as
famílias azul/ciano/violeta. Não é coincidência que a direção recomendada seja
azul: além de não colidir, azul comunica exatamente o nosso posicionamento
(confiabilidade, dado auditável).

Dark mode é o padrão (uso noturno dominante); light mode derivado dos mesmos
tokens.

## Direções propostas

### Direção A — "Radar" (RECOMENDADA)

Grafite azulado + azul elétrico + ciano para dados. Sóbrio, técnico, diferencia
dos concorrentes (Flashscore = vermelho, FotMob = verde, SofaScore = azul
claro; o nosso é mais escuro e elétrico).

| Token | Dark (padrão) | Light | Uso |
|---|---|---|---|
| `bg` | `#0A0F1C` | `#F6F8FB` | Fundo da página |
| `surface` | `#111827` | `#FFFFFF` | Cards, tabelas |
| `surface-2` | `#1A2332` | `#EEF2F7` | Hover, células alternadas, chips |
| `border` | `#26324B` | `#D9E1EC` | Bordas e divisores |
| `text` | `#E8EDF6` | `#0F172A` | Texto principal |
| `text-2` | `#9AA7BD` | `#475569` | Texto secundário, labels |
| `text-3` | `#64748B` | `#94A3B8` | Muted, timestamps |
| `primary` | `#3E7BFA` | `#2563EB` | Marca, links, botões, tabs ativas |
| `primary-hover` | `#5B8FFB` | `#1D4ED8` | Estados hover/active |
| `primary-subtle` | `#14233F` | `#DBEAFE` | Fundos de destaque suave |
| `accent` | `#22D3EE` | `#0891B2` | Números-destaque, sparklines, dados "vivos" |

**Semânticas** (iguais nos dois temas, ajustando luminância):

| Token | Hex (dark) | Uso |
|---|---|---|
| `win` / `success` | `#22C55E` | Vitória, confirmações |
| `loss` / `danger` | `#EF4444` | Derrota, cartão vermelho, erros |
| `draw` | `#94A3B8` | Empate |
| `card-yellow` | `#FACC15` | Cartão amarelo (sempre com ícone, nunca só cor) |
| `live` | `#F43F5E` | Indicador pulsante de jogo ao vivo |

**Badges de confiança** (doc 10 — TrustBadge):

| Badge | Hex | |
|---|---|---|
| ✓ confirmado | `#34D399` | verde |
| ● ao vivo (provisório) | `#FBBF24` | âmbar |
| ƒ derivado | `#60A5FA` | azul claro (tooltip com fórmula) |
| ⚠ parcial | `#FB923C` | laranja |

### Direção B — "Gramado noturno"

Verde-preto profundo (`#0B1210`), superfícies `#121A16`, primária lima
`#A3E635` ou verde-campo `#4ADE80`, texto gelo. Bonita e "futebol", **mas** a
marca verde compete diretamente com o verde semântico de vitória/confirmado —
em tabelas densas de W/D/L isso confunde. Só viável rebaixando o verde
semântico para outra tonalidade, o que enfraquece a convenção universal.

### Direção C — "Imprensa esportiva"

Antracite (`#121212`) + âmbar/laranja editorial (`#F59E0B`), tipografia serif
nos títulos. Personalidade de jornal esportivo, **mas** âmbar colide com
cartão amarelo e com o badge "ao vivo provisório" — a pior das três para o
nosso caso semântico.

## Recomendação e racional

**Direção A.** É a única em que a camada semântica fica 100 % livre de
ambiguidade — e num produto cujo diferencial nº 1 é confiança na leitura do
dado, a hierarquia visual serve à semântica, não o contrário. B e C podem
inspirar temas alternativos no futuro (theming é barato com tokens), mas o
padrão nasce A.

## Regras de aplicação

1. Cor nunca é o único canal (acessibilidade): cartões têm ícone + texto,
   vitória/derrota têm letra (V/E/D), live tem label.
2. Contraste AA mínimo: `text` sobre `surface` e `primary` sobre `bg`
   verificados nos dois temas antes de entrar no design system.
3. `accent` (ciano) é reservado para **dados**, não para UI chrome — se tudo é
   destaque, nada é.
4. Tokens viram CSS variables + config do Tailwind na SPEC-001; nenhum hex
   hardcoded em componente.

## Pendências

- [ ] Escolha final da direção pelo fundador (recomendação: A)
- [ ] Logo/tipografia (fora de escopo deste doc; sugestão inicial: sans
  geométrica para UI — ex.: Inter/Geist — e mono tabular para números)
- [ ] Verificação de contraste AA automatizada no Storybook/CI (V1)
