import type { Message } from "@/store/chatStore";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/imageUtils";

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble = ({ message }: ChatBubbleProps) => {
  const { currentUser } = useChatStore();
  const isCurrentUser = message.sender_id === currentUser?.id;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm",
          isCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-secondary text-secondary-foreground rounded-bl-sm",
        )}
      >
        <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
          {message.content}
        </p>
        <span
          className={cn(
            "text-xs mt-1 block opacity-70",
            isCurrentUser ? "text-right" : "text-left",
          )}
        >
          {formatTime(message.timestamp)}
        </span>
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
};
