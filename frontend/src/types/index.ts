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
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface AuthResponse {
  id: number;
  username: string;
  email: string;
  profile_photo?: string;
  last_seen?: string;
}
