# 15. Segurança, legal e compliance

> **Aviso**: isto não é aconselhamento jurídico. Itens marcados ⚖️ exigem
> validação com advogado (idealmente com experiência em direito digital/
> esportivo) antes de decisões irreversíveis.

## Dados esportivos e licenciamento

- ⚖️ **Fatos esportivos** (placar, quem marcou) em geral não são protegidos
  por direito autoral, mas **bases de dados organizadas** têm proteção própria
  (Lei 9.610/98, art. 87) e os **contratos de API** restringem uso
  independentemente disso. O contrato do provedor é a restrição prática real.
- Checklist de leitura dos termos do provedor (Fase 0, eliminatório):
  armazenamento persistente permitido? exibição pública? uso comercial?
  derivados/agregados são nossos? sublicenciamento/API própria (futuro B2B)?
  obrigação de atribuição? o que acontece com os dados no término do contrato?
- **Scraping** (SofaScore, ge, oGol): descartado — viola ToS, frágil
  tecnicamente, e mancha exatamente o posicionamento de confiabilidade.
- **Separação por proveniência no schema** (doc 05) é também um mecanismo de
  compliance: sabemos o que expurgar se um contrato acabar.
- ⚖️ **Direitos de transmissão** não nos afetam (não exibimos vídeo), mas
  cuidado com clipes/imagens em features futuras; escudos e marcas de clubes
  têm proteção de marca — usar com sobriedade (identificação nominativa) e
  validar.

## Odds e apostas

- ⚖️ Mercado regulado (Lei 14.790/2023 + regulamentação SPA/MF em evolução).
  Exibir odds de terceiros, afiliação com casas e qualquer coisa que pareça
  "tip" têm implicações regulatórias e de publicidade distintas.
- Decisão de produto: **sem odds e sem previsões no MVP/V1**. Padrões
  históricos são fatos; previsão é opinião — a IA mostra o primeiro e recusa o
  segundo (doc 09). Revisitar com jurídico se odds virarem demanda validada.
- Postura responsável desde já: sem linguagem de incentivo, disclaimer nas
  áreas de estatística usadas por apostadores, link para jogo responsável.

## LGPD

- **Base de dados pessoais que teremos**: e-mail, nome opcional, histórico de
  perguntas à IA (pode revelar comportamento), logs de acesso.
- Práticas desde o MVP:
  - Minimização: não pedir CPF, telefone, nada além do necessário.
  - Política de privacidade clara + registro de consentimento no cadastro.
  - Direitos do titular (art. 18): exclusão de conta self-service (soft
    delete + purga em 30 dias), export dos próprios dados (V1).
  - Retenção: logs de IA 12 meses → anonimizar; logs de acesso 6 meses.
  - Perguntas de IA **não** vão para logs de aplicação nem para terceiros além
    do provedor de LLM — ⚖️ revisar DPA do provedor de IA (Anthropic/etc.) e
    citá-lo na política.
  - Sem venda/compartilhamento de dados de uso.
- ⚖️ **Jogadores/árbitros são pessoas**: dados profissionais públicos de
  atletas têm tratamento distinto de dados de usuários, mas perfis
  disciplinares agregados de árbitros merecem revisão de risco (interesse
  legítimo + relevância pública é o argumento; validar enquadramento).

## Segurança de aplicação

- OWASP básico: Zod em toda fronteira, queries parametrizadas (Drizzle), CSP
  e security headers, cookies httpOnly/secure/sameSite, CSRF nas mutations.
- IA: tools read-only, sem SQL livre, moderação de entrada, rate limit por
  usuário, cap de custo global (doc 09).
- Admin: role + (V1) IP allowlist + audit de ações administrativas.
- Webhooks: assinatura verificada + replay protection.
- Secrets: cofres por ambiente, rotação, redaction nos logs (doc 07 §8.10).
- Abuso: rate limit por IP em rotas públicas; proteção de scraping da nossa
  própria base (nossos dados agregados são nosso ativo) — throttling +
  paginação com limites.

## Resumo de pendências jurídicas (para a Fase 0/1)

1. ⚖️ Revisão dos termos do provedor escolhido (antes de assinar).
2. ⚖️ Política de privacidade + termos de uso do StatsHub.
3. ⚖️ Enquadramento LGPD dos logs de IA e do DPA do provedor de LLM.
4. ⚖️ Uso de nomes/escudos de clubes na UI.
5. ⚖️ (Só se/quando) odds e programas de afiliados.
