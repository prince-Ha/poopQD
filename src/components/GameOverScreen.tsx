import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { getStudentStats } from '../utils/storage';
import { RankingList } from './RankingList';

export type SyncStatus = 'none' | 'saving' | 'saved' | 'error';

interface GameOverScreenProps {
  nickname: string;
  finalScore: number;
  correctCount: number;
  maxCombo: number;
  chapterTitle: string;
  isTestPlay: boolean;
  /** null = 아직 불러오는 중 */
  ranking: LeaderboardEntry[] | null;
  rankingSource: 'sheet' | 'local';
  syncStatus: SyncStatus;
  onRetry: () => void;
  onGoHome: () => void;
}

const SYNC_MESSAGE: Record<SyncStatus, { text: string; className: string }> = {
  none: { text: '📱 이 기기에 저장됨 (구글 시트 미연결)', className: 'text-zinc-500' },
  saving: { text: '📤 반 기록에 저장하는 중…', className: 'text-blue-600' },
  saved: { text: '✅ 반 기록(구글 시트)에 저장됨', className: 'text-emerald-700' },
  error: { text: '⚠️ 반 기록 저장을 확인하지 못했어요. 인터넷을 확인해 주세요.', className: 'text-red-600' },
};

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  nickname,
  finalScore,
  correctCount,
  maxCombo,
  chapterTitle,
  isTestPlay,
  ranking,
  rankingSource,
  syncStatus,
  onRetry,
  onGoHome,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ranking'>('summary');

  const studentStats = ranking ? getStudentStats(nickname, ranking) : null;
  const isNewRecord = !isTestPlay && !!studentStats && finalScore > 0 && finalScore >= studentStats.personalBest;
  const sync = SYNC_MESSAGE[syncStatus];

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-y-auto bg-white flex flex-col items-center justify-between p-3 sm:p-4 text-zinc-900 select-none">
      <div className="relative w-full max-w-sm bg-white border-3 border-zinc-900 rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_#18181b] z-10 flex flex-col my-auto">
        {/* Header with celebration banner */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-yellow-100 border-2 border-zinc-900 rounded-full text-zinc-900 text-xs font-doodle font-bold mb-1 shadow-[1.5px_1.5px_0px_#18181b]">
            {!isTestPlay && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isTestPlay ? '🧪 선생님 테스트 플레이' : '수업 활동 완료!'}</span>
          </div>
          <h2 className="text-2xl font-doodle font-bold text-zinc-950">
            {isTestPlay ? (
              '테스트 결과'
            ) : (
              <>
                <span className="text-blue-600">{nickname}</span> 학생 결과
              </>
            )}
          </h2>
          <p className="text-zinc-500 font-doodle text-xs mt-0.5">{chapterTitle}</p>
        </div>

        {/* Tab Navigation (Summary, Ranking) — 테스트 플레이는 랭킹이 없으니 숨김 */}
        <div hidden={isTestPlay} className="flex items-center gap-1 p-1 bg-zinc-100 rounded-2xl mb-3 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b]">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-1 rounded-xl text-xs font-doodle font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-yellow-300 text-zinc-950 border-2 border-zinc-900 shadow-[1px_1px_0px_#18181b]'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            내 결과
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-1 rounded-xl text-xs font-doodle font-bold transition-all ${
              activeTab === 'ranking'
                ? 'bg-yellow-300 text-zinc-950 border-2 border-zinc-900 shadow-[1px_1px_0px_#18181b]'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            🏆 TOP 10
          </button>
        </div>

        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            {/* Big Score Card */}
            <div className="relative bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-3.5 text-center shadow-[2px_2px_0px_#18181b]">
              {isNewRecord && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-300 border-2 border-zinc-900 text-zinc-950 font-doodle font-bold text-[11px] px-2.5 py-0.2 rounded-full shadow-[1.5px_1.5px_0px_#18181b] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" /> 최고 기록 갱신!
                </div>
              )}
              <span className="text-[11px] text-zinc-500 font-doodle font-bold uppercase tracking-wider">최종 점수</span>
              <div className="text-4xl font-bold text-zinc-950 font-doodle mt-0.5 tracking-tight">
                {finalScore.toLocaleString()}
                <span className="text-lg font-bold text-zinc-600 ml-1 font-doodle">점</span>
              </div>
              <p className={`text-[11px] font-doodle font-bold mt-1 ${isTestPlay ? 'text-amber-700' : sync.className}`}>
                {isTestPlay ? '테스트 플레이는 기록이 남지 않아요' : sync.text}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                <span className="text-[10px] text-zinc-500 font-doodle block">맞힌 정답</span>
                <span className="text-base font-bold text-emerald-600 font-doodle">{correctCount}개</span>
              </div>
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                <span className="text-[10px] text-zinc-500 font-doodle block">최대 콤보</span>
                <span className="text-base font-bold text-orange-500 font-doodle">{maxCombo}연속</span>
              </div>
              {!isTestPlay && (
                <>
                  <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                    <span className="text-[10px] text-zinc-500 font-doodle block">내 최고점</span>
                    <span className="text-base font-bold text-blue-600 font-doodle">
                      {studentStats ? `${studentStats.personalBest.toLocaleString()}점` : '…'}
                    </span>
                  </div>
                  <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                    <span className="text-[10px] text-zinc-500 font-doodle block">
                      {rankingSource === 'sheet' ? '학급 순위' : '이 기기 순위'}
                    </span>
                    <span className="text-base font-bold text-purple-600 font-doodle">
                      {studentStats ? (
                        <>
                          {studentStats.rank}위{' '}
                          <span className="text-[10px] text-zinc-400 font-normal">/ {studentStats.totalPlayers}명</span>
                        </>
                      ) : (
                        '…'
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Feedback Message */}
            <div className="bg-yellow-50 border-2 border-zinc-900 rounded-xl p-2 text-center text-xs text-zinc-800 font-doodle leading-relaxed shadow-[1.5px_1.5px_0px_#18181b]">
              🎉 <strong>수고하셨습니다!</strong> 여러 번 반복할수록 개념이 머릿속에 확실히 기억됩니다.
            </div>
          </div>
        )}

        {/* TAB 2: TOP 10 RANKING */}
        {activeTab === 'ranking' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-doodle">
              <span>{rankingSource === 'sheet' ? '📊 반 전체 (구글 시트)' : '📱 이 기기 기록만'}</span>
              <span>{ranking ? `총 ${ranking.length}명 참여` : ''}</span>
            </div>
            <div className="max-h-52 overflow-y-auto pr-0.5">
              {ranking ? (
                <RankingList entries={ranking} highlightName={nickname} />
              ) : (
                <div className="p-5 text-center text-zinc-500 text-xs font-doodle">랭킹 불러오는 중...</div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons: Retry & Home */}
        <div className="mt-3 pt-2.5 border-t-2 border-zinc-200 flex items-center gap-2">
          <button
            onClick={onGoHome}
            className="flex-1 py-2.5 px-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 font-doodle font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Home className="w-4 h-4" />
            <span>홈으로</span>
          </button>

          <button
            onClick={onRetry}
            className="flex-[2] py-2.5 px-3 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-zinc-950 font-doodle font-bold text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all border-3 border-zinc-900 shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>다시 도전하기!</span>
          </button>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="w-full max-w-sm flex items-center justify-end pb-1 pr-1">
        <span className="text-xs text-zinc-500 font-doodle font-bold">by.수인쌤ㅋ</span>
      </div>
    </div>
  );
};
