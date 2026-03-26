/**
 * OpenTelemetry-compatible distributed tracing stubs.
 * In production, configure an OTLP exporter via OTEL_EXPORTER_OTLP_ENDPOINT.
 */

export interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  status: 'ok' | 'error' | 'unset';
  events: Array<{ name: string; timestamp: number }>;
}

function generateId(bytes = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(16).slice(2).padEnd(bytes * 2, '0');
}

export function startSpan(
  name: string,
  attributes: Record<string, string | number | boolean> = {},
): Span {
  return {
    traceId: generateId(16),
    spanId: generateId(8),
    name,
    startTime: Date.now(),
    attributes,
    status: 'unset',
    events: [],
  };
}

export function endSpan(span: Span, status: Span['status'] = 'ok'): Span {
  span.endTime = Date.now();
  span.status = status;
  return span;
}

export function addSpanEvent(span: Span, name: string): void {
  span.events.push({ name, timestamp: Date.now() });
}

export function setSpanError(span: Span, error: unknown): void {
  span.status = 'error';
  span.attributes['error.message'] =
    error instanceof Error ? error.message : String(error);
}

/** Wrap an async function with automatic span lifecycle management. */
export async function traced<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const span = startSpan(name, attributes);
  try {
    const result = await fn(span);
    endSpan(span, 'ok');
    return result;
  } catch (err) {
    setSpanError(span, err);
    endSpan(span, 'error');
    throw err;
  }
}
