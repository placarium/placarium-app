import { z } from "zod";

const DEV_DEFAULTS = {
  DATABASE_URL: "postgresql://placarium:placarium@localhost:5432/placarium",
  REDIS_URL: "redis://localhost:6379",
  BETTER_AUTH_SECRET: "segredo-de-dev-nao-usar-em-producao",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
} as const;

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  AI_API_KEY: z.string().optional(),
});

export type WebEnv = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): WebEnv {
  const isProduction = source.NODE_ENV === "production";
  const withDefaults = isProduction ? source : { ...DEV_DEFAULTS, ...compact(source) };
  const result = schema.safeParse(withDefaults);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`[web] variáveis de ambiente inválidas:\n${issues}`);
  }
  return result.data;
}

function compact(source: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string>;
}

// Só no servidor (RSC, actions, route handlers) — nunca importe em client component.
export const env: WebEnv = parseEnv(process.env);
