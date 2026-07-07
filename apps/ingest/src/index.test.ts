import { describe, expect, it } from "vitest";
import { PRODUCT_NAME } from "@placarium/core";

describe("ingest", () => {
  it("resolve dependencia do workspace", () => {
    expect(PRODUCT_NAME).toBe("Placarium");
  });
});
