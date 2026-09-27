import React, { useCallback, useEffect, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { RankingList } from './RankingList';
import { fetchSheetRanking } from '../utils/sheet';
import { deleteNicknameRecord, getLeaderboard } from '../utils/storage';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string | null;
  chapterTitle: string;
  nickname: string;
  isTeacher: boolean;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  isOpen,
  onClose,
  sheetId,
  chapterTitle,
  nickname,
  isTeacher,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  const load = useCallback(async () => {
    if (!sheetId) {
      setEntries(getLeaderboard(chapterTitle));
      setStatus('ok');
      return;
    }
    setStatus('loading');
    try {
      setEntries(await fetchSheetRanking(sheetId, chapterTitle));
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, [sheetId, chapterTitle]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const handleDelete = (nick: string) => {
    if (confirm(`'${nick}' 학생의 기록을 이 기기에서 영구 삭제하시겠습니까?`)) {
      deleteNicknameRecord(nick);
      load();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm max-h-[85dvh] flex flex-col bg-white border-3 border-zinc-900 rounded-3xl p-4 shadow-[5px_5px_0px_#18181b] text-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-doodle font-bold">🏆 TOP 10</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={load}
              className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
              aria-label="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 mb-2 font-doodle">
          <span>{sheetId ? '📊 반 전체 기록 (구글 시트)' : '📱 이 기기 기록만'}</span>
          <span>이름별 최고점</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5">
          {status === 'loading' && (
            <div className="p-6 text-center text-zinc-500 text-xs font-doodle">랭킹 불러오는 중...</div>
          )}
          {status === 'error' && (
            <div className="p-6 text-center text-red-600 text-xs font-doodle">
              랭킹을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침을 눌러 주세요.
            </div>
          )}
          {status === 'ok' && (
            <RankingList
              entries={entries}
              highlightName={nickname}
              onDelete={isTeacher && !sheetId ? handleDelete : undefined}
            />
          )}
        </div>

        {isTeacher && sheetId && (
          <p className="mt-2 text-[10px] text-zinc-500 font-doodle text-center">
            기록 삭제는 구글 시트의 '기록' 탭에서 해당 줄을 지우면 돼요.
          </p>
        )}
      </div>
    </div>
  );
};
