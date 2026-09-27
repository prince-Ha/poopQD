import React, { useState } from 'react';
import { Trophy, RotateCcw, Home, Sparkles, FileSpreadsheet, CheckCircle2, Download, Trash2 } from 'lucide-react';
import { getLeaderboard, getStudentStats, exportRecordsToCSV, getWebhookUrl, saveWebhookUrl, deleteNicknameRecord } from '../utils/storage';

interface GameOverScreenProps {
  nickname: string;
  finalScore: number;
  correctCount: number;
  maxCombo: number;
  chapterTitle: string;
  onRetry: () => void;
  onGoHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  nickname,
  finalScore,
  correctCount,
  maxCombo,
  chapterTitle,
  onRetry,
  onGoHome,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'ranking' | 'sheets'>('summary');
  const [webhookInput, setWebhookInput] = useState(getWebhookUrl());
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [, setRefreshKey] = useState(0);

  const leaderboard = getLeaderboard();
  const studentStats = getStudentStats(nickname);
  const isNewRecord = finalScore >= studentStats.personalBest && finalScore > 0;

  const handleSaveWebhook = () => {
    saveWebhookUrl(webhookInput.trim());
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  const handleDeleteRecord = (nick: string) => {
    if (confirm(`'${nick}' 학생의 기록을 랭킹에서 영구 삭제하시겠습니까?`)) {
      deleteNicknameRecord(nick);
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-y-auto bg-white flex flex-col items-center justify-between p-3 sm:p-4 text-zinc-900 select-none">
      <div className="relative w-full max-w-sm bg-white border-3 border-zinc-900 rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_#18181b] z-10 flex flex-col my-auto">
        {/* Header with celebration banner */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-yellow-100 border-2 border-zinc-900 rounded-full text-zinc-900 text-xs font-doodle font-bold mb-1 shadow-[1.5px_1.5px_0px_#18181b]">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>수업 활동 완료!</span>
          </div>
          <h2 className="text-2xl font-doodle font-bold text-zinc-950">
            <span className="text-blue-600">{nickname}</span> 학생 결과
          </h2>
          <p className="text-zinc-500 font-doodle text-xs mt-0.5">{chapterTitle}</p>
        </div>

        {/* Tab Navigation (Summary, Ranking, Sheets) */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-2xl mb-3 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b]">
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
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 py-1 rounded-xl text-xs font-doodle font-bold transition-all ${
              activeTab === 'sheets'
                ? 'bg-yellow-300 text-zinc-950 border-2 border-zinc-900 shadow-[1px_1px_0px_#18181b]'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            📊 시트 연동
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
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                <span className="text-[10px] text-zinc-500 font-doodle block">내 최고점</span>
                <span className="text-base font-bold text-blue-600 font-doodle">{studentStats.personalBest.toLocaleString()}점</span>
              </div>
              <div className="bg-white border-2 border-zinc-900 rounded-xl p-2 text-center shadow-[1.5px_1.5px_0px_#18181b]">
                <span className="text-[10px] text-zinc-500 font-doodle block">학급 순위</span>
                <span className="text-base font-bold text-purple-600 font-doodle">
                  {studentStats.rank}위 <span className="text-[10px] text-zinc-400 font-normal">/ {studentStats.totalPlayers}명</span>
                </span>
              </div>
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
              <span>동일 학생 최고점 1개만 반영</span>
              <span>총 {leaderboard.length}명 참여</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
              {leaderboard.length === 0 ? (
                <div className="p-5 text-center text-zinc-400 text-xs font-doodle">
                  아직 기록이 없습니다. 게임을 완료하면 순위가 등록됩니다!
                </div>
              ) : (
                leaderboard.slice(0, 10).map((entry, index) => {
                  const isCurrent = entry.nickname.toLowerCase() === nickname.toLowerCase();
                  let rankBadge = (
                    <span className="w-5 h-5 flex items-center justify-center font-bold text-xs text-zinc-500 font-mono">
                      {index + 1}
                    </span>
                  );
                  if (index === 0) rankBadge = <span className="text-sm">🥇</span>;
                  else if (index === 1) rankBadge = <span className="text-sm">🥈</span>;
                  else if (index === 2) rankBadge = <span className="text-sm">🥉</span>;

                  return (
                    <div
                      key={entry.nickname}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs border-2 border-zinc-900 font-doodle transition-all ${
                        isCurrent
                          ? 'bg-yellow-100 shadow-[1.5px_1.5px_0px_#18181b] font-bold'
                          : 'bg-white shadow-[1px_1px_0px_#18181b] text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {rankBadge}
                        <span className="text-zinc-950 font-bold text-xs truncate max-w-[90px]">{entry.nickname}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-zinc-950 text-white px-1 rounded font-bold shrink-0">
                            나
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-zinc-500 text-[10px]">
                          {entry.correctCount}정답
                        </span>
                        <span className="font-bold text-xs text-zinc-950">
                          {entry.score.toLocaleString()}점
                        </span>
                        <button
                          onClick={() => handleDeleteRecord(entry.nickname)}
                          className="p-1 text-zinc-300 hover:text-red-500 rounded transition-colors"
                          title="이 닉네임 기록 삭제 (선생님 전용)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE SHEETS & CSV */}
        {activeTab === 'sheets' && (
          <div className="space-y-2.5">
            <div className="bg-zinc-50 border-2 border-zinc-900 rounded-xl p-2.5 space-y-1.5 shadow-[1.5px_1.5px_0px_#18181b]">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-doodle font-bold text-zinc-900">구글 시트 연동 (선생님용)</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-doodle leading-relaxed">
                학생들이 게임을 마칠 때마다 구글 스프레드시트에 [시간, 이름, 점수, 정답수, 최대콤보]가
                자동으로 1행씩 실시간 누적됩니다 (300명 이상 무제한 지원).
              </p>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="Apps Script 웹 앱 URL"
                  className="flex-1 bg-white border-2 border-zinc-900 rounded-lg px-2 py-1 text-[11px] text-zinc-900 font-doodle placeholder-zinc-400 outline-none"
                />
                <button
                  onClick={handleSaveWebhook}
                  className="px-2.5 py-1 bg-zinc-900 text-white rounded-lg text-xs font-doodle font-bold active:scale-95 flex items-center gap-1"
                >
                  {webhookSaved ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                  <span>저장</span>
                </button>
              </div>
            </div>

            {/* Quick CSV Export button */}
            <div className="flex items-center justify-between p-2.5 bg-white border-2 border-zinc-900 rounded-xl shadow-[1.5px_1.5px_0px_#18181b]">
              <div>
                <span className="text-xs font-doodle font-bold text-zinc-900 block">전체 기록 CSV 다운로드</span>
                <span className="text-[10px] text-zinc-500 font-doodle">엑셀 파일로 바로 저장</span>
              </div>
              <button
                onClick={exportRecordsToCSV}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 rounded-lg text-xs font-doodle font-bold text-zinc-900 active:scale-95 transition-all shadow-[1px_1px_0px_#18181b]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
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
