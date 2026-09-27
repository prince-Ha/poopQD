import React from 'react';
import { Trash2 } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface RankingListProps {
  entries: LeaderboardEntry[];
  highlightName?: string;
  /** 이 기기 기록일 때만 선생님이 지울 수 있음 (시트 기록은 시트에서 지우기) */
  onDelete?: (nickname: string) => void;
  limit?: number;
}

export const RankingList: React.FC<RankingListProps> = ({ entries, highlightName, onDelete, limit = 10 }) => {
  if (entries.length === 0) {
    return (
      <div className="p-5 text-center text-zinc-400 text-xs font-doodle">
        아직 기록이 없습니다. 게임을 완료하면 순위가 등록됩니다!
      </div>
    );
  }

  const me = highlightName?.trim().toLowerCase();

  return (
    <div className="space-y-1.5">
      {entries.slice(0, limit).map((entry, index) => {
        const isCurrent = !!me && entry.nickname.trim().toLowerCase() === me;
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
              <span className="text-zinc-950 font-bold text-xs truncate max-w-[110px]">{entry.nickname}</span>
              {isCurrent && (
                <span className="text-[9px] bg-zinc-950 text-white px-1 rounded font-bold shrink-0">나</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-zinc-500 text-[10px]">{entry.correctCount}정답</span>
              <span className="font-bold text-xs text-zinc-950">{entry.score.toLocaleString()}점</span>
              {onDelete && (
                <button
                  onClick={() => onDelete(entry.nickname)}
                  className="p-1 text-zinc-300 hover:text-red-500 rounded transition-colors"
                  title="이 이름의 기록 삭제 (선생님 전용)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
