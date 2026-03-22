"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";

const HEARTBEAT_INTERVAL = 5000; // 5s
const DEFAULT_WSS_URL = "wss://universal-app-ws-proxy.particle.network";

interface AssetUpdate {
  chainId: number;
  address: string;
  amountOnChain: string;
  isToken2022: boolean;
  accountExists: boolean;
}

interface TransactionUpdate {
  transactionId: string;
  status: number; // 7 = success, 11 = failure
  sender: string;
}

interface UseUniversalAccountWSOptions {
  universalAccount: UniversalAccount | null;
  ownerAddress: string | undefined;
  evmAddress: string | undefined;
  solanaAddress: string | undefined;
  useEIP7702?: boolean;
  onAssetUpdate?: (assets: AssetUpdate[]) => void;
  onTransactionUpdate?: (tx: TransactionUpdate) => void;
}

export function useUniversalAccountWS({
  universalAccount,
  ownerAddress,
  evmAddress,
  solanaAddress,
  useEIP7702 = false,
  onAssetUpdate,
  onTransactionUpdate,
}: UseUniversalAccountWSOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const aliveRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastAssetUpdate, setLastAssetUpdate] = useState<Date | null>(null);
  
  // Pending transaction promises for waitForTransaction
  const pendingTxRef = useRef<Map<string, {
    resolve: (update: TransactionUpdate) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  const setupHeartbeat = useCallback((ws: WebSocket) => {
    aliveRef.current = true;

    heartbeatRef.current = setInterval(() => {
      if (!aliveRef.current) {
        console.log("[WSS] Connection dead, terminating");
        ws.close();
        return;
      }
      aliveRef.current = false;
      if (ws.readyState === WebSocket.OPEN) {
        // Send ping as empty message (the server expects pong frames)
        try {
          // WebSocket API doesn't have ping(), so we rely on browser handling
          // Just mark as alive when we receive any message
        } catch {
          // Ignore
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const connect = useCallback(() => {
    if (!ownerAddress || !evmAddress) {
      console.log("[WSS] Missing addresses, skipping connection");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("[WSS] Already connected");
      return;
    }

    console.log("[WSS] Connecting to", DEFAULT_WSS_URL);
    const ws = new WebSocket(DEFAULT_WSS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WSS] Connected");
      setIsConnected(true);
      setupHeartbeat(ws);

      // Subscribe to user-assets channel
      const userAssetsMsg = {
        type: "subscribe",
        channel: "user-assets",
        params: {
          ownerAddress,
          name: "UNIVERSAL",
          version: "1.0.3",
          useEIP7702,
        },
      };
      ws.send(JSON.stringify(userAssetsMsg));
      console.log("[WSS] Subscribed to user-assets");

      // Subscribe to address-update channel for tx status
      const addresses = [evmAddress, solanaAddress].filter(Boolean);
      const addressUpdateMsg = {
        type: "subscribe",
        channel: "address-update",
        params: { addresses },
      };
      ws.send(JSON.stringify(addressUpdateMsg));
      console.log("[WSS] Subscribed to address-update for", addresses);
    };

    ws.onmessage = (event) => {
      aliveRef.current = true; // Mark as alive on any message
      
      try {
        const message = JSON.parse(event.data);
        
        // Handle user-assets updates
        if (message.channel === "user-assets" && message.data?.assets) {
          console.log("[WSS] Asset update:", message.data.assets.length, "assets");
          setLastAssetUpdate(new Date());
          onAssetUpdate?.(message.data.assets);
        }
        
        // Handle transaction updates
        if (message.type === "transaction_update" && message.channel === "address-update" && message.data) {
          const txUpdate = message.data as TransactionUpdate;
          console.log("[WSS] Transaction update:", txUpdate.transactionId, "status:", txUpdate.status);
          
          // Resolve pending promise if exists
          const pending = pendingTxRef.current.get(txUpdate.transactionId);
          if (pending && (txUpdate.status === 7 || txUpdate.status === 11)) {
            pendingTxRef.current.delete(txUpdate.transactionId);
            pending.resolve(txUpdate);
          }
          
          onTransactionUpdate?.(txUpdate);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      console.error("[WSS] Error:", error);
    };

    ws.onclose = () => {
      console.log("[WSS] Connection closed");
      setIsConnected(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      
      // Reject all pending transactions
      pendingTxRef.current.forEach((pending) => {
        pending.reject(new Error("WebSocket closed"));
      });
      pendingTxRef.current.clear();
    };
  }, [ownerAddress, evmAddress, solanaAddress, useEIP7702, setupHeartbeat, onAssetUpdate, onTransactionUpdate]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        // Unsubscribe before closing
        const unsubUserAssets = {
          type: "unsubscribe",
          channel: "user-assets",
          params: { ownerAddress, name: "UNIVERSAL", version: "1.0.3", useEIP7702 },
        };
        wsRef.current.send(JSON.stringify(unsubUserAssets));
        
        const addresses = [evmAddress, solanaAddress].filter(Boolean);
        const unsubAddress = {
          type: "unsubscribe",
          channel: "address-update",
          params: { addresses },
        };
        wsRef.current.send(JSON.stringify(unsubAddress));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setIsConnected(false);
  }, [ownerAddress, evmAddress, solanaAddress, useEIP7702]);

  // Wait for a specific transaction to complete
  const waitForTransaction = useCallback((transactionId: string, timeoutMs = 60000): Promise<TransactionUpdate> => {
    return new Promise((resolve, reject) => {
      // Check if already exists
      const existing = pendingTxRef.current.get(transactionId);
      if (existing) {
        reject(new Error("Already waiting for this transaction"));
        return;
      }

      pendingTxRef.current.set(transactionId, { resolve, reject });

      // Timeout
      setTimeout(() => {
        const pending = pendingTxRef.current.get(transactionId);
        if (pending) {
          pendingTxRef.current.delete(transactionId);
          pending.reject(new Error("Transaction wait timeout"));
        }
      }, timeoutMs);
    });
  }, []);

  // Auto-connect when addresses are available
  useEffect(() => {
    if (universalAccount && ownerAddress && evmAddress) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [universalAccount, ownerAddress, evmAddress, connect, disconnect]);

  return {
    isConnected,
    lastAssetUpdate,
    waitForTransaction,
    reconnect: connect,
    disconnect,
  };
}
