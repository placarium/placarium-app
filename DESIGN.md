# Placarium Design

Guia mestre de marca e interface do Placarium.

O Placarium e um observatorio de futebol: dados ao vivo, historico auditavel,
estatisticas cruzadas e IA que mostra de onde veio cada resposta. A identidade
visual precisa transmitir tres coisas ao mesmo tempo: precisao, confianca e
calor editorial de futebol.

## Essencia da marca

**Personalidade:** analitica, confiavel, editorial, direta e premium.

**Territorio visual:** imprensa esportiva contemporanea + produto de dados.
O visual deve parecer mais proximo de uma mesa de analise profissional do que
de um site de palpites.

**Ideia central da logo:** grafico de barras minimalista formando um `P`
subliminar. A haste clara representa a origem/fonte; a barra laranja representa
o dado vivo; o ponto/capsula superior representa evento, alerta ou insight.

**Sem slogan na marca.** A assinatura principal e apenas `placarium`.

## Arquivos de marca

Os assets ficam em `assets/brand/`, separados por uso.

| Uso           | Dark                                                          | Light                                                          |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Logo completa | `assets/brand/logo-completa/placarium-logo-completa-dark.svg` | `assets/brand/logo-completa/placarium-logo-completa-light.svg` |
| Simbolo       | `assets/brand/simbolo/placarium-simbolo-dark.svg`             | `assets/brand/simbolo/placarium-simbolo-light.svg`             |
| App icon      | `assets/brand/app-icon/placarium-app-icon-dark.svg`           | `assets/brand/app-icon/placarium-app-icon-light.svg`           |
| Icone pequeno | `assets/brand/icon-small/placarium-icon-small-dark.svg`       | `assets/brand/icon-small/placarium-icon-small-light.svg`       |
| Wordmark      | `assets/brand/wordmark/placarium-wordmark-dark.svg`           | `assets/brand/wordmark/placarium-wordmark-light.svg`           |
| Board geral   | `assets/brand/preview/placarium-brand-board.svg`              | -                                                              |

## Paleta

### Core tokens

| Token            | Dark      | Light     | Uso                             |
| ---------------- | --------- | --------- | ------------------------------- |
| `bg`             | `#141110` | `#FAF7F2` | Fundo principal                 |
| `surface`        | `#1C1917` | `#FFFFFF` | Cards, tabelas, modais          |
| `surface-2`      | `#262019` | `#F1ECE3` | Hover, linhas alternadas, chips |
| `border`         | `#3A322A` | `#E0D8CC` | Bordas e divisores              |
| `text`           | `#F0EBE4` | `#1C1917` | Texto principal                 |
| `text-2`         | `#A89F94` | `#57534E` | Texto secundario                |
| `text-3`         | `#6E665C` | `#A8A29E` | Muted, timestamps               |
| `primary`        | `#FF6B35` | `#D9480F` | Marca, links, CTA, tabs         |
| `primary-hover`  | `#FF8657` | `#B93A0A` | Hover/active                    |
| `primary-subtle` | `#3B2114` | `#FFE8DC` | Destaques suaves                |
| `on-primary`     | `#401803` | `#FFFFFF` | Texto sobre primary             |

### Semantica

As cores semanticas nao devem competir com a marca. A marca e laranja
queimado, nunca amarelo/ambar.

| Token             | Hex       | Uso                                          |
| ----------------- | --------- | -------------------------------------------- |
| `win` / `success` | `#2FBF71` | Vitoria, confirmacoes                        |
| `loss` / `danger` | `#E5484D` | Derrota, cartao vermelho, erro               |
| `draw`            | `#A89F94` | Empate                                       |
| `card-yellow`     | `#FFD60A` | Cartao amarelo em chip com formato de cartao |
| `live`            | `#FF4757` | Indicador de jogo ao vivo                    |
| `derived`         | `#6CA0F5` | Dado derivado ou formula                     |

## Regras de logo

1. Use a logo completa em headers, landing pages, documentos e materiais
   institucionais.
2. Use o simbolo quando a palavra Placarium ja estiver clara pelo contexto.
3. Use app icon apenas em launcher, PWA, avatar de workspace e splash.
4. Use icone pequeno para favicon, botao compacto, badge ou loading mark.
5. Preserve a proporcao entre haste, barra e ponto. Nao transformar o ponto em
   bola de futebol, trofeu, escudo ou odds.
6. A logo deve respirar. Use area de respiro minima igual a largura da haste
   clara ao redor do conjunto.
7. Nao aplicar gradiente, sombra, 3D, textura, contorno duplo ou brilho.
8. Nao usar amarelo como cor de marca. Amarelo fica reservado para cartao.
9. Nao inclinar, distorcer, rotacionar ou separar os elementos do simbolo.
10. Nao adicionar slogan junto da assinatura.

## Tamanho minimo

| Asset            | Minimo recomendado |
| ---------------- | ------------------ |
| Logo completa    | 144 px de largura  |
| Simbolo          | 24 px              |
| Icone pequeno    | 16 px              |
| App icon         | 128 px             |
| Wordmark isolado | 96 px de largura   |

Em tamanhos abaixo de 24 px, use o icone pequeno. Ele tem geometria mais
compacta e evita que o ponto superior perca legibilidade.

## Tipografia

**UI:** Inter ou Geist.

**Dados tabulares:** uma mono tabular, como Geist Mono, IBM Plex Mono ou
JetBrains Mono.

**Editorial/numeros hero:** uma serif display com peso e contraste controlados,
como Fraunces ou Playfair, desde que a licenca seja validada.

**Wordmark:** lowercase, sans limpa, peso medio, tracking normal. A palavra
`placarium` deve parecer calma e precisa. Evite peso bold demais, condensado,
italico ou letras decorativas.

## Layout e interface

1. Dark mode e o padrao do produto. Light mode existe para leitura diurna e
   compartilhamento.
2. Produtos de dados pedem densidade organizada: tabelas, filtros, comparacoes
   e fontes devem ser escaneaveis.
3. Confiança visivel e parte da marca. Fonte, timestamp e badge de confianca
   precisam aparecer como componentes de primeira classe.
4. Use o laranja com parcimonia. Idealmente, apenas uma acao primaria solida
   por tela.
5. Cor nunca e o unico canal. Badges, cartoes e estados precisam de forma,
   icone ou label.
6. Evite dashboards genericos. Cada grafico deve responder uma pergunta clara.
7. Bordas e superficies devem ser discretas. A interface deve parecer solida,
   nao decorativa.

## Voz visual

Use linguagem objetiva: fonte, minuto, confianca, atualizado, confirmado,
derivado, parcial. Evite copy promocional exagerado. O Placarium deve soar como
um analista seguro, nao como um palpiteiro.

## Do / Don't

**Fazer**

- Barras minimalistas, proporcoes simetricas e geometrias arredondadas.
- Laranja queimado como assinatura.
- Contraste AA nos dois temas.
- Estados claros para dado confirmado, ao vivo, derivado e parcial.
- Iconografia funcional e consistente.

**Nao fazer**

- Bola, gramado, escudo, trofeu ou mascote como marca.
- Amarelo/ambar como cor principal.
- Gradientes grandes, sombras dramáticas ou efeitos 3D.
- Texto pequeno dentro de chips sem icone/forma.
- Logos alternativas sem relacao com o monograma grafico.
