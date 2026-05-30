import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SENTRY_DSN:
      process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? ""
  },
  transpilePackages: ["@vierify/ui", "@vierify/api-client"],
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }
        ]
      },
      {
        source: "/(icon-192\\.png|icon-512\\.png|favicon\\.ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, immutable" }
        ]
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release: {
    name: process.env.SENTRY_RELEASE
  },
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true
  },
  telemetry: false,
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true
});
