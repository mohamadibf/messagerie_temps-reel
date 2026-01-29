import { ChatWindow } from "./components/ChatWindow";
import { Auth } from "./components/Auth";
import { useChatStore } from "./store/chatStore";
import "./App.css";

function App() {
  const { currentUser } = useChatStore();

  if (!currentUser) {
    return <Auth />;
  }

  return <ChatWindow />;
}

export default App;
