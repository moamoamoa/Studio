import React, { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
import { Button } from './Button';
import { ChatRoom } from '../types';

interface JoinRoomModalProps {
  room: ChatRoom;
  onClose: () => void;
  onJoin: (nickname: string, password?: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ room, onClose, onJoin }) => {
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