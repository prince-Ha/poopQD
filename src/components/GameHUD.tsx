import React from 'react';
import { Volume2, VolumeX, Pause, Play, Heart, Flame, Home } from 'lucide-react';
import { QuizQuestion } from '../types/game';

interface GameHUDProps {
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  timeLeft: number;
  currentQuestion: QuizQuestion | null;
  questionNumber: number;
  totalAnswered: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onGoHome: () => void;
  showHealAlert: boolean;
  stageAlert?: string | null;
  isTestPlay?: boolean;
  feverGauge: number;
  feverMax: number;
  /** 피버 남은 시간(초). 0이면 피버 아님 */
  feverRemaining: number;
  feverDuration: number;
  /** 선생님 테스트 플레이에서만 보이는 🔥 버튼 */
  onTestFever: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hp,
  maxHp,
  score,
  combo,
  timeLeft,
  currentQuestion,
  totalAnswered,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onGoHome,
  showHealAlert: _showHealAlert,
  stageAlert,
  isTestPlay = false,
  feverGauge,
  feverMax,
  feverRemaining,
  feverDuration,
  onTestFever,
}) => {
  const isFever = feverRemaining > 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isTimeLow = timeLeft <= 30;

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none flex flex-col items-center p-2">
      {/* Hand-Drawn Mobile Status Bar */}
      <div className="w-full flex items-center justify-between gap-1.5 bg-white/95 border-2 border-zinc-900 rounded-2xl px-2.5 py-1.5 shadow-[2px_2px_0px_#18181b] pointer-events-auto">
        {/* Left: HP Hearts & Combo */}
        <div className="flex items-center gap-1.5">
          {/* Hearts */}
          <div className="flex items-center gap-0.5 bg-zinc-50 px-1.5 py-1 rounded-xl border border-zinc-800">
            {Array.from({ length: maxHp }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all duration-150 ${
                  i < hp
                    ? 'text-red-500 fill-red-500 scale-100'
                    : 'text-zinc-300 fill-zinc-200 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Combo Badge */}
          {combo > 1 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 border border-zinc-900 rounded-lg text-zinc-900 font-doodle font-bold text-xs shadow-[1px_1px_0px_#18181b]">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>{combo}연속</span>
            </div>
          )}
        </div>

        {/* Center: Timer */}
        <div className="flex items-center">
          <div
            className={`font-doodle text-xs px-2 py-0.5 rounded-lg border-2 border-zinc-900 tracking-wider shadow-[1.5px_1.5px_0px_#18181b] font-bold ${
              isTimeLow
                ? 'bg-red-100 text-red-600 animate-bounce'
                : 'bg-zinc-100 text-zinc-900'
            }`}
          >
            {isTestPlay ? '🧪' : '⏱'} {timeFormatted}
          </div>
        </div>

        {/* Right: Score & Audio / Pause / Home controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold text-zinc-400 uppercase">점수</span>
            <span className="font-doodle text-zinc-950 text-sm font-bold">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-300 pl-1.5">
            {isTestPlay && (
              <button
                onClick={onTestFever}
                disabled={isFever}
                className="p-1 rounded-lg bg-orange-100 border border-zinc-800 text-xs leading-none active:scale-95 transition-all shadow-[1px_1px_0px_#18181b] disabled:opacity-40"
                title="피버타임 바로 켜기 (선생님 테스트)"
                aria-label="피버타임 테스트"
              >
                🔥
              </button>
            )}
            <button
              onClick={onToggleMute}
              className="p-1 rounded-lg bg-zinc-100 border border-zinc-800 text-zinc-800 hover:bg-zinc-200 active:scale-95 transition-all shadow-[1px_1px_0px_#18181b]"
              title={isMuted ? '소리 켜기' : '소리 끄기'}
              aria-label="음소거 토글"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
            <button
              onClick={onTogglePause}
              className="p-1 rounded-lg bg-zinc-100 border border-zinc-800 text-zinc-800 hover:bg-zinc-200 active:scale-95 transition-all shadow-[1px_1px_0px_#18181b]"
              title={isPaused ? '계속하기' : '일시정지'}
              aria-label="일시정지"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-amber-600" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onGoHome}
              className="p-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 border border-zinc-800 text-zinc-900 active:scale-95 transition-all shadow-[1px_1px_0px_#18181b]"
              title="게임 중단 후 홈으로 가기"
              aria-label="홈으로 가기"
            >
              <Home className="w-3.5 h-3.5 text-blue-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Banner - Hand-Drawn Notebook Card */}
      {currentQuestion && (
        <div className="mt-1.5 w-full">
          <div className="relative bg-white border-2 border-zinc-900 rounded-2xl p-2.5 shadow-[3px_3px_0px_#18181b] flex flex-col items-center text-center">
            {/* Question Label */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="bg-yellow-200 text-zinc-900 border border-zinc-800 text-[11px] px-2 py-0.2 rounded-full font-doodle font-bold shadow-[1px_1px_0px_#18181b]">
                문제 {totalAnswered + 1}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-zinc-950 font-doodle text-lg sm:text-xl font-bold tracking-tight leading-snug break-keep">
              {currentQuestion.question}
            </h2>
          </div>
        </div>
      )}

      {/* Fever gauge: 연속 정답으로 차오르고, 꽉 차면 피버타임 동안 줄어듦 */}
      <div className="mt-1.5 w-full flex justify-center">
        {isFever ? (
          <div className="relative w-full max-w-[280px] h-7 rounded-full border-2 border-zinc-900 bg-orange-100 overflow-hidden shadow-[2px_2px_0px_#18181b] animate-pulse">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500"
              style={{ width: `${(feverRemaining / feverDuration) * 100}%` }}
            />
            <span className="relative z-10 flex h-full items-center justify-center font-doodle font-bold text-sm text-zinc-950">
              🔥 피버타임! 똥 무적 🔥
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-800 bg-white/90 shadow-[1px_1px_0px_#18181b]">
            <span className="font-doodle font-bold text-[11px] text-zinc-700">피버</span>
            {Array.from({ length: feverMax }).map((_, i) => (
              <span
                key={i}
                className={`text-sm leading-none transition-all duration-150 ${
                  i < feverGauge ? 'opacity-100 scale-110' : 'opacity-25 grayscale'
                }`}
              >
                🔥
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stage Alert Notification (1분 단위 똥 증가 알림) */}
      {stageAlert && (
        <div className="mt-1.5 animate-bounce">
          <div className="bg-red-500 text-white font-doodle font-bold text-xs px-3 py-1 rounded-full border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b]">
            {stageAlert}
          </div>
        </div>
      )}
    </div>
  );
};
