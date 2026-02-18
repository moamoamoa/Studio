export enum UserRole {
  ADMIN = 'ADMIN',
  PARTICIPANT = 'PARTICIPANT',
}

export interface Message {
  id: string;
  senderName: string;
  role: UserRole;
  text: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface ChatRoom {
  id: string;
  title: string;
  password?: string;
  messages: Message[];
  memos: Memo[];
  createdAt: number;
  createdBy: string;
}

export interface UserSession {
  username: string;
  role: UserRole;
}

// Gemini Types
export interface AISuggestion {
  text: string;
}