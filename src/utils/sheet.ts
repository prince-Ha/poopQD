import { DEFAULT_SHEET_ID } from '../config';
import { LeaderboardEntry, QuizQuestion } from '../types/game';

// 구글 시트(Apps Script 웹 앱)와 주고받는 부분
// - 시트 ID는 QR 주소(?sheet=ID) → 이 기기에 저장된 값 → config 기본값 순서로 찾음

const SHEET_ID_KEY = 'science_game_sheet_id';
const QUESTIONS_CACHE_KEY = 'science_game_sheet_questions_v1';
const REQUEST_TIMEOUT_MS = 15000;

const ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

/** 웹 앱 URL 또는 ID를 받아서 ID만 꺼냄 (school.kr 같은 학교 계정 주소도 지원) */
export function extractSheetId(input: string): string | null {
  const text = input.trim();
  if (ID_PATTERN.test(text)) return text;
  const m = text.match(/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+|macros)\/s\/([A-Za-z0-9_-]{20,})\/(?:exec|dev)/);
  return m ? m[1] : null;
}

export function sheetUrl(id: string): string {
  return `https://script.google.com/macros/s/${id}/exec`;
}

/** 앱을 켤 때 주소창의 ?sheet=ID 를 이 기기에 기억 */
export function rememberSheetIdFromLocation(): void {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('sheet');
    const id = fromUrl ? extractSheetId(fromUrl) : null;
    if (id) localStorage.setItem(SHEET_ID_KEY, id);
  } catch {}
}

export function getSheetId(): string | null {
  try {
    const saved = localStorage.getItem(SHEET_ID_KEY);
    if (saved && ID_PATTERN.test(saved)) return saved;
  } catch {}
  return DEFAULT_SHEET_ID && ID_PATTERN.test(DEFAULT_SHEET_ID) ? DEFAULT_SHEET_ID : null;
}

export function saveSheetId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SHEET_ID_KEY, id);
    else localStorage.removeItem(SHEET_ID_KEY);
  } catch {}
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function toRanking(list: unknown): LeaderboardEntry[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.nickname === 'string')
    .map((e) => ({
      nickname: String(e.nickname),
      score: Number(e.score) || 0,
      correctCount: Number(e.correctCount) || 0,
      maxCombo: Number(e.maxCombo) || 0,
      date: String(e.date ?? ''),
    }));
}

export interface SheetQuestionSet {
  title: string;
  questions: QuizQuestion[];
}

function toQuestionSet(data: any): SheetQuestionSet | null {
  if (!data || !Array.isArray(data.questions)) return null;
  const questions: QuizQuestion[] = data.questions
    .filter((q: any) => q && q.question && q.correctAnswer && Array.isArray(q.wrongAnswers) && q.wrongAnswers.length > 0)
    .map((q: any) => ({
      id: String(q.id),
      question: String(q.question),
      correctAnswer: String(q.correctAnswer),
      wrongAnswers: q.wrongAnswers.map(String),
    }));
  if (questions.length === 0) return null;
  return { title: String(data.title || ''), questions };
}

/** 시트 '문제' 탭 불러오기. 성공하면 이 기기에도 저장해 둠 (인터넷이 끊겨도 쓰도록) */
export async function fetchSheetQuestions(id: string): Promise<SheetQuestionSet> {
  const data = await fetchJson(`${sheetUrl(id)}?action=questions`);
  const set = toQuestionSet(data);
  if (!set) throw new Error('시트에 쓸 수 있는 문제가 없어요');
  try {
    localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify({ id, ...set }));
  } catch {}
  return set;
}

export function getCachedSheetQuestions(id: string): SheetQuestionSet | null {
  try {
    const raw = localStorage.getItem(QUESTIONS_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.id !== id) return null;
    return toQuestionSet(data);
  } catch {
    return null;
  }
}

export async function fetchSheetRanking(id: string, chapter: string): Promise<LeaderboardEntry[]> {
  const data = await fetchJson(`${sheetUrl(id)}?action=ranking&chapter=${encodeURIComponent(chapter)}`);
  if (!data || data.ok === false) throw new Error(data?.error || '랭킹을 불러오지 못했어요');
  return toRanking(data.ranking);
}

export interface SheetRecord {
  nickname: string;
  chapter: string;
  score: number;
  correctCount: number;
  maxCombo: number;
  character: string;
}

/**
 * 기록 한 줄 보내기. 저장이 끝나면 새 랭킹을 돌려받음.
 * (text/plain으로 보내야 브라우저의 사전 확인 요청 없이 Apps Script에 바로 전달돼요)
 */
export async function submitSheetRecord(id: string, record: SheetRecord): Promise<LeaderboardEntry[]> {
  const data = await fetchJson(sheetUrl(id), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(record),
  });
  if (!data || data.ok === false) throw new Error(data?.error || '기록을 저장하지 못했어요');
  return toRanking(data.ranking);
}
