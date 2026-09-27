import React, { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { TEACHER_PIN } from '../config';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setIsWrong(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === TEACHER_PIN) {
      onUnlock();
    } else {
      setIsWrong(true);
      setPin('');
      window.setTimeout(() => setIsWrong(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className={`relative w-full max-w-xs bg-white border-3 border-zinc-900 rounded-3xl p-5 shadow-[5px_5px_0px_#18181b] text-center text-zinc-900 ${
          isWrong ? 'animate-bounce' : ''
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b]"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Lock className="w-4 h-4" />
          <h2 className="text-lg font-doodle font-bold">선생님 메뉴</h2>
        </div>
        <p className="text-xs text-zinc-500 font-doodle mb-3">비밀번호 4자리를 입력하세요</p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center tracking-[0.6em] text-2xl font-bold bg-white border-2 border-zinc-900 rounded-xl px-3 py-2 outline-none shadow-[2px_2px_0px_#18181b] focus:bg-yellow-50/60"
          aria-label="선생님 비밀번호"
        />
        {isWrong && <p className="text-red-600 text-xs font-doodle font-bold mt-2">비밀번호가 달라요</p>}

        <button
          type="submit"
          disabled={pin.length !== 4}
          className="mt-3 w-full py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 disabled:bg-zinc-200 disabled:text-zinc-400 border-2 border-zinc-900 font-doodle font-bold shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
        >
          열기
        </button>
      </form>
    </div>
  );
};
