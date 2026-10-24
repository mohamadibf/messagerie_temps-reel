import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { LogOut, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { ProfileEdit } from "./ProfileEdit";
import { LogoutConfirm } from "./LogoutConfirm";
import { getImageUrl } from "@/lib/imageUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const ContactList = () => {
  const currentUser = useChatStore((s) => s.currentUser);
  const contacts = useChatStore((s) => s.contacts);
  const setContacts = useChatStore((s) => s.setContacts);
  const selectedContact = useChatStore((s) => s.selectedContact);
  const setSelectedContact = useChatStore((s) => s.setSelectedContact);
  const logout = useChatStore((s) => s.logout);
  const token = useChatStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUser || !token) {
        console.log("Skipping fetch: missing user or token", {
          currentUser,
          token,
        });
        setLoading(false);
        return;
      }

      console.log(
        "Fetching contacts with token:",
        token?.substring(0, 20) + "...",
      );

      try {
        const response = await fetch(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error(
            "Error response:",
            response.status,
            response.statusText,
          );
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("Fetched users:", data);

        // Filtrer l'utilisateur actuel de la liste
        const filteredContacts = data.filter(
          (contact: any) => contact.id !== currentUser?.id,
        );
        console.log("Filtered contacts:", filteredContacts);
        setContacts(filteredContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && token) {
      fetchContacts();
    } else {
      setLoading(false);
    }
  }, [currentUser, token, setContacts]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffMinutes < 5; // En ligne si actif dans les 5 dernières minutes
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="w-80 border-r bg-card/80 backdrop-blur flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={() => setShowProfileEdit(true)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar>
            <AvatarImage src={getImageUrl(currentUser?.profile_photo)} />
            <AvatarFallback>
              {getInitials(currentUser?.username || "")}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <h3 className="font-semibold">{currentUser?.username}</h3>
            <p className="text-xs text-muted-foreground">En ligne</p>
          </div>
        </button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowProfileEdit(true)}
            title="Modifier le profil"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLogoutConfirm(true)}
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Chargement...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucun contact disponible
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 flex items-center gap-3 rounded-2xl hover:bg-accent/70 transition-colors ${
                  selectedContact?.id === contact.id ? "bg-accent shadow-sm" : ""
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={getImageUrl(contact.profile_photo)} />
                    <AvatarFallback>
                      {getInitials(contact.username)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Indicateur en ligne */}
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                      isUserOnline(contact.last_seen)
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium">{contact.username}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showProfileEdit && (
        <ProfileEdit onClose={() => setShowProfileEdit(false)} />
      )}
      {showLogoutConfirm && (
        <LogoutConfirm
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
};
