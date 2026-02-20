import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Download, ClipboardList, Trash2, Bot, User as UserIcon, Plus, Smile, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatRoom, UserSession, UserRole, Message, Memo } from '../types';
import { addMemo, addMessage, deleteMemo, setTypingStatus } from '../services/storageService';
import { COLORS, AVATARS, generateId } from '../constants';
import { Button } from './Button';

interface ChatInterfaceProps {
  room: ChatRoom;
  session: UserSession;
  onExit: () => void;
  onUpdateRoom: () => void;
}

// Sub-component for individual Memo items to handle expanded state
const MemoItem: React.FC<{ memo: Memo; isAdmin: boolean; onDelete: (id: string) => void }> = ({ memo, isAdmin, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle backward compatibility for old memos that only had 'text'
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
            {/* Content preview removed to keep it clean when collapsed */}
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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ room, session, onExit, onUpdateRoom }) => {
  const [inputText, setInputText] = useState('');
  const [showMemoInput, setShowMemoInput] = useState(false);
  
  // New state for Title and Content
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  
  const [isMobilePlansOpen, setIsMobilePlansOpen] = useState(false);
  
  // Local typing state for instant feedback
  const [isMeTyping, setIsMeTyping] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const { scrollHeight, clientHeight, scrollTop } = container;
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = scrollHeight - clientHeight - scrollTop < 100;
    const isFirstLoad = lastMessageCountRef.current === 0;
    const hasNewMessages = room.messages.length > lastMessageCountRef.current;

    if (isFirstLoad || (hasNewMessages && isNearBottom)) {
      // Use auto (instant) scroll for message updates to prevent jitter/layout shifts on mobile
      scrollToBottom('auto');
    }

    lastMessageCountRef.current = room.messages.length;
  }, [room.messages]);

  // Scroll when typing status changes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const { scrollHeight, clientHeight, scrollTop } = container;
    const isNearBottom = scrollHeight - clientHeight - scrollTop < 150;
    
    if (isNearBottom) {
      scrollToBottom('smooth');
    }
  }, [room.typing, isMeTyping]);

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(room.id, session.username, false);
      setIsMeTyping(false);
    };
  }, [room.id, session.username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    // Update typing status
    if (value.trim()) {
      setIsMeTyping(true);
      setTypingStatus(room.id, session.username, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(room.id, session.username, false);
        setIsMeTyping(false);
      }, 3000);
    } else {
      setIsMeTyping(false);
      setTypingStatus(room.id, session.username, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Clear typing status immediately on send
    setIsMeTyping(false);
    setTypingStatus(room.id, session.username, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

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
    // Updated layout: flex-col for mobile, flex-row for desktop to put Plans on the right
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-100 overflow-hidden fixed inset-0 w-full touch-none">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0 overflow-hidden">
        {/* Header */}
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
            {/* Mobile Plans Toggle */}
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

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${COLORS.chatBg} overscroll-y-contain touch-auto`}
        >
          {room.messages.map((msg, index) => {
            const isMe = msg.senderName === session.username;
            const isSystem = msg.type === 'system';

            // Check if message is a special date change command from Admin
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

            // Time display logic
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
                  {/* Avatar */}
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
                  
                  {/* Bubble */}
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

          {/* Typing Indicator */}
          {/* Show others typing from room state */}
          {room.typing && Object.entries(room.typing)
            .filter(([user, isTyping]) => isTyping && user !== session.username.replace(/[.#$[\]]/g, '_'))
            .map(([user]) => (
              <div key={`typing-${user}`} className="flex justify-start animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                      <Bot size={16} className="text-slate-400" />
                    </div>
                  </div>
                  <div className={`${COLORS.otherBubble} px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center`}>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {/* Show my typing from local state for instant feedback */}
          {isMeTyping && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] flex-row-reverse">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                    <Bot size={16} className="text-indigo-500" />
                  </div>
                </div>
                <div className={`${COLORS.myBubble} px-3 py-2.5 rounded-2xl rounded-tr-none shadow-sm flex items-center`}>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-3 sm:p-4 border-t border-slate-200 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
           <div className="flex gap-2">
             <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSendMessage();
                  }
                }}
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

      {/* Mobile Backdrop */}
      {isMobilePlansOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobilePlansOpen(false)}
        />
      )}

      {/* Side Panel (Plans) - Responsive Drawer */}
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
            {/* Close button for mobile */}
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
