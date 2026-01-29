import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../store/chatStore";
import type { Message } from "../store/chatStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("http://", "ws://").replace(
  "https://",
  "wss://",
);

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const {
    currentUser,
    selectedContact,
    addMessage,
    setMessages,
    setConnected,
    token,
  } = useChatStore();

  const connect = useCallback(() => {
    if (!currentUser?.id || !token) return;

    try {
      const ws = new WebSocket(`${WS_URL}/ws/${currentUser.id}?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "history") {
            // Charger l'historique des messages
            setMessages(data.messages || []);
          } else if (data.type === "message") {
            // Nouveau message - vérifier si ce n'est pas un message qu'on a déjà ajouté localement
            const messageKey = `${data.content}-${data.timestamp}`;
            if (!sentMessagesRef.current.has(messageKey)) {
              addMessage(data as Message);
            }
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);

        // Reconnexion automatique après 3 secondes
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setConnected(false);
    }
  }, [addMessage, setMessages, setConnected, currentUser]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!currentUser?.id || !selectedContact?.id) return false;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const timestamp = new Date().toISOString();
        const message: Message = {
          id: Date.now().toString(),
          content,
          sender_id: currentUser.id,
          receiver_id: selectedContact.id,
          timestamp,
          username: currentUser.username,
          profile_photo: currentUser.profile_photo,
        };

        // Marquer ce message comme envoyé pour éviter les doublons
        const messageKey = `${content}-${timestamp}`;
        sentMessagesRef.current.add(messageKey);

        // Nettoyer les anciens messages après 5 secondes
        setTimeout(() => {
          sentMessagesRef.current.delete(messageKey);
        }, 5000);

        // Ajouter le message localement immédiatement
        addMessage(message);

        // Envoyer au serveur
        wsRef.current.send(
          JSON.stringify({
            content,
            receiver_id: selectedContact.id,
            timestamp,
          }),
        );
        return true;
      }
      return false;
    },
    [addMessage, currentUser, selectedContact],
  );

  useEffect(() => {
    if (token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [connect, disconnect, token]);

  return {
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
