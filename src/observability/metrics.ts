/**
 * Prometheus-compatible metrics collector.
 *
 * Exposes a /api/observability/metrics endpoint that returns text/plain
 * in the Prometheus exposition format.
 *
 * In a full deployment, swap for the official prom-client package.
 */

export type MetricType = 'counter' | 'gauge' | 'histogram';

interface MetricEntry {
  type: MetricType;
  help: string;
  values: Map<string, number>;
}

class MetricsRegistry {
  private static instance: MetricsRegistry;
  private metrics: Map<string, MetricEntry> = new Map();

  static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  register(name: string, type: MetricType, help: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { type, help, values: new Map() });
    }
  }

  inc(name: string, labels: Record<string, string> = {}, value = 1): void {
    const metric = this.metrics.get(name);
    if (!metric) return;
    const key = this.labelsKey(labels);
    metric.values.set(key, (metric.values.get(key) ?? 0) + value);
  }

  set(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric) return;
    metric.values.set(this.labelsKey(labels), value);
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    // Simplified: store last observed value (real histograms bucket)
    this.set(name, value, labels);
  }

  export(): string {
    const lines: string[] = [];
    for (const [name, metric] of this.metrics) {
      lines.push(`# HELP ${name} ${metric.help}`);
      lines.push(`# TYPE ${name} ${metric.type}`);
      for (const [labelKey, value] of metric.values) {
        const labelStr = labelKey ? `{${labelKey}}` : '';
        lines.push(`${name}${labelStr} ${value}`);
      }
    }
    return lines.join('\n') + '\n';
  }

  private labelsKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }
}

export const metrics = MetricsRegistry.getInstance();

// ---------------------------------------------------------------------------
// Pre-register standard metrics
// ---------------------------------------------------------------------------

metrics.register('lira_http_requests_total', 'counter', 'Total HTTP requests');
metrics.register('lira_http_request_duration_ms', 'histogram', 'HTTP request duration in ms');
metrics.register('lira_agent_tasks_total', 'counter', 'Total agent tasks');
metrics.register('lira_dex_tokens_indexed', 'gauge', 'DEX tokens currently indexed');
metrics.register('lira_active_users', 'gauge', 'Currently active users');
metrics.register('lira_wallet_connections', 'counter', 'Wallet connection events');
