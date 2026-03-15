/**
 * Structured logger for the Lira platform.
 * Outputs newline-delimited JSON (NDJSON) compatible with most log aggregators
 * (Datadog, Grafana Loki, CloudWatch).
 *
 * In production, swap the console transport for an OpenTelemetry log exporter.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'lira';

function log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    ...meta,
  };

  if (process.env.NODE_ENV === 'production') {
    // Output NDJSON for log aggregation
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    // eslint-disable-next-line no-console
    (level === 'error' ? console.error : console.log)(prefix, message, Object.keys(meta).length ? meta : '');
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};

export default logger;
