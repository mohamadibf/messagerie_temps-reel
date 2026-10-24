import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useChatStore } from "@/store/chatStore";
import type { Message } from "@/store/chatStore";
import { WebSocketContext } from "@/hooks/useWebSocket";
import type { Attachment } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("http://", "ws://").replace(
  "https://",
  "wss://",
);

/**
 * Maintient une unique connexion WebSocket pour toute la session
 * (indépendamment de la conversation ouverte).
 */
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const userId = useChatStore((s) => s.currentUser?.id);
  const token = useChatStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId || !token) return;

    let closed = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    const { setConnected } = useChatStore.getState();

    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/ws/${userId}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "message") return;

          // N'afficher que les messages de la conversation ouverte
          const { selectedContact, addMessage } = useChatStore.getState();
          if (data.sender_id === selectedContact?.id) {
            addMessage(data as Message);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = (error) => console.error("WebSocket error:", error);

      ws.onclose = () => {
        setConnected(false);
        if (!closed) reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [userId, token]);

  const sendMessage = useCallback(
    (content: string, attachment?: Attachment) => {
      const { currentUser, selectedContact, addMessage } =
        useChatStore.getState();
      const ws = wsRef.current;
      if (!currentUser || !selectedContact || ws?.readyState !== WebSocket.OPEN)
        return false;

      const timestamp = new Date().toISOString();

      // Affichage immédiat côté expéditeur (le serveur ne renvoie pas l'écho)
      addMessage({
        id: Date.now().toString(),
        content,
        sender_id: currentUser.id,
        receiver_id: selectedContact.id,
        timestamp,
        username: currentUser.username,
        profile_photo: currentUser.profile_photo,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
        attachment_size: attachment?.size,
      });

      ws.send(
        JSON.stringify({
          content,
          receiver_id: selectedContact.id,
          timestamp,
          attachment,
        }),
      );
      return true;
    },
    [],
  );

  const value = useMemo(() => ({ sendMessage }), [sendMessage]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
