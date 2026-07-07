# 11. UX e interface

## Princípios

1. **Densidade progressiva**: visão-resumo primeiro, profundidade a um toque.
   É a defesa contra a poluição inevitável de um produto data-heavy.
2. **Confiança visível**: timestamp e badge de origem são elementos de UI de
   primeira classe, não rodapé.
3. **Mobile-first no consumo, desktop-first na análise**: acompanhar jogo é
   mobile; cruzar dados é desktop. As duas experiências não são a mesma tela
   espremida.
4. **Dark mode como padrão** (uso noturno dominante em futebol), claro
   opcional.

## Navegação principal

- Mobile: bottom nav — **Jogos** (home) · **Explorar** (busca/filtros) ·
  **IA** (chat) · **Perfil**.
- Desktop: topbar com busca global (⌘K) + sidebar contextual nas páginas de
  entidade.

## Telas do MVP

| Tela                        | Mobile prioriza                                                                  | Desktop adiciona                                                 |
| --------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Home / Jogos ao vivo**    | Jogos de hoje por competição, placar+minuto+ícones de evento, "atualizado há Xs" | Multicoluna, stats rápidas inline (posse, escanteios)            |
| **Partida**                 | Placar fixo no topo, tabs: Timeline / Stats / Escalações / H2H                   | Timeline e stats lado a lado; gráfico de pressão por período     |
| **Time**                    | Forma recente (5 jogos), próximos jogos, médias-chave em cards                   | Tabelas completas casa/fora, 1º/2º tempo, evolução na temporada  |
| **Campeonato**              | Tabela compacta + rodada atual                                                   | Tabela completa + stats da competição + artilharia               |
| **Árbitro**                 | Cards: cartões/jogo, pênaltis, acréscimos médios                                 | Lista de partidas apitadas com filtros                           |
| **Explorar / Busca**        | Busca por nome + filtros essenciais empilhados                                   | Filtros combinados em painel lateral, resultados em tabela densa |
| **Chat IA**                 | Conversa em tela cheia, respostas com cards de dados                             | Painel lateral persistente — perguntar sem sair da página        |
| **Fontes e confiabilidade** | Página estática: de onde vêm os dados, o que significam os badges                | idem                                                             |
| **Admin** (interno)         | —                                                                                | Jobs, quality issues, saúde do provedor                          |

## Componentes-chave

- **MatchCard**: placar, minuto, competição, ícones de gol/cartão/VAR;
  variantes live/scheduled/finished.
- **StatRow / StatCompare**: barra comparativa A×B (posse, chutes...) com
  badge de confiança embutido.
- **Timeline**: lista vertical minuto a minuto, ícones por tipo, correções
  marcadas ("↺ corrigido"), agrupamento por período.
- **TrustBadge**: ✓ confirmado (verde) / ● ao vivo (âmbar) / ƒ derivado
  (azul, tooltip com fórmula e amostra) / ⚠ parcial. Tooltip: fonte +
  timestamp. Mesmo componente na UI e nas respostas da IA.
- **DataTable**: ordenável, colunas configuráveis (desktop), export CSV (V1).
- **AIAnswerCard**: resposta + "dados usados" recolhível + fontes + botões de
  refinamento sugerido.
- **Gráficos** (Recharts): linha (evolução), barras (comparação), sem
  dashboards genéricos — cada gráfico responde uma pergunta específica.

## Estados obrigatórios (definidos por componente antes de codar)

- **Loading**: skeletons com a forma real do conteúdo (não spinner genérico).
- **Vazio**: sempre com explicação e ação — "Sem jogos hoje nas suas
  competições → ver calendário da semana".
- **Sem cobertura**: distinto de vazio — "Não temos minuto a minuto desta
  competição" (coverage_level), nunca zeros enganosos.
- **Erro**: mensagem honesta + retry; ao vivo degrada para "último dado de
  HH:MM:SS" em vez de sumir.
- **IA sem dado**: resposta de recusa bem desenhada (é feature, não falha).

## Acessibilidade

- Contraste AA nos dois temas; nunca cor como único canal (cartão amarelo/
  vermelho têm ícone+texto).
- Navegação por teclado na busca e filtros; `aria-live` educado (polite) para
  atualização de placar.
- Textos de eventos legíveis por screen reader ("Gol de X aos 23 minutos").
