import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { ChatBubble } from "./ChatBubble";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const ChatMessages = () => {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const currentUser = useChatStore((s) => s.currentUser);
  const selectedContact = useChatStore((s) => s.selectedContact);
  const setMessages = useChatStore((s) => s.setMessages);
  const token = useChatStore((s) => s.token);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger l'historique des messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser?.id || !selectedContact?.id) return;

      try {
        const response = await fetch(
          `${API_URL}/messages/${currentUser.id}/${selectedContact.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser, selectedContact, setMessages, token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Bienvenue sur le Chat IA</h3>
            <p className="text-sm">
              Commencez une conversation ou utilisez le bouton ✨ AI pour
              obtenir des suggestions
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
