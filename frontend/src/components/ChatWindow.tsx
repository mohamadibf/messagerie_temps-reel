import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ContactList } from "./ContactList";
import { useChatStore } from "@/store/chatStore";

export const ChatWindow = () => {
  const { selectedContact } = useChatStore();

  return (
    <div className="min-h-screen bg-background flex">
      <ContactList />
      <div className="flex-1 flex flex-col h-screen">
        {selectedContact ? (
          <>
            <ChatHeader />
            <ChatMessages />
            <ChatInput />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                Messagerie en temps réel
              </h2>
              <p>Sélectionnez un contact pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
