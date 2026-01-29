import { useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChatStore } from "@/store/chatStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { refineMessage, suggestMessage } from "@/services/api";
import { cn } from "@/lib/utils";

export const ChatInput = () => {
  const {
    inputValue,
    setInputValue,
    messages,
    setLoading,
    suggestions,
    setSuggestions,
  } = useChatStore();
  const { sendMessage, isConnected } = useWebSocket();
  const [isAILoading, setIsAILoading] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) return;

    sendMessage(inputValue.trim());
    setInputValue("");
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAIClick = async () => {
    setIsAILoading(true);
    setLoading(true);

    try {
      // Convertir les messages au format attendu par l'API
      const { currentUser, selectedContact } = useChatStore.getState();
      const historyForAPI = messages.map((m) => ({
        content: m.content,
        sender: m.sender_id === currentUser?.id ? "user" : "contact",
        timestamp: m.timestamp,
      }));

      if (inputValue.trim()) {
        // Refine mode: improve the current input
        const result = await refineMessage(inputValue, historyForAPI);
        // Ajouter toutes les reformulations comme suggestions bulles
        setSuggestions(result.suggestions || []);
      } else {
        // Suggest mode: suggest new messages
        const result = await suggestMessage(historyForAPI.slice(-10));
        setSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      setIsAILoading(false);
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
  };

  const removeSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Bulles de suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group relative inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm transition-all hover:scale-105"
              >
                <Sparkles className="h-3 w-3" />
                <span className="max-w-md truncate">{suggestion}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSuggestion(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Champ de saisie */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                isConnected
                  ? "Écrivez votre message..."
                  : "En attente de connexion..."
              }
              disabled={!isConnected || isAILoading}
              className="pr-12 resize-none"
            />
          </div>

          <Button
            onClick={handleAIClick}
            disabled={!isConnected || isAILoading}
            variant="outline"
            size="icon"
            className={cn("transition-all", isAILoading && "animate-pulse")}
            title={
              inputValue.trim() ? "Améliorer le message" : "Suggérer un message"
            }
          >
            <Sparkles className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected || isAILoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {!isConnected && (
          <div className="text-center">
            <span className="text-xs text-destructive">
              Déconnecté - Tentative de reconnexion...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
