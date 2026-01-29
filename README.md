# 💬 Messagerie Temps Réel avec IA

Application de messagerie instantanée moderne style WhatsApp/Messenger avec intelligence artificielle intégrée. Développée avec FastAPI (Python) et React (TypeScript), elle offre une expérience utilisateur fluide avec authentification JWT sécurisée, profils utilisateurs et suggestions IA contextuelles.

## Fonctionnalités

### Authentification & Sécurité

- **Authentification JWT sécurisée** avec tokens à durée limitée (7 jours)
- **Hachage bcrypt** pour les mots de passe (sécurité renforcée)
- **Validation email** avec Pydantic et contraintes robustes
- **Gestion de session** avec persistence localStorage
- **Protection CORS** configurée pour les origines autorisées
- **Validation de tokens** pour toutes les routes protégées

### Profils Utilisateurs

- **Profils personnalisables** (username, email, photo de profil)
- **Upload sécurisé de photos** depuis l'ordinateur local
- **Indicateur de statut** en ligne/hors ligne (basé sur last_seen)
- **Édition de profil** en temps réel avec validation

### Messagerie en Temps Réel

- **Chat 1-to-1** entre utilisateurs authentifiés
- **WebSocket sécurisé** avec authentification JWT via query parameters
- **Messages instantanés** bidirectionnels avec reconnexion automatique
- **Historique persistant** stocké en base SQLite avec intégrité référentielle
- **Avatars utilisateurs** dans les bulles de chat
- **Timestamps** avec formatage localisé français
- **Liste de contacts** avec filtrage automatique (exclusion utilisateur actuel)

### Intelligence Artificielle (Groq)

- **Reformulation de messages** : 3 variations (professionnel, naturel, amical)
- **Suggestions de réponses** : IA contextuelle analysant la conversation
- **Reconnaissance du contexte** : Différencie "vous" et "contact" dans l'historique
- **Bulles de suggestions** cliquables au-dessus du champ de saisie
- **Modèle**: Llama 3.3 70B Versatile via Groq API

### Interface Moderne

- **Design WhatsApp/Messenger** avec sidebar contacts
- **Mode clair/sombre** avec basculement persistant
- **Animations fluides** (fade-in, slide-in)
- **Composants shadcn/ui** (Avatar, Button, Card, Input)
- **Responsive** et adaptatif mobile
- **Confirmation de déconnexion** pour éviter les erreurs

## Stack Technique

### Backend

- **FastAPI** Framework web Python async avec validation automatique
- **WebSockets** - Communication bidirectionnelle temps réel avec authentification JWT
- **SQLite** - Base de données relationnelle (users, messages, conversations) avec contraintes FK
- **JWT (python-jose)** - Authentification par tokens sécurisés avec expiration
- **bcrypt** - Hachage sécurisé des mots de passe (remplace SHA256)
- **Groq API** - LLM Llama 3.3 70B Versatile pour IA
- **Pydantic** - Validation de données avec types Python
- **python-dotenv** - Gestion des variables d'environnement
- **CORS middleware** - Configuration sécurisée des origines autorisées

### Frontend

- **React** UI library avec dernières fonctionnalités et hooks modernes
- **TypeScript** - Typage statique fort pour meilleure maintenabilité
- **Vite** Build tool ultra-rapide avec HMR et optimisations
- **Zustand** - State management avec persist middleware et DevTools
- **Tailwind CSS** Framework utility-first avec design tokens
- **shadcn/ui** - Composants accessibles et modernes
- **Lucide React** - Icônes SVG cohérentes et optimisées

## Architecture du Projet

```
messagerie_temps_reel/
├── backend/
│   ├── main.py                    # Point d'entrée FastAPI, routes, WebSocket avec JWT
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm_service.py         # Service Groq LLM
│   │   └── auth.py                # Service JWT (creation, validation, bcrypt)
│   ├── api/
│   │   ├── __init__.py
│   │   └── ai.py                  # Routes AI (/ai/refine, /ai/suggest)
│   ├── models/
│   │   ├── __init__.py
│   │   └── message.py             # Pydantic models (User, Message, Token)
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py            # CRUD SQLite avec bcrypt auth
│   ├── uploads/                   # Photos de profil uploadées (dans backend/)
│   ├── chat.db                    # Base de données SQLite (dans backend/)
│   ├── requirements.txt           # Dépendances avec python-jose, bcrypt
│   ├── .env                       # SECRET_KEY + GROQ_API_KEY
│   └── .env.example               # Template de configuration
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/                # shadcn/ui components
    │   │   ├── Auth.tsx           # Login/Signup avec JWT
    │   │   ├── ContactList.tsx    # Sidebar avec contacts + auth
    │   │   ├── ChatWindow.tsx     # Layout principal
    │   │   ├── ChatHeader.tsx     # En-tête avec contact sélectionné
    │   │   ├── ChatMessages.tsx   # Liste des messages
    │   │   ├── ChatInput.tsx      # Input + boutons AI
    │   │   ├── ChatBubble.tsx     # Bulle de message
    │   │   ├── ProfileEdit.tsx    # Édition de profil
    │   │   └── LogoutConfirm.tsx  # Confirmation déconnexion
    │   ├── store/
    │   │   └── chatStore.ts       # État global Zustand + token JWT
    │   ├── hooks/
    │   │   └── useWebSocket.ts    # Hook WebSocket avec JWT auth
    │   ├── services/
    │   │   └── api.ts             # Client API avec Authorization headers
    │   ├── types/
    │   │   └── index.ts           # Interfaces TS (User, Message, Token)
    │   ├── lib/
    │   │   ├── utils.ts           # cn() helper
    │   │   └── imageUtils.ts      # getImageUrl() helper
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html                 # Meta tags mobiles mis à jour
    ├── package.json
    ├── .env                       # VITE_API_URL configuration
    └── vite.config.ts
```

    │   │   └── useWebSocket.ts    # Hook WebSocket custom
    │   ├── services/
    │   │   └── api.ts             # Client API (refine, suggest)
    │   ├── types/
    │   │   └── index.ts           # Interfaces TS (User, Message)
    │   ├── lib/
    │   │   ├── utils.ts           # cn() helper
    │   │   └── imageUtils.ts      # getImageUrl() helper
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    └── vite.config.ts

````

## Installation et Démarrage

### Prérequis

- **Python** 3.12+
- **Node.js** 18+ & npm
- **Clé API Groq** (gratuite sur groq.com)

### 🔧 Configuration Backend

1. **Naviguer vers le dossier backend** :

```bash
cd backend
````

2. **Créer un environnement virtuel** :

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou
.venv\Scripts\activate     # Windows
```

3. **Installer les dépendances** :

```bash
pip install -r requirements.txt
```

4. **Configurer les variables d'environnement** :

Créer un fichier `.env` avec :

```bash
# Clé API Groq (obligatoire pour l'IA)
GROQ_API_KEY=votre_clé_groq_ici

# Clé secrète pour JWT (obligatoire pour l'authentification)
SECRET_KEY=votre_cle_secrete_jwt_ici
```

Ou copier depuis l'exemple et modifier :

```bash
cp .env.example .env
# Puis éditer .env avec vos clés
```

**Générer une clé JWT sécurisée** :

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

1. **Lancer le serveur** :

```bash
# Depuis le dossier backend avec le bon PYTHONPATH
cd /chemin/vers/backend
fastapi dev
ou
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Le serveur démarre sur **http://localhost:8000**

**API Documentation automatique** :

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

### 🎨 Configuration Frontend

1. **Naviguer vers le dossier frontend** :

```bash
cd frontend
```

2. **Installer les dépendances** :

```bash
npm install
```

3. **Lancer l'application** :

```bash
npm run dev
```

✅ L'application est accessible sur **http://localhost:5174**

**Note** : Le frontend se connecte automatiquement au backend sur `http://localhost:8000` (configurable via `.env`)

## Architecture et Décisions Techniques

### Base de Données : SQLite

**Choix actuel** : Parfait pour développement, prototypage et portfolio

- ✅ Configuration zéro, fichier unique
- ✅ Transactions ACID fiables
- ✅ Suffisant pour < 100 utilisateurs simultanés
- ⚠️ Un seul writer (limitation concurrence)
- ⚠️ Pas de scalabilité horizontale

**Migration recommandée pour production** : **PostgreSQL**

- Multi-utilisateurs avec MVCC
- Réplication et haute disponibilité
- Full-text search natif
- JSON queries avancées
- Migration simple (même schéma relationnel)

### WebSocket vs HTTP Polling

**Pourquoi WebSocket ?**

- ✅ Communication bidirectionnelle full-duplex
- ✅ Latence minimale (< 10ms)
- ✅ Réduction de 90% de la bande passante vs polling
- ✅ Connexion persistante avec reconnexion auto
- ✅ Broadcast efficace à tous les clients connectés

**Architecture WebSocket** :

```python
# Backend : ConnectionManager
- Dict[user_id, WebSocket] pour routing ciblé
- send_personal_message() pour messages 1-to-1
- Auto-disconnect sur erreur
- Update last_seen sur activité

# Frontend : useWebSocket hook
- Reconnexion auto après 3s de déconnexion
- Déduplication messages (sentMessagesRef)
- Gestion état connexion globale
```

### Intégration IA : Groq

**Pourquoi Groq ?**

- ✅ **Vitesse** : Réponses < 1s (LPU vs GPU)
- ✅ **Gratuit** : Quota généreux pour prototypage
- ✅ **Llama 3.3 70B** : Qualité état-de-l'art
- ✅ API compatible OpenAI (migration facile)

**Stratégie de prompts** :

```python
# Refine : 3 variations avec températures différentes
- 0.5 → professionnel et formel
- 0.7 → clair et naturel
- 0.9 → amical et engageant

# Suggest : Contextualisation conversation
- Analyse 10 derniers messages
- Distinction "Vous" vs "Contact"
- Génération 3 réponses appropriées
```

### State Management : Zustand

**Pourquoi pas Redux/Context ?**

- ✅ **Simplicité** : 10x moins de boilerplate
- ✅ **Performance** : Pas de re-render inutiles
- ✅ **Persistence** : Middleware intégré (localStorage)
- ✅ **DevTools** : Debug facile
- ✅ **TypeScript** : Support natif excellent

**Store global** :

```typescript
- currentUser : User | null (session)
- selectedContact : User | null (contact actif)
- messages : Message[] (historique chargé)
- contacts : User[] (liste filtrée)
- Persist : currentUser sauvegardé entre sessions
```

### Sécurité et Authentification

**Authentification JWT** :

- ✅ **Tokens sécurisés** : Génération avec secret key robuste
- ✅ **Expiration** : 7 jours par défaut (configurable)
- ✅ **Validation** : Vérification sur toutes les routes protégées
- ✅ **bcrypt** : Hachage des mots de passe (sécurité production)
- ✅ **Headers Authorization** : Standard Bearer token
- ✅ **WebSocket Auth** : Token transmis via query parameter (limitation WebSocket)

**Sécurité fichiers** :

- ✅ **Validation MIME** : Images uniquement (image/\*)
- ✅ **Limite taille** : 5MB maximum
- ✅ **Noms uniques** : UUID pour éviter les collisions
- ✅ **Isolation** : Fichiers dans `/backend/uploads/`
- ✅ **Pas d'exécution** : Servis via StaticFiles seulement

**CORS et Réseau** :

```python
# Origins autorisées
allow_origins=[
    "http://localhost:5173",  # Vite dev
    "http://localhost:5174",  # Vite dev (port alternatif)
    "http://localhost:3000",  # React dev standard
    "http://127.0.0.1:5173",  # Localhost alias
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]
```

## Scripts Disponibles

### Backend

```bash
python main.py ou fastapi dev         # Démarrer serveur FastAPI (port 8000)
python -m pytest        # Tests unitaires (si configurés)
```

### Frontend

```bash
npm run dev            # Mode développement avec HMR (port 5174)
npm run build          # Build de production (dist/)
npm run preview        # Preview du build
npm run lint           # ESLint + TypeScript check
```

## Dépannage

### ❌ Le backend ne démarre pas

**Erreur : Module non trouvé**

```bash
# Vérifier l'environnement virtuel
which python  # Doit pointer vers .venv/bin/python
pip list      # Vérifier les packages installés
```

**Erreur : GROQ_API_KEY manquante**

```bash
# Vérifier le fichier .env
cat .env
# Doit contenir : GROQ_API_KEY=gsk_...
```

### ❌ Le frontend ne s'affiche pas

**Page blanche**

- Ouvrir la console navigateur (F12)
- Vérifier les erreurs TypeScript/React
- S'assurer que le backend est lancé (http://localhost:8000)

**WebSocket déconnecté**

- Vérifier que le backend est accessible
- Regarder les logs backend pour erreurs CORS
- Effacer localStorage et recharger : `localStorage.clear()`

**Images de profil non affichées**

```bash
# Vérifier que le dossier uploads existe
ls -la backend/uploads/
# Vérifier les permissions
chmod 755 backend/uploads/
```

### ❌ L'IA ne répond pas

**Erreur 422 (Unprocessable Entity)**

- Vérifier que les paramètres envoyés correspondent aux modèles Pydantic
- Regarder les logs backend pour détails

**Réponse générique/vide**

- Quota Groq dépassé → Attendre reset quotidien
- Clé API invalide → Régénérer sur groq.com
- Modèle décommissionné → Vérifier llama-3.3-70b-versatile disponible

## 📄 Licence

MIT License - Libre d'utilisation pour projets personnels et commerciaux.

## 👨‍💻 Auteur

**MOhamadi OUEDRAOGO**

- 🎓 Test technique - Messagerie temps réel
- 📧 Contact : ouedraogomohamadi223@gmail.com
- 🔗 GitHub : https://github.com/mohamadibf

Développé avec ❤️ en utilisant FastAPI et React

## 🙏 Remerciements

- **FastAPI** - Framework backend moderne
- **React & Vite** - Outils frontend performants
- **shadcn/ui** - Composants UI magnifiques
- **Groq** - API IA ultra-rapide
- **Tailwind CSS** - Styling intuitif

---

⭐ **Star ce projet** si vous l'avez trouvé utile !

**Note** : Cette application est un projet de démonstration. Pour une utilisation en production, considérez l'ajout de :

- Authentification et autorisation
- Rate limiting
- Logs structurés
- Monitoring et métriques
- Tests unitaires et d'intégration
- CI/CD pipeline
