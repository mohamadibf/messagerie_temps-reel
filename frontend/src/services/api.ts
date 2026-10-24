import type { Attachment } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper pour obtenir le token depuis le localStorage
const getAuthToken = (): string | null => {
  try {
    const storage = localStorage.getItem("chat-storage");
    if (storage) {
      const parsed = JSON.parse(storage);
      return parsed.state?.token || null;
    }
  } catch {
    return null;
  }
  return null;
};

// Helper pour créer les headers avec authentification
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export interface RefineResponse {
  suggestions: string[];
  error?: string;
}

export interface SuggestResponse {
  suggestions: string[];
  error?: string;
}

export const refineMessage = async (
  text: string,
  history: Array<{ content: string; sender: string; timestamp: string }>,
): Promise<RefineResponse> => {
  try {
    const response = await fetch(`${API_URL}/ai/refine`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ message: text, history }),
    });

    if (!response.ok) {
      throw new Error("Failed to refine message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error refining message:", error);
    return { suggestions: [text], error: "Failed to refine" };
  }
};

export const suggestMessage = async (
  history: Array<{ content: string; sender: string; timestamp: string }>,
): Promise<SuggestResponse> => {
  try {
    const response = await fetch(`${API_URL}/ai/suggest`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversation: history }),
    });

    if (!response.ok) {
      throw new Error("Failed to get suggestion");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting suggestion:", error);
    return {
      suggestions: ["Comment puis-je vous aider ?"],
      error: "Failed to suggest",
    };
  }
};

export const uploadFile = async (file: File): Promise<Attachment> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload/file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Échec de l'envoi du fichier");
  }

  return response.json();
};
