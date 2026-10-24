import { createContext, useContext } from "react";
import type { Attachment } from "../types";

export interface WebSocketContextValue {
  sendMessage: (content: string, attachment?: Attachment) => boolean;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(
  null,
);

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket doit être utilisé dans un WebSocketProvider");
  }
  return context;
};
