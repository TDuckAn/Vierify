import * as Sentry from "@sentry/nextjs";

function readSampleRate(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0;
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    enableLogs: true,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NODE_ENV ??
      "development",
    integrations: [Sentry.replayIntegration()],
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    sendDefaultPii: false,
    tracesSampleRate: readSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    )
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
