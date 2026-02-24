interface TelemetryContext {
  [key: string]: unknown;
}

const isProd = import.meta.env.PROD;

export function captureError(
  error: unknown,
  context: TelemetryContext = {}
): void {
  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  if (!isProd) {
    console.error("[telemetry] captured error", {
      message: normalizedError.message,
      stack: normalizedError.stack,
      ...context,
    });
  }

  // Future integration point (e.g. Sentry/Datadog).
}

export function captureMessage(message: string, context: TelemetryContext = {}): void {
  if (!isProd) {
    console.info("[telemetry] message", { message, ...context });
  }
}
