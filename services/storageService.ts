import { ChatRoom, Message, Memo, UserRole } from '../types.ts';

const ROOMS_KEY = 'ai_automation_rooms';

export const getRooms = (): ChatRoom[] => {
  try {
    const stored = localStorage.getItem(ROOMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse rooms from localStorage", error);
    // If parsing fails, return empty array to prevent app crash (white screen)
    return [];
  }
};

const notifyChanges = () => {
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('storage-local'));
};

export const saveRoom = (room: ChatRoom) => {
  const rooms = getRooms();
  const existingIndex = rooms.findIndex((r) => r.id === room.id);
  
  if (existingIndex >= 0) {
    rooms[existingIndex] = room;
  } else {
    rooms.push(room);
  }
  
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  notifyChanges();
};

export const deleteRoom = (roomId: string) => {
  const rooms = getRooms();
  const updatedRooms = rooms.filter((r) => r.id !== roomId);
  localStorage.setItem(ROOMS_KEY, JSON.stringify(updatedRooms));
  notifyChanges();
};

export const createRoom = (title: string, password?: string): ChatRoom => {
  const now = new Date();
  const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  const newRoom: ChatRoom = {
    id: Math.random().toString(36).substr(2, 9),
    title,
    password,
    messages: [
      {
        id: Math.random().toString(36),
        senderName: 'System',
        role: UserRole.ADMIN,
        text: dateText,
        timestamp: Date.now(),
        type: 'system',
      },
    ],
    memos: [],
    createdAt: Date.now(),
    createdBy: 'AI Bot',
  };
  saveRoom(newRoom);
  return newRoom;
};

export const addMessage = (roomId: string, message: Message) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.messages.push(message);
    saveRoom(room);
  }
};

export const addMemo = (roomId: string, memo: Memo) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.memos.push(memo);
    saveRoom(room);
  }
};

export const deleteMemo = (roomId: string, memoId: string) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.memos = room.memos.filter(m => m.id !== memoId);
    saveRoom(room);
  }
};