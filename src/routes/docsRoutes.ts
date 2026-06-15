import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderApiReference } from "@scalar/client-side-rendering";
import { Router } from "express";

import { docsNavHtml, scalarConfig } from "../config/scalar.js";

const router = Router();

const openapiPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "openapi",
  "openapi.yaml",
);

let cachedOpenApiSpec: string | null = null;

function getOpenApiSpec(): string {
  if (cachedOpenApiSpec === null) {
    cachedOpenApiSpec = readFileSync(openapiPath, "utf8");
  }
  return cachedOpenApiSpec;
}

router.get("/openapi.yaml", (_req, res) => {
  res.type("application/yaml").send(getOpenApiSpec());
});

router.get("/docs", (_req, res) => {
  const nonce = res.locals.cspNonce ?? "";

  const html = renderApiReference({
    config: {
      _integration: "express",
      ...scalarConfig,
    },
    pageTitle: "PayOnce API Reference",
    nonce,
  });

  res
    .type("text/html")
    .send(html.replace("<body>", `<body>${docsNavHtml}`));
});

export default router;
