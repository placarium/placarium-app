# Documentação do Placarium

Esta pasta é a **fundação intelectual** do projeto: as decisões, os porquês e
as specs que guiam a implementação. O código diz *como*; aqui está *o quê* e
*por quê*.

## Como navegar

| Grupo | Docs | Leia quando... |
|---|---|---|
| **Produto** | [01](01-visao-geral-e-mvp.md) visão/MVP · [02](02-requisitos-funcionais.md) requisitos · [03](03-requisitos-nao-funcionais.md) metas NFR · [10](10-ux-e-interface.md) UX · [11](11-modelo-de-negocio.md) negócio | ...for decidir o que construir ou cortar |
| **Dados & arquitetura** | [04](04-estrategia-de-dados.md) estratégia de dados · [05](05-modelo-de-dados.md) modelo/schema · [06](06-arquitetura-tecnica.md) stack · [07](07-system-design-e-infra.md) infra/ambientes · [08](08-realtime-e-ingestao.md) ingestão · [09](09-ia-e-confiabilidade.md) IA | ...for implementar qualquer spec (comece pelo doc da área) |
| **Execução** | [12](12-roadmap.md) roadmap por fases · [13](13-specs.md) **SPECs 001–020** · [16](16-recomendacoes-e-proximas-acoes.md) plano/próximos passos · [18](18-provedores-pricing-e-orcamento.md) provedores/orçamento | ...for planejar a próxima unidade de trabalho |
| **Governança** | [14](14-seguranca-legal-compliance.md) legal/LGPD · [15](15-riscos-e-tradeoffs.md) riscos · [17](17-identidade-visual.md) identidade (aponta p/ DESIGN.md) | ...antes de decisão sensível (dados, marca, jurídico) |

**Ponto de partida para desenvolver**: [13-specs.md](13-specs.md) — cada spec
tem escopo, critérios de aceite e ordem de implementação.

## Convenções desta pasta

- **Docs são duráveis**: registram decisões e racional, não estado do dia a
  dia (estado de sessão vive em `.context/`, gitignored).
- **Decisão nova ou revertida** → atualize o doc da área na mesma PR que a
  implementa. Doc divergente do código é bug.
- Dados voláteis (preços, cobertura de provedor) levam **data de snapshot**
  no topo — reconfira antes de usar.
- Numeração é estável: docs novos ganham o próximo número; não renumere.
- A tabela acima é o índice canônico — adicione o doc novo nela.

## Relação com outros arquivos de contexto

- `../README.md` — visão de engenharia: setup, estrutura, arquitetura resumo.
- `../AGENTS.md` (e por módulo) — regras operacionais para humanos e IAs.
- `../DESIGN.md` — guia mestre de marca/UI (fonte de verdade visual).
