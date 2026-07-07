/**
 * Grava respostas REAIS do provedor como fixtures em packages/core/fixtures/.
 * As fixtures alimentam: testes dos normalizadores, o mock do provedor em dev
 * e o seed do banco local. Ver AGENTS.md de packages/core.
 *
 * Rodar (quando a SPEC-004 destravar): pnpm dlx tsx scripts/record-fixtures.ts
 * Requer FOOTBALL_API_KEY no .env (usa a cota do trial com parcimônia).
 */

const API_KEY = process.env.FOOTBALL_API_KEY;

if (!API_KEY) {
  console.error("FOOTBALL_API_KEY ausente no .env — este script usa a API real.");
  process.exit(1);
}

// TODO(SPEC-004): implementar com o client do provedor escolhido.
// Alvos de gravação (casos que os normalizadores PRECISAM cobrir):
//  - jogo com pênalti convertido e perdido
//  - gol anulado por VAR
//  - expulsão (segundo amarelo e vermelho direto)
//  - substituição no intervalo
//  - jogo com dados incompletos (sem árbitro, sem escalação)
//  - rodada completa de um dia (para o seed)
console.log("Aguardando SPEC-004 — ver TODOs neste arquivo.");
process.exit(1);
