import { describe, expect, it } from "vitest";
import { parseEnv } from "./env.js";

describe("parseEnv (ingest)", () => {
  it("aplica defaults locais fora de produção", () => {
    const env = parseEnv({});
    expect(env.FOOTBALL_PROVIDER).toBe("mock");
    expect(env.DIRECT_DATABASE_URL).toContain("localhost:5432");
    expect(env.REDIS_URL).toContain("localhost:6379");
  });

  it("exige FOOTBALL_API_KEY quando o provedor não é mock", () => {
    expect(() => parseEnv({ FOOTBALL_PROVIDER: "api-football" })).toThrow(/FOOTBALL_API_KEY/);
  });

  it("aceita provedor real com chave", () => {
    const env = parseEnv({ FOOTBALL_PROVIDER: "api-football", FOOTBALL_API_KEY: "x" });
    expect(env.FOOTBALL_PROVIDER).toBe("api-football");
  });

  it("em produção não aplica defaults locais", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/inválidas/);
  });
});
