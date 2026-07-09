# design/ — arquivos .pen (Pencil)

UIs do Placarium desenhadas no [Pencil](https://pencil.dev), versionadas junto
do código: commit, branch e review de design como qualquer arquivo.

## Convenções

- Um `.pen` por área grande (ex.: `partida.pen`, `dashboard.pen`) — evita
  arquivo monolítico e conflito de merge entre você e o Isaque.
- Design novo/alterado é **anexado à issue correspondente no Linear** —
  a issue conta a história completa (o quê + como vai parecer).
- Tokens de cor/tipografia seguem `DESIGN.md` e `assets/brand/tokens/` — o
  Pencil consome os mesmos valores, nunca inventa hex novo.
- `.pen` é lido/editado **via MCP do Pencil** (nunca com editores de texto).
- Fluxo design→código: a IA lê o `.pen` pelo MCP e gera o componente com os
  tokens do projeto (ver README raiz §Ferramentas do time).
