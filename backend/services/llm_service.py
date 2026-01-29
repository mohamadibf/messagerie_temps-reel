import os
from typing import List, Dict
from dotenv import load_dotenv
from groq import Groq


load_dotenv()


class AIService:
    def __init__(self):
        """
        Initialise le service IA avec Groq.
        Utilise l'API Groq gratuite et rapide avec les modèles Llama 3, Mixtral.
        """
        api_key = os.getenv("GROQ_API_KEY")

        # Utilise Llama 3.3 70B - rapide et performant
        self.model_name = "llama-3.3-70b-versatile"

        self.client = Groq(api_key=api_key) if api_key else None

        self.use_mock = not api_key
        print(
            f"AI Service initialized - Mock mode: {self.use_mock}, Model: {self.model_name if not self.use_mock else 'None'}"
        )
        print(f"AI Service initialized - Mock mode: {self.use_mock}")

    def _build_context(self, history: List[Dict]) -> str:
        """Construire le contexte de conversation à partir de l'historique"""
        context = []
        for msg in history[-10:]:  # 10 derniers messages
            content = msg.get("content", "")
            sender = msg.get("sender", "user")

            if sender == "user":
                context.append(f"Vous: {content}")
            else:  # contact
                context.append(f"Contact: {content}")

        return "\n".join(context) if context else ""

    async def refine_message(self, text: str, history: List[Dict]) -> List[str]:
        """
        Reformuler le message de l'utilisateur basé sur le contexte de conversation.
        Retourne plusieurs versions reformulées (3-4 variations).
        """
        if self.use_mock:
            return self._mock_refine(text)

        try:
            # Génére 3 variations avec différentes températures
            refinements = []

            for i, (temp, style) in enumerate(
                [
                    (0.5, "professionnel et formel"),
                    (0.7, "clair et naturel"),
                    (0.9, "amical et engageant"),
                ]
            ):
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": f"Tu es un assistant qui améliore les messages de chat. Reformule le message de manière {style}. Réponds UNIQUEMENT avec le message reformulé, sans explication.",
                        },
                        {"role": "user", "content": f"Message à reformuler: {text}"},
                    ],
                    max_tokens=150,
                    temperature=temp,
                )
                refined = response.choices[0].message.content.strip()
                if refined and refined not in refinements:
                    refinements.append(refined)

            return refinements[:3]  # Maximum 3 suggestions
        except Exception as e:
            print(f"AI Refine error: {e}")
            return [text]

    async def suggest_response(self, history: List[Dict]) -> List[str]:
        """
        Suggérer des réponses contextuelles basées sur la conversation récente.
        Retourne plusieurs suggestions (3-4 variations).
        """
        if self.use_mock:
            return self._mock_suggest(history)

        try:
            if not history:
                return [
                    "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
                    "Salut ! Comment allez-vous ?",
                    "Bienvenue ! Que puis-je faire pour vous ?",
                ]

            context = self._build_context(history)
            suggestions = []

            # Générer 3 suggestions avec différentes approches
            for i, (temp, tone) in enumerate(
                [
                    (0.7, "informatif et utile"),
                    (0.8, "engageant et naturel"),
                    (0.9, "créatif et pertinent"),
                ]
            ):
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": f"Tu es un assistant qui aide à répondre aux messages. Analyse la conversation entre 'Vous' et 'Contact' et propose une réponse {tone} et concise (1-2 phrases) que 'Vous' pourrait envoyer. Réponds UNIQUEMENT avec le message suggéré, sans préfixe ni explication.",
                        },
                        {
                            "role": "user",
                            "content": f"Conversation:\n{context}\n\nPropose une réponse appropriée de 'Vous' au dernier message de 'Contact'.",
                        },
                    ],
                    max_tokens=100,
                    temperature=temp,
                )
                suggestion = response.choices[0].message.content.strip()
                if suggestion and suggestion not in suggestions:
                    suggestions.append(suggestion)

            return suggestions[:3]  # Maximum 3 suggestions
        except Exception as e:
            print(f"AI Suggest error: {e}")
            return ["Je vois, continuez..."]

    def _mock_refine(self, text: str) -> List[str]:
        """Reformulation factice quand aucune clé API n'est disponible"""
        return [
            f"✨ {text.capitalize().strip()}",
            f"💬 {text.strip()}.",
            f"🚀 {text.title()}",
        ]

    def _mock_suggest(self, history: List[Dict]) -> List[str]:
        """Suggestion factice quand aucune clé API n'est disponible"""
        if not history:
            return [
                "Bonjour ! Comment allez-vous aujourd'hui ?",
                "Salut ! Que puis-je faire pour vous ?",
                "Bienvenue ! Comment puis-je vous aider ?",
            ]

        import random

        all_suggestions = [
            "C'est intéressant, pouvez-vous m'en dire plus ?",
            "Je comprends. Que pensez-vous de cette situation ?",
            "D'accord, et ensuite ?",
            "C'est une perspective intéressante !",
            "Comment puis-je vous aider davantage ?",
            "Je vois ce que vous voulez dire.",
            "Continuez, je vous écoute.",
            "Très bien, qu'en pensez-vous ?",
        ]

        return random.sample(all_suggestions, min(3, len(all_suggestions)))
