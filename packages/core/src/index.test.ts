import { describe, expect, it } from "vitest";
import { PRODUCT_NAME } from "./index.js";

describe("core", () => {
  it("exporta o nome do produto", () => {
    expect(PRODUCT_NAME).toBe("Placarium");
  });
});
