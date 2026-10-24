import { memo } from "react";
import { Download, FileText } from "lucide-react";
import type { Message } from "@/store/chatStore";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUtils";

interface ChatBubbleProps {
  message: Message;
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

// Seuls ces formats sont affichés en image (SVG exclu : peut contenir des scripts)
const DISPLAYABLE_IMAGES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

// Message composé uniquement d'emojis (1 à 3) : affiché en grand, sans bulle
const EMOJI_ONLY =
  /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*){1,3}$/u;

export const ChatBubble = memo(function ChatBubble({
  message,
}: ChatBubbleProps) {
  const currentUser = useChatStore((s) => s.currentUser);
  const isCurrentUser = message.sender_id === currentUser?.id;

  const attachmentUrl = message.attachment_url
    ? getImageUrl(message.attachment_url)
    : null;
  const isImage = DISPLAYABLE_IMAGES.has(message.attachment_type ?? "");
  const isBigEmoji =
    !attachmentUrl && EMOJI_ONLY.test(message.content.trim());

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const time = (
    <span
      className={cn(
        "text-[11px] mt-1 block opacity-60",
        isCurrentUser ? "text-right" : "text-left",
      )}
    >
      {formatTime(message.timestamp)}
    </span>
  );

  return (
    <div
      className={cn(
        "flex w-full mb-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={getImageUrl(message.profile_photo)} />
          <AvatarFallback>
            {message.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%]",
          isBigEmoji
            ? "px-1"
            : cn(
                "rounded-3xl px-4 py-2.5 shadow-sm",
                isCurrentUser
                  ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground rounded-br-lg shadow-primary/20"
                  : "bg-card text-card-foreground border rounded-bl-lg",
              ),
        )}
      >
        {attachmentUrl && isImage && (
          <a href={attachmentUrl} target="_blank" rel="noreferrer">
            <img
              src={attachmentUrl}
              alt={message.attachment_name || "Image"}
              className="mb-1 max-h-64 rounded-2xl object-cover"
            />
          </a>
        )}
        {attachmentUrl && !isImage && (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
            download={message.attachment_name || undefined}
            className={cn(
              "mb-1 flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
              isCurrentUser
                ? "bg-white/15 hover:bg-white/25"
                : "bg-muted hover:bg-muted/70",
            )}
          >
            <FileText className="h-8 w-8 shrink-0 opacity-80" />
            <span className="min-w-0 flex-1">
              <span className="block max-w-48 truncate text-sm font-medium">
                {message.attachment_name || "Fichier"}
              </span>
              <span className="block text-xs opacity-70">
                {formatSize(message.attachment_size)}
              </span>
            </span>
            <Download className="h-4 w-4 shrink-0 opacity-70" />
          </a>
        )}
        {message.content && (
          <p
            className={cn(
              "leading-relaxed wrap-break-word whitespace-pre-wrap",
              isBigEmoji ? "text-5xl" : "text-sm",
            )}
          >
            {message.content}
          </p>
        )}
        {time}
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={getImageUrl(currentUser?.profile_photo)} />
          <AvatarFallback>
            {currentUser?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
