import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface DeleteRoomModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteRoomModal: React.FC<DeleteRoomModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-red-100 p-2.5 rounded-2xl text-red-500">
               <AlertTriangle size={24} />
             </div>
             <h2 className="text-xl font-bold text-slate-800">방 삭제</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors -mr-2 -mt-2">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <p className="text-slate-600 text-sm mb-6 leading-relaxed pl-1">
          정말로 이 방을 삭제하시겠습니까? <br/>
          <span className="font-semibold text-red-500 block mt-1">삭제된 대화 내용과 플랜은 복구할 수 없습니다.</span>
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button variant="danger" onClick={onConfirm} className="shadow-red-200">
            삭제하기
          </Button>
        </div>
      </div>
    </div>
  );
};