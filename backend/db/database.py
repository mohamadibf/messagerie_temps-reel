import sqlite3
from datetime import datetime
from typing import Optional, List, Dict
import os
from services.auth import get_password_hash, verify_password


class Database:
    def __init__(self, db_name: str = "chat.db"):
        # S'assurer que la base de données est créée dans le dossier backend
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_name = os.path.join(backend_dir, db_name)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """Initialiser la base de données avec les tables requises"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Table utilisateurs
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                profile_photo TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )

        # Table messages
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT 0,
                FOREIGN KEY (sender_id) REFERENCES users(id),
                FOREIGN KEY (receiver_id) REFERENCES users(id)
            )
        """
        )

        # Table conversations (pour tracker les conversations entre utilisateurs)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user1_id INTEGER NOT NULL,
                user2_id INTEGER NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users(id),
                FOREIGN KEY (user2_id) REFERENCES users(id),
                UNIQUE(user1_id, user2_id)
            )
        """
        )

        conn.commit()
        conn.close()

    # === OPÉRATIONS UTILISATEUR ===

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        profile_photo: Optional[str] = None,
    ) -> Optional[int]:
        """Créer un nouvel utilisateur"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            password_hash = get_password_hash(password)

            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, profile_photo)
                VALUES (?, ?, ?, ?)
            """,
                (username, email, password_hash, profile_photo),
            )

            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            return None

    def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authentifier l'utilisateur et retourner les données utilisateur"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, username, email, password_hash, profile_photo, created_at, last_seen
            FROM users
            WHERE email = ?
        """,
            (email,),
        )

        row = cursor.fetchone()
        conn.close()

        if row:
            user_dict = dict(row)
            # Vérifier le mot de passe avec bcrypt
            if verify_password(password, user_dict["password_hash"]):
                # Supprimer le hash du résultat
                del user_dict["password_hash"]
                return user_dict
        return None

    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Obtenir l'utilisateur par ID"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id, username, email, profile_photo, created_at, last_seen
            FROM users
            WHERE id = ?
        """,
            (user_id,),
        )

        row = cursor.fetchone()
        conn.close()

        if row:
            return dict(row)
        return None

    def get_all_users(self, exclude_user_id: Optional[int] = None) -> List[Dict]:
        """Obtenir tous les utilisateurs (sauf celui spécifié)"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if exclude_user_id:
            cursor.execute(
                """
                SELECT id, username, email, profile_photo, last_seen
                FROM users
                WHERE id != ?
                ORDER BY username
            """,
                (exclude_user_id,),
            )
        else:
            cursor.execute(
                """
                SELECT id, username, email, profile_photo, last_seen
                FROM users
                ORDER BY username
            """
            )

        rows = cursor.fetchall()
        conn.close()

        return [dict(row) for row in rows]

    def update_last_seen(self, user_id: int):
        """Mettre à jour le timestamp de dernière connexion de l'utilisateur"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?",
            (user_id,),
        )

        conn.commit()
        conn.close()

    def update_user(self, user_id: int, user_data: Dict):
        """Mettre à jour les informations de l'utilisateur"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users 
            SET username = ?, email = ?, profile_photo = ?
            WHERE id = ?
        """,
            (
                user_data["username"],
                user_data["email"],
                user_data.get("profile_photo"),
                user_id,
            ),
        )

        conn.commit()
        conn.close()

    # === OPÉRATIONS MESSAGES ===

    def save_message(
        self, content: str, sender_id: int, receiver_id: Optional[int] = None
    ) -> int:
        """Enregistrer un message en base de données"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO messages (content, sender_id, receiver_id)
            VALUES (?, ?, ?)
        """,
            (content, sender_id, receiver_id),
        )

        message_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return message_id

    def get_messages_between_users(
        self, user1_id: int, user2_id: int, limit: int = 100
    ) -> List[Dict]:
        """Obtenir les messages entre deux utilisateurs"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT m.*, u.username, u.profile_photo
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.timestamp DESC
            LIMIT ?
        """,
            (user1_id, user2_id, user2_id, user1_id, limit),
        )

        rows = cursor.fetchall()
        conn.close()

        messages = [dict(row) for row in rows]
        messages.reverse()  # Plus ancien en premier
        return messages

    def mark_messages_as_read(self, user_id: int, sender_id: int):
        """Marquer tous les messages de l'expéditeur vers l'utilisateur comme lus"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE messages
            SET is_read = 1
            WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
        """,
            (user_id, sender_id),
        )

        conn.commit()
        conn.close()

    def get_unread_count(self, user_id: int, sender_id: int) -> int:
        """Obtenir le nombre de messages non lus d'un expéditeur spécifique"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT COUNT(*) as count
            FROM messages
            WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
        """,
            (user_id, sender_id),
        )

        row = cursor.fetchone()
        conn.close()

        return row["count"] if row else 0


# Instance globale
db = Database()
