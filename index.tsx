import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Bot, Users, Plus, LayoutGrid, Search, Shield, Trash2, LogOut, 
  Send, Download, ClipboardList, User as UserIcon, Smile, X, 
  ChevronDown, ChevronUp, Type, Lock, ShieldCheck, User 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
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

// --- CONSTANTS ---
const APP_NAME = "AI Automation";

const COLORS = {
  primary: "bg-indigo-500",
  primaryHover: "hover:bg-indigo-600",
  secondary: "bg-pink-400",
  background: "bg-slate-50",
  chatBg: "bg-[#b2c7d9]", 
  myBubble: "bg-[#ffe01b]", 
  otherBubble: "bg-white",
};

const AVATARS = {
  admin: "https://api.dicebear.com/7.x/bottts/svg?seed=HappyAdminBot&backgroundColor=e0e7ff",
  user: "https://api.dicebear.com/7.x/micah/svg?seed=",
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- SERVICES ---

// Storage Service
const ROOMS_KEY = 'ai_automation_rooms';

const getRooms = (): ChatRoom[] => {
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

const saveRoom = (room: ChatRoom) => {
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

const deleteRoom = (roomId: string) => {
  const rooms = getRooms();
  const updatedRooms = rooms.filter((r) => r.id !== roomId);
  localStorage.setItem(ROOMS_KEY, JSON.stringify(updatedRooms));
  notifyChanges();
};

const createRoom = (title: string, password?: string): ChatRoom => {
  const now = new Date();
  const dateText = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;

  const newRoom: ChatRoom = {
    id: generateId(),
    title,
    password,
    messages: [
      {
        id: generateId(),
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

const addMessage = (roomId: string, message: Message) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.messages.push(message);
    saveRoom(room);
  }
};

const addMemo = (roomId: string, memo: Memo) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.memos.push(memo);
    saveRoom(room);
  }
};

const deleteMemo = (roomId: string, memoId: string) => {
  const rooms = getRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.memos = room.memos.filter(m => m.id !== memoId);
    saveRoom(room);
  }
};

// Gemini Service
const generateAIResponse = async (
  history: Message[],
  context: string
): Promise<string> => {
  try {
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    
    if (!apiKey) {
      console.warn("API Key is missing for Gemini");
      return "System: API Key is missing. Please configure it to use AI features.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const conversation = history.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const prompt = `
      You are a helpful, cute, and professional AI Chatbot named "AI Bot".
      You are managing a chat room called "${context}".
      
      Here is the recent conversation history:
      ${conversation}

      Please provide a helpful, polite, and concise response to the last user message as the administrator of this room.
      Keep the tone friendly and slightly cute (using emojis is okay).
      Do not include "AI Bot:" in your response, just the message content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't think of a response right now. 🤖";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI response.";
  }
};

// --- COMPONENTS ---

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  className = '',
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-600 shadow-md hover:shadow-lg shadow-indigo-200",
    secondary: "bg-pink-400 text-white hover:bg-pink-500 shadow-md hover:shadow-lg shadow-pink-200",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

// Create Room Modal
const CreateRoomModal: React.FC<{ onClose: () => void; onSubmit: (title: string, password?: string) => void }> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title, hasPassword ? password : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-indigo-100 p-2 rounded-xl text-indigo-600">✨</span>
            Create Room
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Room Name</label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Automation Tasks"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="hasPassword"
              checked={hasPassword}
              onChange={(e) => setHasPassword(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="hasPassword" className="text-sm text-slate-600 select-none">Set Password (Private)</label>
          </div>

          {hasPassword && (
            <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Password</label>
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secret code..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || (hasPassword && !password)}>
              Create Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Join Room Modal
const JoinRoomModal: React.FC<{ room: ChatRoom; onClose: () => void; onJoin: (nickname: string, password?: string) => void }> = ({ room, onClose, onJoin }) => {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    
    if (room.password && room.password !== password) {
      setError('Incorrect password');
      return;
    }

    onJoin(nickname, password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-pink-100 p-2 rounded-xl text-pink-500">👋</span>
            Join Room
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <h3 className="font-bold text-slate-700">{room.title}</h3>
            {room.password && <span className="text-xs text-amber-500 font-medium flex items-center justify-center gap-1 mt-1"><Lock size={12}/> Private Room</span>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {room.password && (
            <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1 ml-1">Room Password</label>
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all focus:bg-white ${
                    error 
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                      : 'border-slate-200 focus:border-pink-500 focus:ring-pink-200'
                  }`}
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="secondary" type="submit" disabled={!nickname.trim() || (!!room.password && !password)}>
              Join Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Login Modal
const AdminLoginModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '331133') {
      onSuccess();
      onClose();
    } else {
      setError('Incorrect admin password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={24} />
            Admin Access
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter Admin PIN"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center tracking-widest font-bold"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          </div>

          <Button type="submit" className="w-full">
            Unlock Admin Mode
          </Button>
        </form>
      </div>
    </div>
  );
};

// Memo Item
const MemoItem: React.FC<{ memo: Memo; isAdmin: boolean; onDelete: (id: string) => void }> = ({ memo, isAdmin, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayTitle = memo.title || "Untitled Plan";
  const displayContent = memo.content || (memo as any).text || "";

  return (
    <div className="bg-[#fff9c4] rounded-lg shadow-sm transition-all duration-200 overflow-hidden group border border-yellow-200/50">
       <div 
         className="p-4 flex justify-between items-center cursor-pointer hover:bg-yellow-100/50 transition-colors" 
         onClick={() => setIsOpen(!isOpen)}
       >
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-slate-800 text-sm font-handwriting truncate">
              {displayTitle}
            </h4>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
             {isAdmin && (
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(memo.id);
                }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all mr-1"
                title="Delete Plan"
               >
                 <Trash2 size={14} />
               </button>
             )}
             <button className="text-slate-400 hover:text-slate-600 transition-colors">
               {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
             </button>
          </div>
       </div>
       
       {isOpen && (
         <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
           <div className="pt-3 border-t border-yellow-200/60">
             <p className="text-slate-800 text-sm font-handwriting break-words whitespace-pre-wrap leading-relaxed">
               {displayContent}
             </p>
             <span className="text-[10px] text-slate-400 mt-3 block text-right font-sans">
               {new Date(memo.createdAt).toLocaleDateString()}
             </span>
           </div>
         </div>
       )}
    </div>
  );
};

// Chat Interface
const ChatInterface: React.FC<{ room: ChatRoom; session: UserSession; onExit: () => void; onUpdateRoom: () => void }> = ({ room, session, onExit, onUpdateRoom }) => {
  const [inputText, setInputText] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [isMobilePlansOpen, setIsMobilePlansOpen] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [room.messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const message: Message = {
      id: generateId(),
      senderName: session.username,
      role: session.role,
      text: inputText,
      timestamp: Date.now(),
      type: 'text',
    };

    addMessage(room.id, message);
    setInputText('');
    onUpdateRoom();
  };

  const handleExportChat = () => {
    const content = room.messages
      .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.senderName}: ${m.text}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.title}_chat_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMemo = () => {
    if (!newMemoTitle.trim() || !newMemoContent.trim()) return;
    
    const memo: Memo = {
      id: generateId(),
      title: newMemoTitle,
      content: newMemoContent,
      createdAt: Date.now(),
    };
    addMemo(room.id, memo);
    setNewMemoTitle('');
    setNewMemoContent('');
    setShowMemoInput(false);
    onUpdateRoom();
  };

  const handleDeleteMemo = (memoId: string) => {
    deleteMemo(room.id, memoId);
    onUpdateRoom();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAdmin = session.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-100 overflow-hidden fixed inset-0 w-full touch-none">
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className={`p-2 rounded-xl flex-shrink-0 ${isAdmin ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                {isAdmin ? <Bot size={24} /> : <UserIcon size={24} />}
             </div>
             <div className="min-w-0">
               <h1 className="font-bold text-slate-800 text-lg leading-tight truncate">{room.title}</h1>
               <p className="text-xs text-slate-500 font-medium truncate">{isAdmin ? 'Admin Mode (AI Bot)' : `Participating as ${session.username}`}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setIsMobilePlansOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
              title="View Plans"
            >
              <ClipboardList size={20} />
            </button>

            {isAdmin && (
              <button 
                onClick={handleExportChat}
                className="hidden sm:block p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors tooltip"
                title="Export Chat"
              >
                <Download size={20} />
              </button>
            )}
            <button 
              onClick={onExit}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Leave Room"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div 
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${COLORS.chatBg} overscroll-y-contain touch-auto`}
        >
          {room.messages.map((msg, index) => {
            const isMe = msg.senderName === session.username;
            const isSystem = msg.type === 'system';
            const dateChangeMatch = msg.text.match(/^<날짜변경:\s*(.+)>$/);
            const isDateChange = msg.role === UserRole.ADMIN && !!dateChangeMatch;

            if (isSystem || isDateChange) {
              const displayText = isDateChange && dateChangeMatch ? dateChangeMatch[1] : msg.text;
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="bg-black/10 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {displayText}
                  </span>
                </div>
              );
            }

            const nextMsg = room.messages[index + 1];
            const currentTime = formatTime(msg.timestamp);
            const nextTime = nextMsg ? formatTime(nextMsg.timestamp) : null;
            
            const isNextDateChange = nextMsg?.role === UserRole.ADMIN && /^<날짜변경:\s*(.+)>$/.test(nextMsg.text);
            const isNextSystemLike = nextMsg?.type === 'system' || isNextDateChange;

            const shouldHideTime = nextMsg && 
                                   !isNextSystemLike && 
                                   nextMsg.senderName === msg.senderName && 
                                   nextTime === currentTime;

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] sm:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0 mt-1">
                    {msg.role === UserRole.ADMIN ? (
                       <img 
                          src={AVATARS.admin} 
                          alt="Admin" 
                          className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 p-1 object-contain"
                        />
                    ) : (
                       <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shadow-sm border border-yellow-200">
                          <Smile className="text-yellow-600" size={24} />
                       </div>
                    )}
                  </div>
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-slate-600 mb-1 ml-1">{msg.senderName}</span>
                    <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm relative break-words ${
                      isMe 
                        ? `${COLORS.myBubble} text-slate-900 rounded-tr-none` 
                        : `${COLORS.otherBubble} text-slate-800 rounded-tl-none`
                    }`}>
                      {msg.text}
                    </div>
                    {!shouldHideTime && (
                      <span className="text-[10px] text-slate-500 mt-1 opacity-70">
                        {currentTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-3 sm:p-4 border-t border-slate-200 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
           <div className="flex gap-2">
             <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 text-slate-800 rounded-2xl px-4 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
             />
             <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className={`p-3 rounded-2xl transition-all shadow-md ${
                  inputText.trim() 
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
             >
               <Send size={20} />
             </button>
           </div>
        </div>
      </div>

      {isMobilePlansOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobilePlansOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 w-80 bg-slate-50 border-l border-slate-200 flex flex-col shadow-2xl z-40
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none md:z-0 md:flex
        ${isMobilePlansOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
         <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-start flex-shrink-0">
            <div>
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <ClipboardList size={20} className="text-amber-400" />
                Plans
              </h2>
              <p className="text-xs text-slate-400 mt-1">Shared plans for this room</p>
            </div>
            <button 
              onClick={() => setIsMobilePlansOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 overscroll-y-contain touch-auto">
            {room.memos.length === 0 && (
              <div className="text-center mt-10 text-slate-400 text-sm">
                <p>No plans yet.</p>
                {isAdmin && <p className="mt-1">Click + to add one.</p>}
              </div>
            )}
            
            {room.memos.map(memo => (
              <MemoItem 
                key={memo.id} 
                memo={memo} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteMemo} 
              />
            ))}
         </div>

         {isAdmin && (
            <div className="p-4 bg-white border-t border-slate-200 safe-area-bottom flex-shrink-0">
               {!showMemoInput ? (
                  <Button 
                    variant="ghost" 
                    className="w-full border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-500"
                    onClick={() => setShowMemoInput(true)}
                  >
                    <Plus size={16} className="mr-2"/> Add Plan
                  </Button>
               ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={newMemoTitle}
                      onChange={(e) => setNewMemoTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none font-bold"
                      autoFocus
                    />
                    <textarea
                      value={newMemoContent}
                      onChange={(e) => setNewMemoContent(e.target.value)}
                      placeholder="Content details..."
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none resize-none h-24"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1" onClick={() => setShowMemoInput(false)}>Cancel</Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-amber-400 hover:bg-amber-500 text-white shadow-amber-200" 
                        onClick={handleAddMemo}
                        disabled={!newMemoTitle.trim() || !newMemoContent.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinModalRoom, setJoinModalRoom] = useState<ChatRoom | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRooms = useCallback(() => {
    const loadedRooms = getRooms();
    setRooms(loadedRooms.sort((a, b) => b.createdAt - a.createdAt));
    if (currentRoom) {
      const updatedCurrent = loadedRooms.find(r => r.id === currentRoom.id);
      if (updatedCurrent) setCurrentRoom(updatedCurrent);
    }
  }, [currentRoom]);

  useEffect(() => {
    loadRooms();
    const handleStorageChange = () => loadRooms();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-local', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-local', handleStorageChange);
    };
  }, [loadRooms]);

  const handleRoomUpdate = () => {
    loadRooms();
  };

  const handleCreateRoom = (title: string, password?: string) => {
    const newRoom = createRoom(title, password);
    setShowCreateModal(false);
    const session: UserSession = {
      username: 'AI Bot',
      role: UserRole.ADMIN,
    };
    setCurrentUser(session);
    setCurrentRoom(newRoom);
  };

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this room completely?")) {
      deleteRoom(roomId);
      setRooms(prev => prev.filter(room => room.id !== roomId));
    }
  };

  const handleJoinRoom = (room: ChatRoom) => {
    if (isAdminMode) {
      setCurrentUser({
        username: 'AI Bot',
        role: UserRole.ADMIN,
      });
      setCurrentRoom(room);
    } else {
      setJoinModalRoom(room);
    }
  };

  const confirmJoin = (nickname: string, password?: string) => {
    if (joinModalRoom) {
      setCurrentUser({
        username: nickname,
        role: UserRole.PARTICIPANT,
      });
      setCurrentRoom(joinModalRoom);
      setJoinModalRoom(null);
    }
  };

  const handleExitRoom = () => {
    setCurrentRoom(null);
    setCurrentUser(null);
  };

  const filteredRooms = rooms.filter(room => 
    room.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentRoom && currentUser) {
    return (
      <ChatInterface 
        room={currentRoom} 
        session={currentUser} 
        onExit={handleExitRoom}
        onUpdateRoom={handleRoomUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 overflow-hidden p-0.5">
               <img src={AVATARS.admin} alt="AI Logo" className="w-full h-full object-contain p-1 rounded-xl bg-white" />
             </div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-4">
            {!isAdminMode ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdminLogin(true)}
                className="text-slate-500 hover:text-indigo-600"
              >
                <Shield size={18} className="mr-2" />
                Admin Access
              </Button>
            ) : (
              <button 
                onClick={() => setIsAdminMode(false)}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors group"
                title="Click to exit Admin Mode"
              >
                <Shield size={14} className="group-hover:hidden" />
                <LogOut size={14} className="hidden group-hover:block" />
                <span className="text-xs font-bold uppercase tracking-wide group-hover:hidden">Admin Mode</span>
                <span className="text-xs font-bold uppercase tracking-wide hidden group-hover:inline">Exit Admin</span>
              </button>
            )}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            {isAdminMode ? (
              <Button 
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} className="mr-2" />
                New Room
              </Button>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        <div className="mb-8 text-center space-y-4">
           <h2 className="text-3xl font-bold text-slate-800">
             Explore Rooms
           </h2>
           <div className="relative max-w-md mx-auto mt-6 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
             <input 
               type="text"
               placeholder="Search rooms..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all shadow-sm"
             />
           </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <LayoutGrid size={32} />
             </div>
             <h3 className="text-lg font-semibold text-slate-700">No rooms found</h3>
             <p className="text-slate-500 text-sm mt-1">
               {rooms.length === 0 ? (isAdminMode ? "Be the first to create one!" : "No rooms available.") : "Try a different search term."}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <div 
                key={room.id} 
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
                onClick={() => handleJoinRoom(room)}
              >
                {isAdminMode && (
                  <button
                    onClick={(e) => handleDeleteRoom(e, room.id)}
                    className="absolute top-4 right-4 p-2 bg-white hover:bg-red-100 text-slate-300 hover:text-red-500 rounded-full transition-colors z-10 border border-slate-100"
                    title="Delete Room"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    {room.title.charAt(0).toUpperCase()}
                  </div>
                  {room.password && (
                    <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Private
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 mb-1 truncate pr-8">{room.title}</h3>
                <div className="flex items-center text-xs text-slate-400 mb-6">
                   <Users size={14} className="mr-1" />
                   <span>{room.messages.length} messages</span>
                   <span className="mx-2">•</span>
                   <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                      ))}
                   </div>
                   <span className="text-indigo-500 text-sm font-semibold group-hover:translate-x-1 transition-transform flex items-center">
                     {isAdminMode ? "Enter as Admin" : "Join"} <span className="ml-1">→</span>
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)} 
          onSubmit={handleCreateRoom} 
        />
      )}

      {joinModalRoom && (
        <JoinRoomModal 
          room={joinModalRoom}
          onClose={() => setJoinModalRoom(null)}
          onJoin={confirmJoin}
        />
      )}

      {showAdminLogin && (
        <AdminLoginModal 
          onClose={() => setShowAdminLogin(false)}
          onSuccess={() => setIsAdminMode(true)}
        />
      )}
    </div>
  );
};

// --- MOUNT ---
console.log("Starting App mount sequence...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  const msg = "Could not find root element to mount to";
  console.error(msg);
  throw new Error(msg);
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully");
} catch (error) {
  console.error("Error mounting app:", error);
  throw error;
}
