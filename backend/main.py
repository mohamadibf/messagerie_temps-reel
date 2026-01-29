from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    status,
    UploadFile,
    File,
    Depends,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime, timedelta
import asyncio
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from db import db
from models import (
    UserCreate,
    UserUpdate,
    UserLogin,
    UserResponse,
    MessageCreate,
    MessageResponse,
)
from api import ai_router
from services.auth import create_access_token, decode_access_token

app = FastAPI(title="Chat API", version="2.0.0")

# Configuration CORS - DOIT être ajouté tôt
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Créer le répertoire uploads s'il n'existe pas
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


# === MODÈLES ===


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# === AUTHENTICATION DEPENDENCY ===


async def get_current_user(Authorization: Optional[str] = Header(None)) -> dict:
    """Dependency pour vérifier le token JWT"""

    if not Authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        scheme, token = Authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Schéma d'authentification invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Format de token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = db.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_data


# Inclure les routeurs
app.include_router(ai_router)

# Servir les fichiers uploadés
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# Gestionnaire de connexions pour WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # user_id -> websocket

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

        # Update last seen
        db.update_last_seen(user_id)

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: Dict, user_id: int):
        """Send message to a specific user"""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                pass

    async def broadcast(self, message: Dict, exclude_user_id: Optional[int] = None):
        """Broadcast message to all connected users"""
        for user_id, connection in self.active_connections.items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


# Routes
@app.get("/")
async def root():
    return {"message": "Chat API is running", "version": "2.0.0"}


# === UPLOAD ENDPOINT ===


@app.post("/upload/profile-photo")
async def upload_profile_photo(file: UploadFile = File(...)):
    """Upload a profile photo"""
    # Vérifier le type de fichier
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être une image",
        )

    # Générer un nom de fichier unique
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / unique_filename

    # Sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Retourner l'URL du fichier
    return {"filename": f"/uploads/{unique_filename}"}


# === ENDPOINTS AUTHENTIFICATION ===


@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    """Inscrire un nouvel utilisateur"""
    user_id = db.create_user(
        username=user.username,
        email=user.email,
        password=user.password,
        profile_photo=user.profile_photo,
    )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )

    user_data = db.get_user_by_id(user_id)

    # Créer le token JWT
    access_token = create_access_token(data={"sub": str(user_data["id"])})

    return Token(
        access_token=access_token, token_type="bearer", user=UserResponse(**user_data)
    )


@app.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Connecter l'utilisateur"""
    user_data = db.authenticate_user(credentials.email, credentials.password)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Créer le token JWT
    access_token = create_access_token(data={"sub": str(user_data["id"])})

    return Token(
        access_token=access_token, token_type="bearer", user=UserResponse(**user_data)
    )


@app.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    """Obtenir tous les utilisateurs"""
    users = db.get_all_users()
    return [UserResponse(**user) for user in users]


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Obtenir l'utilisateur par ID"""
    user_data = db.get_user_by_id(user_id)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserResponse(**user_data)


@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Mettre à jour le profil utilisateur"""
    # Vérifier que l'utilisateur ne peut modifier que son propre profil
    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que votre propre profil",
        )

    user_data = db.get_user_by_id(user_id)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Mettre à jour les champs fournis
    if user_update.username:
        user_data["username"] = user_update.username
    if user_update.email:
        user_data["email"] = user_update.email
    if user_update.profile_photo is not None:
        user_data["profile_photo"] = user_update.profile_photo

    # Sauvegarder dans la base de données
    db.update_user(user_id, user_data)

    return UserResponse(**user_data)


# === ENDPOINT WEBSOCKET ===


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: str = None):
    # Accepter la connexion d'abord (obligatoire pour WebSocket)
    await websocket.accept()

    # Vérifier le token JWT
    if not token:
        await websocket.close(code=1008, reason="Token manquant")
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008, reason="Token invalide")
        return

    # Convertir le user_id du token en int pour comparaison
    token_user_id_str = payload.get("sub")
    if not token_user_id_str:
        await websocket.close(code=1008, reason="Token sans user_id")
        return

    try:
        token_user_id = int(token_user_id_str)
    except (ValueError, TypeError):
        await websocket.close(code=1008, reason="User_id invalide dans token")
        return

    if token_user_id != user_id:
        await websocket.close(code=1008, reason="User_id ne correspond pas")
        return

    # Connexion validée, ajouter à la liste des connexions
    # Pas besoin d'appeler manager.connect() car on a déjà accept()
    manager.active_connections[user_id] = websocket
    db.update_last_seen(user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            receiver_id = message_data.get("receiver_id")
            content = message_data.get("content", "")

            # Enregistrer le message en base de données
            message_id = db.save_message(content, user_id, receiver_id)

            # Obtenir les infos de l'expéditeur
            sender = db.get_user_by_id(user_id)

            # Créer l'objet message
            message = {
                "id": message_id,
                "content": content,
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "timestamp": datetime.now().isoformat(),
                "username": sender["username"],
                "profile_photo": sender.get("profile_photo"),
                "type": "message",
            }

            # Envoyer au destinataire s'il est connecté
            if receiver_id and receiver_id in manager.active_connections:
                await manager.send_personal_message(message, receiver_id)

            # Mettre à jour la dernière connexion de l'expéditeur
            db.update_last_seen(user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id)


@app.get("/messages/{user1_id}/{user2_id}")
async def get_messages(
    user1_id: int, user2_id: int, current_user: dict = Depends(get_current_user)
):
    """Obtenir les messages entre deux utilisateurs"""
    # Vérifier que l'utilisateur ne peut voir que ses propres messages
    if current_user["id"] != user1_id and current_user["id"] != user2_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    messages = db.get_messages_between_users(user1_id, user2_id)
    return {"messages": messages}


@app.get("/messages/unread/{user_id}/{sender_id}")
async def get_unread_count(
    user_id: int, sender_id: int, current_user: dict = Depends(get_current_user)
):
    """Obtenir le nombre de messages non lus"""
    # Vérifier que l'utilisateur ne peut voir que ses propres messages non lus
    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé",
        )

    count = db.get_unread_count(user_id, sender_id)
    return {"count": count}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
