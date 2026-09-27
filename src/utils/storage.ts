import { CharacterSkin, GameRecord, LeaderboardEntry } from '../types/game';

const RECORDS_STORAGE_KEY = 'science_game_records_v1';
const WEBHOOK_STORAGE_KEY = 'science_game_webhook_url';
const LAST_NICKNAME_KEY = 'science_game_last_nickname';
const LAST_CHAPTER_KEY = 'science_game_last_chapter';
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

export function saveLastChapter(chapterId: string) {
  try {
    localStorage.setItem(LAST_CHAPTER_KEY, chapterId);
  } catch {}
}

export function getLastChapter(): string {
  try {
    return localStorage.getItem(LAST_CHAPTER_KEY) || 'bio-genetics';
  } catch {
    return 'bio-genetics';
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

export function saveWebhookUrl(url: string) {
  try {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url);
  } catch {}
}

export function getWebhookUrl(): string {
  try {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || '';
  } catch {
    return '';
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

  // Push to Google Sheets webhook if configured
  const webhookUrl = getWebhookUrl();
  if (webhookUrl && webhookUrl.startsWith('http')) {
    sendToGoogleSheets(webhookUrl, newRecord);
  }

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
 * Calculates leaderboard:
 * Rule 16: "모든 플레이 기록은 그대로 보존한다... 그러나 랭킹에서는 닉네임별 최고점만 사용한다. 랭킹은 점수 높은 순서대로 정렬한다."
 */
export function getLeaderboard(): LeaderboardEntry[] {
  const records = getAllRecords();
  const bestMap = new Map<string, LeaderboardEntry>();

  for (const r of records) {
    const nick = r.nickname.trim();
    if (!nick) continue;

    const existing = bestMap.get(nick);
    if (!existing || r.score > existing.score) {
      bestMap.set(nick, {
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
 * Returns personal best score and class ranking for a specific nickname
 */
export function getStudentStats(nickname: string): { personalBest: number; rank: number; totalPlayers: number } {
  const leaderboard = getLeaderboard();
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
 * Send record to Google Sheets via Google Apps Script Web App
 */
export async function sendToGoogleSheets(url: string, record: GameRecord): Promise<boolean> {
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard for Google Apps Script Web Apps to avoid CORS blocks
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: record.timestamp,
        nickname: record.nickname,
        chapter: record.chapterTitle,
        score: record.score,
        correctCount: record.correctCount,
        maxCombo: record.maxCombo,
      }),
    });
    return true;
  } catch (err) {
    console.warn('Google Sheets sync warning:', err);
    return false;
  }
}

/**
 * Export all gameplay logs to CSV file for the teacher
 */
export function exportRecordsToCSV(): void {
  const records = getAllRecords();
  if (records.length === 0) return;

  const header = ['기록일시', '학번/이름', '단원', '최종점수', '맞힌정답수', '최대콤보', '설정시간(초)'];
  const rows = records.map((r) => [
    `"${r.timestamp}"`,
    `"${r.nickname.replace(/"/g, '""')}"`,
    `"${r.chapterTitle.replace(/"/g, '""')}"`,
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
