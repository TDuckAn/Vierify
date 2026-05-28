import * as Sentry from "@sentry/node";

function readSampleRate(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
}

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    includeLocalVariables: true,
    integrations: [
      Sentry.fastifyIntegration({
        shouldHandleError: (_error, _request, reply) => reply.statusCode >= 500
      })
    ],
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: readSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE)
  });
}

export { Sentry };

export function captureException(error: unknown): void {
  if (Sentry.isInitialized()) {
    Sentry.captureException(error);
  }
}
