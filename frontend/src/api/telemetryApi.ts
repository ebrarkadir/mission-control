import { authSession } from '../auth/authSession';
import type {
  TelemetryRecord,
  TelemetryStreamOptions,
  TelemetryStreamSubscription,
} from '../types/telemetry';
import { apiClient, triggerUnauthorized } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const telemetryApi = {
  getLatest: (vehicleId: number): Promise<TelemetryRecord> => {
    return apiClient<TelemetryRecord>(
      `/api/vehicles/${vehicleId}/telemetry/latest`,
    );
  },

  getHistory: (vehicleId: number): Promise<TelemetryRecord[]> => {
    return apiClient<TelemetryRecord[]>(
      `/api/vehicles/${vehicleId}/telemetry`,
    );
  },

  subscribeStream: (
    vehicleId: number,
    options: TelemetryStreamOptions,
  ): TelemetryStreamSubscription => {
    const { onMessage, onError, onStatusChange } = options;
    const abortController = new AbortController();
    let isSubscribed = true;
    let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

    async function startStream() {
      if (!isSubscribed || abortController.signal.aborted) return;

      onStatusChange?.('CONNECTING');
      const token = authSession.getToken();
      if (!token) {
        onStatusChange?.('DISCONNECTED');
        return;
      }

      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        };

        const response = await fetch(
          `${API_BASE_URL}/api/vehicles/${vehicleId}/telemetry/stream`,
          {
            headers,
            signal: abortController.signal,
          },
        );

        if (!response.ok) {
          if (response.status === 401) {
            if (authSession.getToken() === token) {
              triggerUnauthorized();
            }
            onStatusChange?.('ERROR');
            onError?.(new Error('Session expired or unauthorized (401)'));
            return;
          }
          throw new Error(`SSE stream connection failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported on this response.');
        }

        onStatusChange?.('CONNECTED');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (isSubscribed) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          // The last element is incomplete buffer
          buffer = messages.pop() ?? '';

          for (const message of messages) {
            const lines = message.split('\n');
            let dataStr = '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                dataStr = trimmed.slice(5).trim();
              }
            }

            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr) as TelemetryRecord;
                onMessage(parsed);
              } catch (parseErr) {
                console.warn('Failed to parse SSE telemetry data:', parseErr);
              }
            }
          }
        }

        if (isSubscribed) {
          // Stream ended from server side, attempt reconnect
          onStatusChange?.('DISCONNECTED');
          reconnectTimeoutId = setTimeout(() => {
            if (isSubscribed) {
              void startStream();
            }
          }, 3000);
        }
      } catch (err) {
        if (!isSubscribed || abortController.signal.aborted) {
          // Normal disconnection on cleanup
          return;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        onStatusChange?.('ERROR');
        onError?.(err instanceof Error ? err : new Error(String(err)));

        // Attempt reconnect after 3 seconds if still subscribed
        reconnectTimeoutId = setTimeout(() => {
          if (isSubscribed && !abortController.signal.aborted) {
            void startStream();
          }
        }, 3000);
      }
    }

    void startStream();

    return {
      disconnect: () => {
        isSubscribed = false;
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }
        abortController.abort();
        onStatusChange?.('DISCONNECTED');
      },
    };
  },
};
