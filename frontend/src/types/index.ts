export interface User {
  id: number;
  username: string;
  email: string;
  profile_photo?: string;
  last_seen?: string;
}

export interface Message {
  id: string | number;
  content: string;
  sender_id: number;
  receiver_id?: number;
  timestamp: string;
  username?: string;
  profile_photo?: string;
  is_read?: boolean;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  profile_photo?: string;
  last_seen?: string;
}
