/**
 * Real-time notification swarm for the Lira mobile app.
 *
 * Listens to a WebSocket stream from the backend and dispatches native push
 * notifications for contract executions, margin calls, and price alerts.
 */

import * as Notifications from 'expo-notifications';
import type { LiraNotification, NotificationKind } from '../../../packages/types';

// ──────────────────────────────────────────────────────────────────────────────
// Permission & configuration
// ──────────────────────────────────────────────────────────────────────────────

/** Request notification permissions. Returns `true` if granted. */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Configure how notifications appear when the app is in the foreground. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Local notification dispatch
// ──────────────────────────────────────────────────────────────────────────────

const KIND_ICON: Record<NotificationKind, string> = {
  contract_executed: '⚡',
  margin_call:       '🚨',
  price_alert:       '📈',
  tx_confirmed:      '✅',
  tx_failed:         '❌',
};

/** Schedule an immediate local push notification from a `LiraNotification`. */
export async function dispatchLocalNotification(
  notification: LiraNotification,
): Promise<string> {
  const icon = KIND_ICON[notification.kind] ?? '🔔';
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `${icon} ${notification.title}`,
      body: notification.body,
      data: { notificationId: notification.id, kind: notification.kind },
    },
    trigger: null, // fire immediately
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// WebSocket swarm
// ──────────────────────────────────────────────────────────────────────────────

type NotificationListener = (n: LiraNotification) => void;

export class NotificationSwarm {
  private ws: WebSocket | null = null;
  private listeners: NotificationListener[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(private readonly wsUrl: string) {}

  /** Start listening for notifications. */
  connect(): void {
    this.shouldReconnect = true;
    this.openSocket();
  }

  /** Stop all listeners and close the connection. */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  /** Register a callback invoked on every incoming notification. */
  onNotification(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private openSocket(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const raw = JSON.parse(event.data as string) as LiraNotification;
          const notification: LiraNotification = {
            ...raw,
            timestamp: new Date(raw.timestamp),
            read: false,
          };
          // Dispatch local push
          dispatchLocalNotification(notification).catch(() => {
            // Ignore if notification permissions not granted
          });
          // Notify in-app listeners
          this.listeners.forEach(l => l(notification));
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        if (this.shouldReconnect) {
          // Exponential back-off: reconnect after 5 seconds
          this.reconnectTimer = setTimeout(() => this.openSocket(), 5000);
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // WebSocket constructor may throw if URL is invalid
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.openSocket(), 5000);
      }
    }
  }
}
