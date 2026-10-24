import { useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES: { icon: string; label: string; emojis: string[] }[] = [
  {
    icon: "😊",
    label: "Smileys",
    emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 🥲 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😋 😛 😜 🤪 🤗 🤭 🤔 🤨 😐 😑 😶 🙄 😏 😬 😮 😯 😲 🥱 😴 🤤 😪 😢 😭 😤 😡 🥺 😳 🥵 🥶 😱 😨 😰 🤯 😎 🤓 🥳 😇".split(
      " ",
    ),
  },
  {
    icon: "👍",
    label: "Gestes",
    emojis: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 👋 🤝 🙏 👏 🙌 👐 🤲 💪 🫶 ✍️ 🫡".split(
      " ",
    ),
  },
  {
    icon: "❤️",
    label: "Cœurs",
    emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💯 ✨ ⭐ 🌟 🔥 🎉 🎊 🎁".split(
      " ",
    ),
  },
  {
    icon: "🐶",
    label: "Nature",
    emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🌸 🌼 🌻 🌹 🌲 🌴 🍀 🌈 ☀️ 🌙 ⛅ ❄️".split(
      " ",
    ),
  },
  {
    icon: "🍕",
    label: "Nourriture",
    emojis: "🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🥑 🌽 🥕 🍞 🧀 🍳 🥞 🍔 🍟 🍕 🌭 🌮 🍣 🍜 🍰 🍩 🍪 🍫 🍿 ☕ 🍵 🍺 🍷 🥂".split(
      " ",
    ),
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export const EmojiPicker = ({ onSelect }: EmojiPickerProps) => {
  const [active, setActive] = useState(0);

  return (
    <div
      className="w-72 rounded-3xl border bg-card p-3 shadow-xl shadow-primary/10 animate-in fade-in"
      role="dialog"
      aria-label="Sélecteur d'emojis"
    >
      <div className="mb-2 flex gap-1 rounded-2xl bg-muted p-1">
        {CATEGORIES.map((category, index) => (
          <button
            key={category.label}
            type="button"
            title={category.label}
            onClick={() => setActive(index)}
            className={cn(
              "flex-1 rounded-xl py-1 text-lg transition-colors",
              active === index ? "bg-card shadow-sm" : "hover:bg-card/60",
            )}
          >
            {category.icon}
          </button>
        ))}
      </div>
      <div className="grid h-48 grid-cols-7 gap-0.5 overflow-y-auto pr-1">
        {CATEGORIES[active].emojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="rounded-xl p-1 text-xl transition-transform hover:scale-125 hover:bg-muted"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
