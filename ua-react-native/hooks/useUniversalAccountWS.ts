import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "wss://universal-app-ws-proxy.particle.network";
const HEARTBEAT_INTERVAL = 5000;

interface TransactionUpdate {
  transactionId: string;
  status: number;
}

interface UseUniversalAccountWSOptions {
  address?: string;
  onAssetUpdate?: () => void;
  onAddressUpdate?: (data: any) => void;
}

interface UseUniversalAccountWSReturn {
  isConnected: boolean;
  lastAssetUpdate: number | null;
  waitForTransaction: (transactionId: string, timeoutMs?: number) => Promise<boolean>;
  reconnect: () => void;
  disconnect: () => void;
}

export function useUniversalAccountWS(
  options: UseUniversalAccountWSOptions = {}
): UseUniversalAccountWSReturn {
  const { address, onAssetUpdate, onAddressUpdate } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastAssetUpdate, setLastAssetUpdate] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const txListenersRef = useRef<
    Map<string, (status: number) => void>
  >(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRef = useRef(address);
  addressRef.current = address;

  const onAssetUpdateRef = useRef(onAssetUpdate);
  onAssetUpdateRef.current = onAssetUpdate;
  const onAddressUpdateRef = useRef(onAddressUpdate);
  onAddressUpdateRef.current = onAddressUpdate;

  const startHeartbeat = useCallback((ws: WebSocket) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const subscribe = useCallback((ws: WebSocket) => {
    if (!addressRef.current || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "subscribe",
        channel: "user-assets",
        address: addressRef.current,
      })
    );
    ws.send(
      JSON.stringify({
        type: "subscribe",
        channel: "address-update",
        address: addressRef.current,
      })
    );
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsConnected(true);
        startHeartbeat(ws);
        subscribe(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.channel === "user-assets") {
            setLastAssetUpdate(Date.now());
            onAssetUpdateRef.current?.();
          }

          if (data.channel === "address-update") {
            onAddressUpdateRef.current?.(data);
          }

          if (data.transactionId && data.status !== undefined) {
            const listener = txListenersRef.current.get(data.transactionId);
            if (listener) {
              listener(data.status);
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        stopHeartbeat();
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }, [startHeartbeat, stopHeartbeat, subscribe]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    stopHeartbeat();
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [stopHeartbeat]);

  const reconnect = useCallback(() => {
    disconnect();
    connect();
  }, [disconnect, connect]);

  const waitForTransaction = useCallback(
    (transactionId: string, timeoutMs = 120000): Promise<boolean> => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          txListenersRef.current.delete(transactionId);
          resolve(false);
        }, timeoutMs);

        txListenersRef.current.set(transactionId, (status: number) => {
          clearTimeout(timeout);
          txListenersRef.current.delete(transactionId);
          if (status === 7) {
            resolve(true);
          } else if (status === 11) {
            resolve(false);
          }
        });
      });
    },
    []
  );

  useEffect(() => {
    if (address) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [address, connect, disconnect]);

  useEffect(() => {
    if (isConnected && wsRef.current) {
      subscribe(wsRef.current);
    }
  }, [address, isConnected, subscribe]);

  return {
    isConnected,
    lastAssetUpdate,
    waitForTransaction,
    reconnect,
    disconnect,
  };
}
