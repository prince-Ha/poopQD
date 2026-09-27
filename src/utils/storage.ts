import { CharacterSkin, GameRecord, LeaderboardEntry } from '../types/game';

const RECORDS_STORAGE_KEY = 'science_game_records_v1';
const LAST_NICKNAME_KEY = 'science_game_last_nickname';
const SOUND_MUTED_KEY = 'science_game_sound_muted';

export function saveLastNickname(name: string) {
  try {
    localStorage.setItem(LAST_NICKNAME_KEY, name);
  } catch {}
}

export function getLastNickname(): string {
  try {
    return localStorage.getItem(LAST_NICKNAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSoundMuted(muted: boolean) {
  try {
    localStorage.setItem(SOUND_MUTED_KEY, muted ? '1' : '0');
  } catch {}
}

export function getSoundMuted(): boolean {
  try {
    return localStorage.getItem(SOUND_MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function getAllRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGameRecord(record: Omit<GameRecord, 'id' | 'timestamp'>): GameRecord {
  const newRecord: GameRecord = {
    ...record,
    id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };

  const records = getAllRecords();
  records.push(newRecord);
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch {}

  return newRecord;
}

export function deleteNicknameRecord(nickname: string): void {
  const records = getAllRecords();
  const cleanNick = nickname.trim().toLowerCase();
  const filtered = records.filter((r) => r.nickname.trim().toLowerCase() !== cleanNick);
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function clearAllRecords(): void {
  try {
    localStorage.removeItem(RECORDS_STORAGE_KEY);
  } catch {}
}

/**
 * 이 기기에 저장된 기록으로 만든 랭킹 (구글 시트가 연결되지 않았을 때 사용)
 * Rule 16: "모든 플레이 기록은 그대로 보존한다... 그러나 랭킹에서는 닉네임별 최고점만 사용한다. 랭킹은 점수 높은 순서대로 정렬한다."
 */
export function getLeaderboard(chapterTitle?: string): LeaderboardEntry[] {
  const records = getAllRecords();
  const bestMap = new Map<string, LeaderboardEntry>();

  for (const r of records) {
    const nick = r.nickname.trim();
    if (!nick) continue;
    if (chapterTitle && r.chapterTitle !== chapterTitle) continue;

    const key = nick.toLowerCase();
    const existing = bestMap.get(key);
    if (!existing || r.score > existing.score) {
      bestMap.set(key, {
        nickname: nick,
        score: r.score,
        correctCount: r.correctCount,
        maxCombo: r.maxCombo,
        date: r.timestamp.split(' ')[0],
      });
    }
  }

  return Array.from(bestMap.values()).sort((a, b) => b.score - a.score);
}

/**
 * 랭킹 목록에서 내 최고점과 순위 찾기
 */
export function getStudentStats(
  nickname: string,
  leaderboard: LeaderboardEntry[]
): { personalBest: number; rank: number; totalPlayers: number } {
  const cleanNick = nickname.trim();
  const entryIndex = leaderboard.findIndex((item) => item.nickname.toLowerCase() === cleanNick.toLowerCase());

  if (entryIndex === -1) {
    return { personalBest: 0, rank: leaderboard.length + 1, totalPlayers: leaderboard.length };
  }

  return {
    personalBest: leaderboard[entryIndex].score,
    rank: entryIndex + 1,
    totalPlayers: leaderboard.length,
  };
}

/**
 * Export all gameplay logs to CSV file for the teacher
 */
export function exportRecordsToCSV(): boolean {
  const records = getAllRecords();
  if (records.length === 0) return false;

  const header = ['기록일시', '학번/이름', '단원', '최종점수', '맞힌정답수', '최대콤보', '설정시간(초)'];
  // 엑셀이 '=' 등으로 시작하는 글자를 수식으로 읽지 않게
  const cell = (text: string) => `"${text.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"`;
  const rows = records.map((r) => [
    `"${r.timestamp}"`,
    cell(r.nickname),
    cell(r.chapterTitle),
    r.score,
    r.correctCount,
    r.maxCombo,
    r.timeLimit,
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `과학퀴즈_학습기록_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

const LAST_SKIN_KEY = 'science_game_last_skin';
const ALL_SKINS: CharacterSkin[] = ['giyeong', 'pikachu', 'ganadi', 'saitama', 'bakugo'];

export function saveLastSkin(skin: CharacterSkin) {
  try {
    localStorage.setItem(LAST_SKIN_KEY, skin);
  } catch {}
}

export function getLastSkin(): CharacterSkin {
  try {
    const saved = localStorage.getItem(LAST_SKIN_KEY) as CharacterSkin | null;
    if (saved && ALL_SKINS.includes(saved)) return saved;
  } catch {}
  return 'ganadi';
}
