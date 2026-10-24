import { Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getImageUrl } from "@/lib/imageUtils";
import { Button } from "./ui/button";
import { useChatStore } from "@/store/chatStore";
import { useEffect, useState } from "react";

export const ChatHeader = () => {
  const { isConnected, selectedContact } = useChatStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="border-b bg-card/70 backdrop-blur">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getImageUrl(selectedContact?.profile_photo)} />
            <AvatarFallback>
              {selectedContact?.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">
              {selectedContact?.username || "Chat IA"}
            </h1>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "En ligne" : "Hors ligne"}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={isDark ? "Mode clair" : "Mode sombre"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};
