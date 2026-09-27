export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  wrongAnswers: string[]; // 2-3 common misconceptions or distractor numbers
  hint?: string;
}

export interface ScienceChapter {
  id: string;
  grade: '중1' | '중2' | '중3' | '공통';
  title: string;
  description: string;
  theme: 'lab' | 'space' | 'cell' | 'nature';
  questions: QuizQuestion[];
}

export type ItemType = 'correct' | 'wrong' | 'obstacle';

export interface FallingItem {
  id: number;
  type: ItemType;
  text?: string; // Empty for obstacle
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  wobbleOffset: number;
  wobbleSpeed: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export type CharacterAction = 'idle' | 'run-left' | 'run-right' | 'happy' | 'wobble' | 'squish';
export type CharacterSkin = 'giyeong' | 'pikachu' | 'ganadi' | 'saitama' | 'bakugo';

export interface GameRecord {
  id: string;
  timestamp: string;
  nickname: string;
  chapterTitle: string;
  score: number;
  correctCount: number;
  maxCombo: number;
  timeLimit: number;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  correctCount: number;
  maxCombo: number;
  date: string;
}
