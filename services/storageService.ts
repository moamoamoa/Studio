import { ChatRoom, Message, Memo, UserRole } from '../types';

const ROOMS_KEY = 'ai_automation_rooms';

export const getRooms = (): ChatRoom[] => {
  try {
    const stored = localStorage.getItem(ROOMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse rooms from localStorage", error);
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
  // Filter out the room with the matching ID.
  // Using String() ensures we compare correctly regardless of type (though IDs should be strings).
  const updatedRooms = rooms.filter((r) => String(r.id) !== String(roomId));
  
  localStorage.setItem(ROOMS_KEY, JSON.stringify(updatedRooms));
  notifyChanges();
};

export const createRoom = (title: string, password?: string): ChatRoom => {
  const now = new Date();
  const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  // 1. 고유 ID 생성 (UUID 사용, 실패 시 폴백)
  let uniqueId;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    uniqueId = crypto.randomUUID();
  } else {
    uniqueId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  const newRoom: ChatRoom = {
    id: uniqueId,
    title,
    password,
    messages: [
      {
        id: Math.random().toString(36), // Message IDs are less critical but updated implicitly
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