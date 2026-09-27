import React, { useState } from 'react';
import { CharacterSkin } from '../types/game';
import { Play, QrCode, Trophy, Clock, AlertCircle, Edit3, User } from 'lucide-react';
import giyeongNormalSrc from '../assets/giyeong_normal.jpg';
import pikaNormalSrc from '../assets/pika_normal.jpg';
import ganadiNormalSrc from '../assets/ganadi_normal.jpg';
import saitamaNormalSrc from '../assets/saitama_normal.jpg';
import charNormalSrc from '../assets/char_normal.jpg';

interface StartScreenProps {
  nickname: string;
  onChangeNickname: (name: string) => void;
  characterSkin: CharacterSkin;
  onChangeSkin: (skin: CharacterSkin) => void;
  timeLimit: number;
  onChangeTimeLimit: (seconds: number) => void;
  onStartGame: () => void;
  onOpenQR: () => void;
  onOpenLeaderboard: () => void;
  onOpenQuestionEditor: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  nickname,
  onChangeNickname,
  characterSkin,
  onChangeSkin,
  timeLimit,
  onChangeTimeLimit,
  onStartGame,
  onOpenQR,
  onOpenLeaderboard,
  onOpenQuestionEditor,
}) => {
  const [errorShake, setErrorShake] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }
    onStartGame();
  };

  const characterList: { id: CharacterSkin; name: string; img: string }[] = [
    { id: 'giyeong', name: '기영이', img: giyeongNormalSrc },
    { id: 'pikachu', name: '피카츄', img: pikaNormalSrc },
    { id: 'ganadi', name: '가나디', img: ganadiNormalSrc },
    { id: 'saitama', name: '원펀맨', img: saitamaNormalSrc },
    { id: 'bakugo', name: '바쿠고', img: charNormalSrc },
  ];

  return (
    <div className="relative w-full h-full min-h-[100dvh] flex flex-col items-center justify-between p-3 sm:p-4 text-zinc-900 select-none bg-white">
      {/* Top action row: QR Code, Question Editor, Leaderboard */}
      <div className="w-full max-w-sm flex items-center justify-between gap-1.5 pt-1 z-10">
        <button
          onClick={onOpenQR}
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs text-zinc-900 font-doodle font-bold transition-all shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
          title="학생들에게 보여줄 접속용 QR 코드 띄우기"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>수업용 QR</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenQuestionEditor}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs text-zinc-900 font-doodle font-bold transition-all shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
            title="선생님 문제 편집 (질문/정답/오답 변경)"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>문제 편집</span>
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-50 border-2 border-zinc-900 rounded-xl text-xs text-zinc-900 font-doodle font-bold transition-all shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
            title="학급 랭킹 및 기록"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>랭킹</span>
          </button>
        </div>
      </div>

      {/* Main Mobile Card */}
      <div className="relative w-full max-w-sm bg-white border-3 border-zinc-900 rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_#18181b] z-10 flex flex-col my-auto">
        {/* Animated Poop Row */}
        <div className="flex justify-around text-lg text-zinc-800 opacity-90 mb-1 select-none">
          <span className="animate-pulse">💩</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>💩</span>
          <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>💩</span>
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>💩</span>
          <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>💩</span>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="font-pen text-4xl sm:text-5xl font-bold tracking-widest text-zinc-950 leading-none">
            똥 피 하 기
          </h1>
          <div className="inline-block mt-2 px-3 py-0.5 bg-yellow-100 border border-zinc-800 rounded-full text-xs font-doodle font-bold text-zinc-900 shadow-[1px_1px_0px_#18181b]">
            생식과 유전(용어 연습)
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleStart} className="space-y-3">
          {/* 1. Name Input */}
          <div>
            <label className="block text-xs font-doodle font-bold text-zinc-900 mb-1">
              👤 이름을 입력하세요 <span className="text-red-500">*</span>
            </label>
            <div className={`relative transition-transform ${errorShake ? 'animate-bounce' : ''}`}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={20}
                className="w-full bg-white border-2 border-zinc-900 rounded-xl px-3.5 py-2 text-zinc-950 font-doodle text-base placeholder-zinc-400 outline-none shadow-[2px_2px_0px_#18181b] focus:bg-yellow-50/60 transition-all"
                autoComplete="off"
                autoFocus
              />
              {nickname.trim().length > 0 && (
                <span className="absolute right-3 top-2.5 text-emerald-600 font-doodle font-bold text-xs">
                  ✓
                </span>
              )}
            </div>
            {errorShake && (
              <p className="text-red-600 text-[11px] mt-1 flex items-center gap-1 font-doodle font-bold">
                <AlertCircle className="w-3 h-3" />
                이름을 입력해야 게임을 시작할 수 있습니다.
              </p>
            )}
          </div>

          {/* 2. Character Selection (5종 캐릭터 직접 선택!) */}
          <div>
            <label className="block text-xs font-doodle font-bold text-zinc-900 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-800" />
                <span>캐릭터 선택 (대두 쫄라맨 5종)</span>
              </span>
            </label>

            <div className="grid grid-cols-5 gap-1.5">
              {characterList.map((char) => {
                const isSelected = characterSkin === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onChangeSkin(char.id)}
                    className={`p-1 rounded-2xl flex flex-col items-center justify-center border-2 border-zinc-900 transition-all ${
                      isSelected
                        ? 'bg-yellow-300 shadow-[2px_2px_0px_#18181b] scale-105 z-10'
                        : 'bg-zinc-50 hover:bg-zinc-100 shadow-[1px_1px_0px_#18181b]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-zinc-900 overflow-hidden shadow-sm flex items-center justify-center mb-0.5">
                      <img
                        src={char.img}
                        alt={char.name}
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                    <span className="font-doodle font-bold text-[11px] text-zinc-950 truncate max-w-full">
                      {char.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Duration Selector (5 min or 20 sec) */}
          <div>
            <label className="block text-xs font-doodle font-bold text-zinc-900 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>플레이 시간</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { sec: 300, label: '5분', desc: '정규 수업용 (분마다 똥 증가)' },
                { sec: 20, label: '20초', desc: '빠른 테스트' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => onChangeTimeLimit(opt.sec)}
                  className={`py-1.5 px-2 rounded-xl text-center border-2 border-zinc-900 transition-all ${
                    timeLimit === opt.sec
                      ? 'bg-zinc-900 text-white font-bold shadow-[2px_2px_0px_#18181b] translate-x-[1px] translate-y-[1px]'
                      : 'bg-white text-zinc-700 shadow-[1.5px_1.5px_0px_#18181b] hover:bg-zinc-50'
                  }`}
                >
                  <div className="font-doodle font-bold text-sm">{opt.label}</div>
                  <div className="text-[9px] opacity-80 font-doodle">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Big Start Button */}
          <button
            type="submit"
            disabled={!nickname.trim()}
            className={`w-full py-3 rounded-2xl font-doodle font-bold text-xl flex items-center justify-center gap-1.5 border-3 border-zinc-900 transition-all ${
              nickname.trim()
                ? 'bg-yellow-300 hover:bg-yellow-400 text-zinc-950 cursor-pointer shadow-[3px_3px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#18181b]'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border-zinc-400 shadow-none'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>게임 시작하기!</span>
          </button>
        </form>
      </div>

      {/* Bottom bar with author signature watermark */}
      <div className="w-full max-w-sm flex items-center justify-end pb-1 pr-1">
        <span className="text-xs text-zinc-500 font-doodle font-bold">by.수인쌤ㅋ</span>
      </div>
    </div>
  );
};
