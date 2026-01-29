const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getImageUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
};
