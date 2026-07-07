import { describe, expect, it } from "vitest";
import { DB_PACKAGE_READY } from "./index.js";

describe("db", () => {
  it("aguarda SPEC-003 (schema Drizzle)", () => {
    expect(DB_PACKAGE_READY).toBe(false);
  });
});
