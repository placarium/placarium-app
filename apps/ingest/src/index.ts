import { PRODUCT_NAME } from "@placarium/core";
import { env } from "./lib/env.js";

console.log(
  `[${PRODUCT_NAME.toLowerCase()}-ingest] worker de ingestão iniciado — provider=${env.FOOTBALL_PROVIDER} (filas BullMQ chegam na SPEC-017)`,
);
