import { ChatWindow } from "./components/ChatWindow";
import { Auth } from "./components/Auth";
import { WebSocketProvider } from "./components/WebSocketProvider";
import { useChatStore } from "./store/chatStore";
import "./App.css";

function App() {
  const currentUser = useChatStore((s) => s.currentUser);

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <WebSocketProvider>
      <ChatWindow />
    </WebSocketProvider>
  );
}

export default App;
