import type { ApiReferenceConfiguration } from "@scalar/express-api-reference";

export const scalarConfig: Partial<ApiReferenceConfiguration> = {
  theme: "default",
  layout: "modern",
  darkMode: true,
  hideDownloadButton: false,
  metaData: {
    title: "PayOnce API Reference",
    description: "Interactive payment API documentation",
  },
  url: "/openapi.yaml",
  authentication: {
    preferredSecurityScheme: "BearerAuth",
  },
  defaultHttpClient: {
    targetKey: "js",
    clientKey: "fetch",
  },
  customCss: `
    :root {
      --scalar-color-accent: #3b82f6;
    }
    .payonce-docs-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 1.25rem;
      border-bottom: 1px solid var(--scalar-border-color, #2c3a52);
      background: var(--scalar-background-1, #0b1020);
      font-family: "Segoe UI", system-ui, sans-serif;
    }
    .payonce-docs-nav a {
      color: var(--scalar-color-1, #e8edf5);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .payonce-docs-nav a:hover {
      color: var(--scalar-color-accent, #3b82f6);
    }
    .payonce-docs-nav .logo {
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .payonce-docs-nav .links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .payonce-docs-nav .active {
      color: var(--scalar-color-accent, #3b82f6);
    }
  `,
};

export const docsNavHtml = `
<nav class="payonce-docs-nav" aria-label="PayOnce site navigation">
  <a class="logo" href="/">PayOnce</a>
  <div class="links">
    <a href="/">Home</a>
    <a href="/demo">Demo</a>
    <a href="/dashboard">Dashboard</a>
    <a href="/docs" class="active" aria-current="page">API Reference</a>
  </div>
</nav>
`.trim();
