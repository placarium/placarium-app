import "dotenv/config";
import { z } from "zod";

const DEV_DEFAULTS = {
  DIRECT_DATABASE_URL: "postgresql://placarium:placarium@localhost:5432/placarium",
  REDIS_URL: "redis://localhost:6379",
} as const;

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DIRECT_DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    FOOTBALL_PROVIDER: z.enum(["mock", "api-football"]).default("mock"),
    FOOTBALL_API_KEY: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.FOOTBALL_PROVIDER !== "mock" && !value.FOOTBALL_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["FOOTBALL_API_KEY"],
        message: "FOOTBALL_API_KEY é obrigatória quando FOOTBALL_PROVIDER não é mock",
      });
    }
  });

export type IngestEnv = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): IngestEnv {
  const isProduction = source.NODE_ENV === "production";
  const withDefaults = isProduction ? source : { ...DEV_DEFAULTS, ...compact(source) };
  const result = schema.safeParse(withDefaults);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`[ingest] variáveis de ambiente inválidas:\n${issues}`);
  }
  return result.data;
}

function compact(source: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string>;
}

export const env: IngestEnv = parseEnv(process.env);
