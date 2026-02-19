import React, { useState } from 'react';
import { X, Lock, Type } from 'lucide-react';
import { Button } from './Button';

interface CreateRoomModalProps {
  onClose: () => void;
  onSubmit: (title: string, password?: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, onSubmit }) => {
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