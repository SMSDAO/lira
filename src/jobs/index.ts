/**
 * Background job definitions for the Lira platform.
 *
 * Uses BullMQ-style queue names and job payloads.
 * In production, connect to a Redis instance via REDIS_URL.
 * In development / test, jobs are executed inline via the SimpleScheduler.
 */

export type JobName =
  | 'dexScanner'
  | 'walletMonitor'
  | 'imageGenerator'
  | 'socialPublisher'
  | 'analyticsAggregator'
  | 'contractWatcher';

export interface JobDefinition {
  name: JobName;
  /** Cron expression */
  schedule: string;
  description: string;
  /** Default timeout in ms */
  timeout: number;
  /** Maximum retry attempts */
  retries: number;
}

export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: 'dexScanner',
    schedule: '*/5 * * * *', // every 5 minutes
    description: 'Scan DEX liquidity pools and update token analytics',
    timeout: 30_000,
    retries: 3,
  },
  {
    name: 'walletMonitor',
    schedule: '*/2 * * * *', // every 2 minutes
    description: 'Monitor wallet RPC for transfers and events',
    timeout: 15_000,
    retries: 5,
  },
  {
    name: 'imageGenerator',
    schedule: '*/1 * * * *', // every minute
    description: 'Process pending AI image generation requests',
    timeout: 60_000,
    retries: 2,
  },
  {
    name: 'socialPublisher',
    schedule: '*/10 * * * *', // every 10 minutes
    description: 'Publish queued posts to Farcaster / Zora',
    timeout: 20_000,
    retries: 3,
  },
  {
    name: 'analyticsAggregator',
    schedule: '0 * * * *', // hourly
    description: 'Aggregate user and protocol analytics',
    timeout: 120_000,
    retries: 2,
  },
  {
    name: 'contractWatcher',
    schedule: '*/3 * * * *', // every 3 minutes
    description: 'Watch smart contract events and sync state',
    timeout: 20_000,
    retries: 5,
  },
];

// ---------------------------------------------------------------------------
// Simple in-process scheduler (development / test fallback)
// ---------------------------------------------------------------------------

export type JobHandler = (jobName: JobName) => Promise<void>;

interface JobRun {
  jobName: JobName;
  startedAt: number;
  completedAt?: number;
  error?: string;
  status: 'running' | 'completed' | 'failed';
}

export class SimpleScheduler {
  private static instance: SimpleScheduler;
  private handlers: Map<JobName, JobHandler> = new Map();
  private runs: JobRun[] = [];
  /** Maximum run history entries retained in memory. */
  private static readonly MAX_RUNS = 500;

  static getInstance(): SimpleScheduler {
    if (!SimpleScheduler.instance) {
      SimpleScheduler.instance = new SimpleScheduler();
    }
    return SimpleScheduler.instance;
  }

  register(jobName: JobName, handler: JobHandler): void {
    this.handlers.set(jobName, handler);
  }

  async run(jobName: JobName): Promise<void> {
    const handler = this.handlers.get(jobName);
    if (!handler) throw new Error(`No handler registered for job: ${jobName}`);

    const run: JobRun = { jobName, startedAt: Date.now(), status: 'running' };
    this.runs.unshift(run);
    // Trim history to avoid unbounded memory growth
    if (this.runs.length > SimpleScheduler.MAX_RUNS) {
      this.runs.length = SimpleScheduler.MAX_RUNS;
    }

    try {
      await handler(jobName);
      run.completedAt = Date.now();
      run.status = 'completed';
    } catch (err) {
      run.completedAt = Date.now();
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  getRecentRuns(limit = 20): JobRun[] {
    return this.runs.slice(0, limit);
  }
}
