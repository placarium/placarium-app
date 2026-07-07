import { describe, expect, it } from "vitest";
import { AI_PACKAGE_READY } from "./index.js";

describe("ai", () => {
  it("aguarda SPEC-010 (tools da IA)", () => {
    expect(AI_PACKAGE_READY).toBe(false);
  });
});
