import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// ponytail: Medusa serves uploaded product images from its backend
// (e.g. http://localhost:9000/static/<filename>). Allow that hostname so
// next/image doesn't reject the src. Pathname scoped to /static/**
// (Medusa v2 upload root).
const medusaBackendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const medusaImageRemote = (() => {
  try {
    const u = new URL(medusaBackendUrl);
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/static/**",
    };
  } catch {
    return {
      protocol: "http" as const,
      hostname: "localhost",
      port: "9000",
      pathname: "/static/**",
    };
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [medusaImageRemote],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
