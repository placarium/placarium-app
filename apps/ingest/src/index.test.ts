import { PRODUCT_NAME } from "@placarium/core";
import { describe, expect, it } from "vitest";

describe("ingest", () => {
  it("resolve dependencia do workspace", () => {
    expect(PRODUCT_NAME).toBe("Placarium");
  });
});
