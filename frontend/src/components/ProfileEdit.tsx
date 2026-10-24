import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { X, Camera } from "lucide-react";
import { getImageUrl } from "@/lib/imageUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ProfileEditProps {
  onClose: () => void;
}

export const ProfileEdit = ({ onClose }: ProfileEditProps) => {
  const { currentUser, setCurrentUser, token } = useChatStore();
  const [username, setUsername] = useState(currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [profilePhoto] = useState(
    currentUser?.profile_photo || "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(
    getImageUrl(currentUser?.profile_photo) || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        setError("Veuillez sélectionner une image");
        return;
      }
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedFile(file);
      // Créer une URL de prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let photoUrl = profilePhoto;

      // Uploader la photo si un fichier a été sélectionné
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(`${API_URL}/upload/profile-photo`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Erreur lors de l'upload de la photo");
        }

        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.filename;
      }

      const response = await fetch(`${API_URL}/users/${currentUser?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          profile_photo: photoUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Erreur lors de la mise à jour");
      }

      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-3xl shadow-2xl shadow-primary/20 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Modifier le profil</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewUrl} />
              <AvatarFallback className="text-2xl">
                {getInitials(username)}
              </AvatarFallback>
            </Avatar>
            <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "Choisir une photo"}
              </span>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Nom d'utilisateur
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
