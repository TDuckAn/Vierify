import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SENTRY_DSN:
      process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN ?? ""
  },
  transpilePackages: ["@vierify/ui", "@vierify/api-client"]
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
