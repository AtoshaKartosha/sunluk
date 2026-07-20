import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// ponytail: Medusa serves uploaded product images from its backend
// (e.g. http://localhost:9000/static/<filename>). Allow that hostname so
// next/image doesn't reject the src. Pathname scoped to /static/**
// (Medusa v2 upload root).
const medusaBackendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

// ponytail: parse the configured backend once; reuse for both the
// remotePattern and the local-optimizer bypass below.
const parsedMedusaBackend = (() => {
  try {
    return new URL(medusaBackendUrl);
  } catch {
    return new URL("http://localhost:9000");
  }
})();

// ponytail: Next's image optimizer rejects local-IP src with HTTP 400
// ("url" parameter is not allowed) to prevent SSRF, and we do NOT enable
// dangerouslyAllowLocalIP. When the Medusa backend is on localhost /
// 127.0.0.1 (local dev against a production build), bypass the optimizer
// so product images load directly from the backend. Any remote production
// host keeps optimization on.
const isLocalBackend =
  parsedMedusaBackend.hostname === "localhost" ||
  parsedMedusaBackend.hostname === "127.0.0.1";

const medusaImageRemote = {
  protocol: parsedMedusaBackend.protocol.replace(":", "") as "http" | "https",
  hostname: parsedMedusaBackend.hostname,
  ...(parsedMedusaBackend.port ? { port: parsedMedusaBackend.port } : {}),
  pathname: "/static/**",
};

const nextConfig: NextConfig = {
  images: {
    unoptimized: isLocalBackend,
    remotePatterns: [medusaImageRemote],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
