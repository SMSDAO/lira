/**
 * Agent type definitions and coordinator for the Lira agent swarm.
 * Agents communicate via an in-process EventEmitter-based event bus and
 * are designed to plug into Redis + BullMQ in production deployments.
 */

import EventEmitter from 'events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'stopped';

export type AgentType =
  | 'AgentCoordinator'
  | 'DexScannerAgent'
  | 'WalletAgent'
  | 'ImageGenerationAgent'
  | 'SocialAgent'
  | 'AnalyticsAgent'
  | 'MonitoringAgent'
  | 'NotificationAgent'
  | 'GovernanceAgent';

export interface AgentTask {
  id: string;
  agentType: AgentType;
  payload: Record<string, unknown>;
  priority: number; // 1 (low) – 10 (critical)
  enqueuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface AgentMeta {
  id: string;
  type: AgentType;
  status: AgentStatus;
  lastHeartbeat: number;
  tasksCompleted: number;
  tasksFailed: number;
  currentTaskId?: string;
}

// ---------------------------------------------------------------------------
// Event bus
// ---------------------------------------------------------------------------

class AgentEventBus extends EventEmitter {
  private static instance: AgentEventBus;
  static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
      AgentEventBus.instance.setMaxListeners(50);
    }
    return AgentEventBus.instance;
  }
}

export const agentBus = AgentEventBus.getInstance();

// ---------------------------------------------------------------------------
// Base Agent
// ---------------------------------------------------------------------------

export abstract class BaseAgent {
  readonly meta: AgentMeta;

  constructor(type: AgentType) {
    this.meta = {
      id: `${type}_${Date.now()}`,
      type,
      status: 'idle',
      lastHeartbeat: Date.now(),
      tasksCompleted: 0,
      tasksFailed: 0,
    };
  }

  protected setStatus(status: AgentStatus): void {
    this.meta.status = status;
    agentBus.emit('agent:status', { agentId: this.meta.id, status });
  }

  protected heartbeat(): void {
    this.meta.lastHeartbeat = Date.now();
    agentBus.emit('agent:heartbeat', { agentId: this.meta.id });
  }

  abstract execute(task: AgentTask): Promise<unknown>;

  pause(): void {
    this.setStatus('paused');
  }

  resume(): void {
    this.setStatus('idle');
  }

  stop(): void {
    this.setStatus('stopped');
  }
}

// ---------------------------------------------------------------------------
// Agent Coordinator
// ---------------------------------------------------------------------------

export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: AgentTask[] = [];

  static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  register(agent: BaseAgent): void {
    this.agents.set(agent.meta.id, agent);
    agentBus.emit('coordinator:registered', { agentId: agent.meta.id, type: agent.meta.type });
  }

  enqueue(task: Omit<AgentTask, 'id' | 'enqueuedAt'>): AgentTask {
    const full: AgentTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      enqueuedAt: Date.now(),
    };
    this.taskQueue.push(full);
    // Sort by priority descending
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    agentBus.emit('coordinator:enqueued', full);
    return full;
  }

  getAgentMetas(): AgentMeta[] {
    return Array.from(this.agents.values()).map(a => ({ ...a.meta }));
  }

  getQueueDepth(): number {
    return this.taskQueue.length;
  }

  pauseAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.pause();
    return true;
  }

  resumeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    agent.resume();
    return true;
  }
}

// ---------------------------------------------------------------------------
// Concrete agent stubs (each fully implemented in own file)
// ---------------------------------------------------------------------------

export class DexScannerAgent extends BaseAgent {
  constructor() { super('DexScannerAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    // Real implementation in src/dex/scanner.ts
    agentBus.emit('dex:scan_started', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { scanned: true };
  }
}

export class WalletAgent extends BaseAgent {
  constructor() { super('WalletAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('wallet:monitor', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { monitored: true };
  }
}

export class ImageGenerationAgent extends BaseAgent {
  constructor() { super('ImageGenerationAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('image:generate', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { generated: true };
  }
}

export class SocialAgent extends BaseAgent {
  constructor() { super('SocialAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('social:publish', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { published: true };
  }
}

export class AnalyticsAgent extends BaseAgent {
  constructor() { super('AnalyticsAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('analytics:aggregate', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { aggregated: true };
  }
}

export class MonitoringAgent extends BaseAgent {
  constructor() { super('MonitoringAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('monitoring:check', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { checked: true };
  }
}

export class NotificationAgent extends BaseAgent {
  constructor() { super('NotificationAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('notification:send', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { sent: true };
  }
}

export class GovernanceAgent extends BaseAgent {
  constructor() { super('GovernanceAgent'); }
  async execute(task: AgentTask): Promise<unknown> {
    this.setStatus('running');
    this.heartbeat();
    agentBus.emit('governance:process', task.payload);
    this.meta.tasksCompleted++;
    this.setStatus('idle');
    return { processed: true };
  }
}
