import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Paperclip,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { EmojiPicker } from "./EmojiPicker";
import { useChatStore } from "@/store/chatStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { refineMessage, suggestMessage, uploadFile } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  const [showEmojis, setShowEmojis] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Fermer le sélecteur d'emojis au clic extérieur
  useEffect(() => {
    if (!showEmojis) return;
    const onClick = (e: MouseEvent) => {
      if (!emojiRef.current?.contains(e.target as Node)) setShowEmojis(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showEmojis]);

  const canSend =
    (inputValue.trim().length > 0 || attachment !== null) &&
    isConnected &&
    !isAILoading &&
    !isUploading;

  const handleSend = () => {
    if (!canSend) return;

    sendMessage(inputValue.trim(), attachment ?? undefined);
    setInputValue("");
    setAttachment(null);
    setSuggestions([]);
    setShowEmojis(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? inputValue.length;
    const end = input?.selectionEnd ?? inputValue.length;
    setInputValue(inputValue.slice(0, start) + emoji + inputValue.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Fichier trop volumineux (10 Mo maximum)");
      return;
    }

    setIsUploading(true);
    try {
      setAttachment(await uploadFile(file));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Échec de l'envoi du fichier",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAIClick = async () => {
    setIsAILoading(true);
    setLoading(true);

    try {
      // Convertir les messages au format attendu par l'API
      const { currentUser } = useChatStore.getState();
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
    <div className="bg-transparent px-4 pb-4 pt-2">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Bulles de suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="group inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary transition-all hover:bg-primary/20"
              >
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="inline-flex items-center gap-2"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="max-w-md truncate">{suggestion}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Retirer la suggestion"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pièce jointe en attente */}
        {(attachment || isUploading || uploadError) && (
          <div className="animate-in fade-in flex items-center gap-2">
            {isUploading && (
              <span className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Envoi du fichier…
              </span>
            )}
            {attachment && (
              <span className="inline-flex max-w-xs items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2 text-xs text-primary">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Retirer le fichier"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {uploadError && (
              <span className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {uploadError}
              </span>
            )}
          </div>
        )}

        {/* Champ de saisie */}
        <div className="relative flex items-center gap-1 rounded-full border bg-card p-1.5 shadow-lg shadow-primary/5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            data-testid="file-input"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
            title="Joindre un fichier"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div ref={emojiRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground"
              onClick={() => setShowEmojis((v) => !v)}
              disabled={!isConnected}
              title="Emojis"
            >
              <Smile className="h-4 w-4" />
            </Button>
            {showEmojis && (
              <div className="absolute bottom-12 left-0 z-20">
                <EmojiPicker onSelect={insertEmoji} />
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isConnected
                ? "Écrivez votre message..."
                : "En attente de connexion..."
            }
            disabled={!isConnected || isAILoading}
            className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />

          <Button
            onClick={handleAIClick}
            disabled={!isConnected || isAILoading}
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full text-primary transition-all",
              isAILoading && "animate-pulse",
            )}
            title={
              inputValue.trim() ? "Améliorer le message" : "Suggérer un message"
            }
          >
            <Sparkles className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className="rounded-full shadow-md shadow-primary/30"
            title="Envoyer"
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
