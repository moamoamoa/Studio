import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
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
