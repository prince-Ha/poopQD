import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FallingItem, Particle, FloatingText, CharacterAction, QuizQuestion, CharacterSkin, LeaderboardEntry } from './types/game';
import { INITIAL_CHAPTERS } from './data/chapters';
import { STUDENT_TIME_LIMIT, TEST_TIME_LIMIT } from './config';
import { V_WIDTH, PLAYER_W, PLAYER_START_X, HITBOX, PLAYER_TEXT_Y } from './data/player';
import { PixelCanvas } from './components/PixelCanvas';
import { GameHUD } from './components/GameHUD';
import { TouchControls } from './components/TouchControls';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen, SyncStatus } from './components/GameOverScreen';
import { QRCodeModal } from './components/QRCodeModal';
import { PinModal } from './components/PinModal';
import { TeacherPanel, QuizSource } from './components/TeacherPanel';
import { RankingModal } from './components/RankingModal';
import { soundEngine } from './utils/audio';
import {
  getLastNickname,
  saveLastNickname,
  getSoundMuted,
  saveSoundMuted,
  saveGameRecord,
  getLastSkin,
  saveLastSkin,
  getLeaderboard,
  exportRecordsToCSV,
} from './utils/storage';
import {
  rememberSheetIdFromLocation,
  getSheetId,
  saveSheetId,
  fetchSheetQuestions,
  getCachedSheetQuestions,
  fetchSheetRanking,
  submitSheetRecord,
} from './utils/sheet';

interface QuizSet {
  title: string;
  questions: QuizQuestion[];
  source: QuizSource;
}

const DEFAULT_QUIZ: QuizSet = {
  title: INITIAL_CHAPTERS[0].title,
  questions: INITIAL_CHAPTERS[0].questions,
  source: 'default',
};

const TEACHER_SESSION_KEY = 'science_game_teacher_unlocked';

// QR로 들어온 학생 폰이면 주소의 ?sheet=ID 를 기억해 둠
rememberSheetIdFromLocation();

function loadInitialQuiz(sheetId: string | null): QuizSet {
  const cached = sheetId ? getCachedSheetQuestions(sheetId) : null;
  return cached ? { title: cached.title || DEFAULT_QUIZ.title, questions: cached.questions, source: 'cache' } : DEFAULT_QUIZ;
}

// 피셔-예이츠 셔플 (sort(random)보다 고르게 섞임)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<'start' | 'playing' | 'gameover'>('start');

  // 문제: 구글 시트 → (실패 시) 이 기기에 저장된 시트 문제 → 기본 문제
  const [sheetId, setSheetId] = useState<string | null>(() => getSheetId());
  const [quiz, setQuiz] = useState<QuizSet>(() => loadInitialQuiz(getSheetId()));
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(() => getSheetId() !== null);
  const sheetIdRef = useRef<string | null>(sheetId);
  sheetIdRef.current = sheetId;

  const [nickname, setNickname] = useState<string>(() => getLastNickname());
  const [characterSkin, setCharacterSkin] = useState<CharacterSkin>(() => getLastSkin());
  const [isTestPlay, setIsTestPlay] = useState(false);

  // Teacher mode & modals
  const [isTeacher, setIsTeacher] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(TEACHER_SESSION_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isTeacherPanelOpen, setIsTeacherPanelOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => getSoundMuted());
  const [stageAlert, setStageAlert] = useState<string | null>(null);

  // Result screen: ranking & sheet sync
  const [ranking, setRanking] = useState<LeaderboardEntry[] | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('none');

  const loadQuiz = useCallback(async (id: string | null): Promise<boolean> => {
    if (!id) {
      setQuiz(DEFAULT_QUIZ);
      setIsQuizLoading(false);
      return true;
    }
    setIsQuizLoading(true);
    try {
      const set = await fetchSheetQuestions(id);
      if (sheetIdRef.current === id) {
        setQuiz({ title: set.title || DEFAULT_QUIZ.title, questions: set.questions, source: 'sheet' });
      }
      return true;
    } catch {
      if (sheetIdRef.current === id) setQuiz(loadInitialQuiz(id));
      return false;
    } finally {
      if (sheetIdRef.current === id) setIsQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuiz(sheetId);
  }, [sheetId, loadQuiz]);

  // Gameplay state
  const [hp, setHp] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [showHealAlert, setShowHealAlert] = useState(false);

  // Question state (화면 표시용. 실제 진행은 gameStateRef의 deck/qIdx)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  // Mobile portrait dimensions: 480 x 800
  const [playerX, setPlayerX] = useState<number>(PLAYER_START_X);
  const [playerDirection, setPlayerDirection] = useState<'left' | 'right'>('right');
  const [characterAction, setCharacterAction] = useState<CharacterAction>('idle');
  const [isInvincible, setIsInvincible] = useState(false);
  const [screenShake, setScreenShake] = useState(0);

  // Input states
  const [isMovingLeft, setIsMovingLeft] = useState(false);
  const [isMovingRight, setIsMovingRight] = useState(false);

  // Falling items and particles
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Refs for requestAnimationFrame game loop
  const gameStateRef = useRef({
    screen: 'start' as 'start' | 'playing' | 'gameover',
    isPaused: false,
    playerX: PLAYER_START_X,
    playerDir: 'right' as 'left' | 'right',
    action: 'idle' as CharacterAction,
    actionTimer: 0,
    isMovingLeft: false,
    isMovingRight: false,
    hp: 5,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    timeLeft: 300,
    timeLimit: STUDENT_TIME_LIMIT,
    isTest: false,
    nickname: '',
    chapterTitle: '',
    skin: 'ganadi' as CharacterSkin,
    currentStage: 1,
    items: [] as FallingItem[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    invincibleTimer: 0,
    shake: 0,
    nextWordSpawn: 0.8,
    nextPoopSpawn: 1.8,
    currentQuestion: null as QuizQuestion | null,
    allQuestions: [] as QuizQuestion[],
    deck: [] as QuizQuestion[],
    qIdx: 0,
    totalElapsed: 0,
  });

  const itemIdCounter = useRef<number>(1);
  const particleIdCounter = useRef<number>(1);
  const textIdCounter = useRef<number>(1);
  const healTimeoutRef = useRef<number | null>(null);
  const stageAlertTimeoutRef = useRef<number | null>(null);

  // Sync isMuted with sound engine
  useEffect(() => {
    soundEngine.setMuted(isMuted);
    saveSoundMuted(isMuted);
  }, [isMuted]);


  const handleChangeSkin = (skin: CharacterSkin) => {
    setCharacterSkin(skin);
    saveLastSkin(skin);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setIsMovingLeft(true);
        gameStateRef.current.isMovingLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setIsMovingRight(true);
        gameStateRef.current.isMovingRight = true;
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        handleTogglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setIsMovingLeft(false);
        gameStateRef.current.isMovingLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setIsMovingRight(false);
        gameStateRef.current.isMovingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);

  // Start / Restart Game
  // test=true: 선생님 20초 테스트 (기록 안 남음)
  const handleStartGame = useCallback((test = false) => {
    const cleanNick = nickname.trim();
    if (!cleanNick && !test) return;
    if (cleanNick) saveLastNickname(cleanNick);
    const limit = test ? TEST_TIME_LIMIT : STUDENT_TIME_LIMIT;
    setIsTestPlay(test);
    setRanking(null);
    setSyncStatus('none');
    setIsTeacherPanelOpen(false);

    // Shuffle questions
    const qList = shuffle(quiz.questions);
    setCurrentQuestion(qList[0] || null);

    // Reset gameplay stats
    setHp(5);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(limit);
    setShowHealAlert(false);
    setStageAlert(null);
    setIsPaused(false);
    setPlayerX(PLAYER_START_X);
    setPlayerDirection('right');
    setCharacterAction('idle');
    setIsInvincible(false);
    setScreenShake(0);
    setFallingItems([]);
    setParticles([]);
    setFloatingTexts([]);

    // Initialize ref
    gameStateRef.current = {
      screen: 'playing',
      isPaused: false,
      playerX: PLAYER_START_X,
      playerDir: 'right',
      action: 'idle',
      actionTimer: 0,
      isMovingLeft: false,
      isMovingRight: false,
      hp: 5,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      timeLeft: limit,
      timeLimit: limit,
      isTest: test,
      nickname: cleanNick || '선생님 테스트',
      chapterTitle: quiz.title,
      skin: characterSkin,
      currentStage: 1,
      items: [],
      particles: [],
      floatingTexts: [],
      invincibleTimer: 0,
      shake: 0,
      nextWordSpawn: 0.8,
      nextPoopSpawn: 1.8,
      currentQuestion: qList[0] || null,
      allQuestions: quiz.questions,
      deck: qList,
      qIdx: 0,
      totalElapsed: 0,
    };

    setScreen('playing');
  }, [nickname, quiz, characterSkin]);

  // Advance to next question (한 바퀴 다 돌면 다시 섞어서 계속)
  const advanceToNextQuestion = (state: typeof gameStateRef.current) => {
    state.qIdx += 1;
    if (state.qIdx >= state.deck.length) {
      const prev = state.currentQuestion;
      const reshuffled = shuffle(state.allQuestions);
      // 방금 푼 문제가 바로 또 나오지 않게
      if (reshuffled.length > 1 && prev && reshuffled[0].id === prev.id) {
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }
      state.deck = reshuffled;
      state.qIdx = 0;
    }
    state.currentQuestion = state.deck[state.qIdx] || null;
    setCurrentQuestion(state.currentQuestion);
  };

  // Main game loop (requestAnimationFrame)
  useEffect(() => {
    if (screen !== 'playing') return;

    let lastTime = performance.now();
    let animId = 0;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // clamp delta
      lastTime = currentTime;

      const state = gameStateRef.current;

      if (!state.isPaused && state.screen === 'playing') {
        state.totalElapsed += dt;

        // 1. Countdown timer
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          setTimeLeft(0);
          endGame();
          return;
        }
        setTimeLeft(Math.ceil(state.timeLeft));

        // 2. 1-minute Stage Difficulty calculation
        // Total time 300s -> each 60s is 1 stage. Total time 20s -> each 4s is 1 stage.
        const stageInterval = Math.max(1, state.timeLimit / 5);
        const newStage = Math.min(5, Math.floor(state.totalElapsed / stageInterval) + 1);

        if (newStage > state.currentStage) {
          state.currentStage = newStage;
          const alerts: Record<number, string> = {
            2: '⚡ 2단계: 똥 낙하 속도 증가!',
            3: '💩 3단계: 똥비 주의보! (낙하 빈도 증가)',
            4: '🔥 4단계: 폭풍 똥비 시작!',
            5: '🚨 5단계: 마지막 1분 극한의 똥피하기!',
          };
          const msg = alerts[newStage] || `⚡ ${newStage}단계: 똥 증가!`;
          setStageAlert(msg);
          if (stageAlertTimeoutRef.current) clearTimeout(stageAlertTimeoutRef.current);
          stageAlertTimeoutRef.current = window.setTimeout(() => {
            setStageAlert(null);
          }, 2600);
        }

        // 3. Player Movement physics (speed: 380 px/s)
        const MOVE_SPEED = 380;
        if (state.isMovingLeft && !state.isMovingRight) {
          state.playerX -= MOVE_SPEED * dt;
          state.playerDir = 'left';
          if (state.action !== 'squish' && state.action !== 'happy') {
            state.action = 'run-left';
          }
        } else if (state.isMovingRight && !state.isMovingLeft) {
          state.playerX += MOVE_SPEED * dt;
          state.playerDir = 'right';
          if (state.action !== 'squish' && state.action !== 'happy') {
            state.action = 'run-right';
          }
        } else {
          if (state.action !== 'squish' && state.action !== 'happy') {
            state.action = 'idle';
          }
        }

        // Clamp player inside 480px width
        const minX = 10;
        const maxX = V_WIDTH - PLAYER_W - 10;
        state.playerX = Math.max(minX, Math.min(maxX, state.playerX));
        setPlayerX(state.playerX);
        setPlayerDirection(state.playerDir);

        // Action timer reset
        if (state.actionTimer > 0) {
          state.actionTimer -= dt;
          if (state.actionTimer <= 0) {
            state.action = 'idle';
          }
        }
        setCharacterAction(state.action);

        // Invincibility timer
        if (state.invincibleTimer > 0) {
          state.invincibleTimer -= dt;
          setIsInvincible(true);
        } else {
          setIsInvincible(false);
        }

        // Screen shake decay
        if (state.shake > 0) {
          state.shake = Math.max(0, state.shake - dt * 4);
          setScreenShake(state.shake);
        }

        // 4. Falling Item Spawning
        // Words (Cards): stable spawn rate (every 1.1s ~ 1.5s)
        state.nextWordSpawn -= dt;
        if (state.nextWordSpawn <= 0 && state.currentQuestion) {
          state.nextWordSpawn = 1.1 + Math.random() * 0.4;
          spawnWordItem(state);
        }

        // Poops: Heavily influenced by stage (1분 단위 똥 속도 & 갯수 증가)
        // Stage 1: interval ~1.8s, speed ~200
        // Stage 2: interval ~1.3s, speed ~260
        // Stage 3: interval ~0.9s, speed ~330 (chance of double poop)
        // Stage 4: interval ~0.65s, speed ~410 (chance of double poop)
        // Stage 5: interval ~0.45s, speed ~490 (chance of double/triple poop)
        state.nextPoopSpawn -= dt;
        if (state.nextPoopSpawn <= 0) {
          const spawnIntervals: Record<number, [number, number]> = {
            1: [1.7, 2.1],
            2: [1.2, 1.5],
            3: [0.8, 1.1],
            4: [0.55, 0.8],
            5: [0.38, 0.58],
          };
          const [minInterval, maxInterval] = spawnIntervals[state.currentStage] || [1.0, 1.4];
          state.nextPoopSpawn = minInterval + Math.random() * (maxInterval - minInterval);

          // Spawn 1, 2, or 3 poops depending on stage
          spawnPoopItem(state, state.currentStage);
          if (state.currentStage >= 3 && Math.random() < 0.35) {
            spawnPoopItem(state, state.currentStage);
          }
          if (state.currentStage >= 4 && Math.random() < 0.45) {
            spawnPoopItem(state, state.currentStage);
          }
          if (state.currentStage === 5 && Math.random() < 0.5) {
            spawnPoopItem(state, state.currentStage);
          }
        }

        // 5. Update Falling Items physics & Collision detection
        let survivingItems: FallingItem[] = [];
        let answeredCorrect = false;
        const playerBox = {
          x: state.playerX + HITBOX.offsetX,
          y: HITBOX.top,
          w: HITBOX.width,
          h: HITBOX.bottom - HITBOX.top,
        };

        for (const item of state.items) {
          item.y += item.speed * dt;
          if (item.wobbleSpeed > 0) {
            item.x += Math.sin(state.totalElapsed * item.wobbleSpeed + item.wobbleOffset) * 0.7;
          }

          // Check collision with player
          const itemBox = {
            x: item.x + 4,
            y: item.y + 4,
            w: item.width - 8,
            h: item.height - 8,
          };

          // 이번 프레임에 정답을 먹었으면 남은 단어 카드는 전부 치움
          if (answeredCorrect && item.type !== 'obstacle') {
            spawnCardPuff(item, state);
            continue;
          }

          const isColliding =
            playerBox.x < itemBox.x + itemBox.w &&
            playerBox.x + playerBox.w > itemBox.x &&
            playerBox.y < itemBox.y + itemBox.h &&
            playerBox.y + playerBox.h > itemBox.y;

          if (isColliding) {
            handleItemCollision(item, state);
            if (item.type === 'correct') answeredCorrect = true;
            // Item consumed, do not push to survivingItems
          } else if (item.y < 760) {
            // Still on screen
            survivingItems.push(item);
          }
        }
        if (answeredCorrect) {
          // 정답 먹기 전에 이미 살아남은 카드들도 '펑' 하고 치우기
          survivingItems = survivingItems.filter((item) => {
            if (item.type === 'obstacle') return true;
            spawnCardPuff(item, state);
            return false;
          });
          // 새 문제 카드가 곧바로 떨어지도록
          state.nextWordSpawn = Math.min(state.nextWordSpawn, 0.5);
        }
        state.items = survivingItems;
        setFallingItems([...state.items]);

        // 6. Update Particles
        const survivingParticles: Particle[] = [];
        for (const p of state.particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 220 * dt; // gravity
          p.life -= dt;
          p.alpha = Math.max(0, p.life / p.maxLife);
          if (p.life > 0) survivingParticles.push(p);
        }
        state.particles = survivingParticles;
        setParticles([...state.particles]);

        // 7. Update Floating Texts
        const survivingTexts: FloatingText[] = [];
        for (const ft of state.floatingTexts) {
          ft.y -= 45 * dt;
          ft.life -= dt;
          ft.alpha = Math.max(0, ft.life / 1.0);
          if (ft.life > 0) survivingTexts.push(ft);
        }
        state.floatingTexts = survivingTexts;
        setFloatingTexts([...state.floatingTexts]);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      if (healTimeoutRef.current) clearTimeout(healTimeoutRef.current);
      if (stageAlertTimeoutRef.current) clearTimeout(stageAlertTimeoutRef.current);
    };
  }, [screen]);

  // Spawn Word Card
  const spawnWordItem = (state: typeof gameStateRef.current) => {
    if (!state.currentQuestion) return;
    const cardW = 124;
    const cardH = 42;
    const spawnX = 14 + Math.random() * (V_WIDTH - cardW - 28);

    // 55% chance for correct answer, 45% for wrong distractor
    const isCorrect = Math.random() < 0.55;
    let chosenText = state.currentQuestion.correctAnswer;
    if (!isCorrect) {
      const wrongs = state.currentQuestion.wrongAnswers;
      chosenText = wrongs[Math.floor(Math.random() * wrongs.length)] || '오답';
    }

    // Word falling speed: 170 ~ 220 px/s (steady & readable)
    const baseSpeed = 180 + Math.random() * 35;

    state.items.push({
      id: itemIdCounter.current++,
      type: isCorrect ? 'correct' : 'wrong',
      text: chosenText,
      x: spawnX,
      y: -50,
      width: cardW,
      height: cardH,
      speed: baseSpeed,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0,
    });
  };

  // Spawn Poop Obstacle (Stage-scaled speed, Safe shelters on left & right)
  const spawnPoopItem = (state: typeof gameStateRef.current, stage: number) => {
    const poopSize = 46;
    // Safe shelters on left (0~72) and right (408~480) - no poop drops here!
    const SHELTER_MARGIN = 75;
    const minX = SHELTER_MARGIN;
    const maxX = V_WIDTH - SHELTER_MARGIN - poopSize;
    const spawnX = minX + Math.random() * (maxX - minX);

    // Speed progression per stage:
    // Stage 1: 190 ~ 230
    // Stage 2: 250 ~ 300
    // Stage 3: 320 ~ 380
    // Stage 4: 390 ~ 460
    // Stage 5: 470 ~ 540
    const speedRanges: Record<number, [number, number]> = {
      1: [190, 230],
      2: [250, 300],
      3: [320, 380],
      4: [390, 460],
      5: [470, 540],
    };
    const [minSpd, maxSpd] = speedRanges[stage] || [220, 280];
    const poopSpeed = minSpd + Math.random() * (maxSpd - minSpd);

    state.items.push({
      id: itemIdCounter.current++,
      type: 'obstacle',
      x: spawnX,
      y: -50,
      width: poopSize,
      height: poopSize,
      speed: poopSpeed,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 2.5 + Math.random() * 2,
    });
  };

  // 치워지는 단어 카드의 '펑' 연기
  const spawnCardPuff = (item: FallingItem, state: typeof gameStateRef.current) => {
    for (let i = 0; i < 6; i++) {
      state.particles.push({
        id: particleIdCounter.current++,
        x: item.x + Math.random() * item.width,
        y: item.y + item.height / 2,
        vx: (Math.random() - 0.5) * 120,
        vy: -40 - Math.random() * 80,
        size: 3 + Math.random() * 3,
        color: '#d4d4d8',
        alpha: 1,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  };

  // Handle Collisions
  const handleItemCollision = (item: FallingItem, state: typeof gameStateRef.current) => {
    if (item.type === 'correct') {
      // 1. CORRECT ANSWER!
      const newCombo = state.combo + 1;
      state.combo = newCombo;
      state.maxCombo = Math.max(state.maxCombo, newCombo);
      state.correctCount += 1;

      // Base 100 + combo bonus (max +100)
      const comboBonus = Math.min(100, (newCombo - 1) * 10);
      const points = 100 + comboBonus;
      state.score += points;

      setScore(state.score);
      setCombo(state.combo);
      setMaxCombo(state.maxCombo);
      setCorrectCount(state.correctCount);

      // Sound & visuals
      soundEngine.playCorrect(newCombo);
      state.action = 'happy';
      state.actionTimer = 0.55;

      // Floating text
      state.floatingTexts.push({
        id: textIdCounter.current++,
        text: comboBonus > 0 ? `+${points} (${newCombo}콤보!)` : `+${points} 정답!`,
        x: item.x + item.width / 2,
        y: PLAYER_TEXT_Y,
        color: '#16a34a',
        size: 22,
        alpha: 1,
        life: 0.9,
      });

      // Star particles
      for (let i = 0; i < 9; i++) {
        state.particles.push({
          id: particleIdCounter.current++,
          x: item.x + item.width / 2,
          y: item.y + item.height / 2,
          vx: (Math.random() - 0.5) * 180,
          vy: -100 - Math.random() * 140,
          size: 4 + Math.random() * 4,
          color: '#facc15',
          alpha: 1,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
        });
      }

      // Next question
      advanceToNextQuestion(state);
    } else if (item.type === 'wrong') {
      // 2. WRONG ANSWER
      if (state.invincibleTimer > 0) return;

      soundEngine.playWrong();
      state.combo = 0;
      setCombo(0);

      state.hp = Math.max(0, state.hp - 1);
      setHp(state.hp);

      state.action = 'squish';
      state.actionTimer = 0.6;
      state.invincibleTimer = 1.0;
      state.shake = 0.4;

      // Floating text
      state.floatingTexts.push({
        id: textIdCounter.current++,
        text: '❌ 오답!',
        x: item.x + item.width / 2,
        y: PLAYER_TEXT_Y,
        color: '#dc2626',
        size: 20,
        alpha: 1,
        life: 0.9,
      });

      // Check Zero-Elimination
      checkZeroElimination(state);
    } else if (item.type === 'obstacle') {
      // 3. POOP HIT (장애물 충돌)
      if (state.invincibleTimer > 0) return;

      soundEngine.playPoopHit();
      state.combo = 0;
      setCombo(0);

      state.hp = Math.max(0, state.hp - 1);
      setHp(state.hp);

      state.action = 'squish';
      state.actionTimer = 0.65;
      state.invincibleTimer = 1.1;
      state.shake = 0.5;

      // Floating text
      state.floatingTexts.push({
        id: textIdCounter.current++,
        text: '💩 앗 똥이다!',
        x: item.x + item.width / 2,
        y: PLAYER_TEXT_Y,
        color: '#92400e',
        size: 21,
        alpha: 1,
        life: 0.9,
      });

      // Poop splatter particles
      for (let i = 0; i < 7; i++) {
        state.particles.push({
          id: particleIdCounter.current++,
          x: item.x + item.width / 2,
          y: item.y + item.height / 2,
          vx: (Math.random() - 0.5) * 160,
          vy: -60 - Math.random() * 120,
          size: 3.5 + Math.random() * 3,
          color: '#78350f',
          alpha: 1,
          life: 0.5 + Math.random() * 0.3,
          maxLife: 0.8,
        });
      }

      // Check Zero-Elimination
      checkZeroElimination(state);
    }
  };

  // Zero-Elimination HP System
  const checkZeroElimination = (state: typeof gameStateRef.current) => {
    if (state.hp <= 0) {
      soundEngine.playHealRecover();
      state.hp = 5;
      setHp(5);

      // Penalty -500 points (clamped to 0)
      state.score = Math.max(0, state.score - 500);
      setScore(state.score);

      state.invincibleTimer = 1.5;
      setShowHealAlert(true);

      if (healTimeoutRef.current) clearTimeout(healTimeoutRef.current);
      healTimeoutRef.current = window.setTimeout(() => {
        setShowHealAlert(false);
      }, 2500);

      state.floatingTexts.push({
        id: textIdCounter.current++,
        text: '❤️ 체력 회복! (-500점)',
        x: state.playerX + PLAYER_W / 2,
        y: PLAYER_TEXT_Y - 10,
        color: '#e11d48',
        size: 22,
        alpha: 1,
        life: 1.2,
      });
    }
  };

  // End Game (Time Expired)
  const endGame = () => {
    soundEngine.stopBGM();
    soundEngine.playGameOver();

    const state = gameStateRef.current;
    state.screen = 'gameover';
    state.items = [];
    setFallingItems([]);

    setScreen('gameover');
    if (state.isTest) return; // 선생님 테스트는 기록 안 남김

    // 1) 이 기기에 저장 (시트가 안 될 때의 예비 기록)
    saveGameRecord({
      nickname: state.nickname,
      chapterTitle: state.chapterTitle,
      score: state.score,
      correctCount: state.correctCount,
      maxCombo: state.maxCombo,
      timeLimit: state.timeLimit,
      character: state.skin,
    });

    // 2) 구글 시트에 보내고 반 전체 랭킹 받아오기
    const id = sheetIdRef.current;
    if (!id) {
      setRanking(getLeaderboard(state.chapterTitle));
      setSyncStatus('none');
      return;
    }
    syncRecordToSheet(id, {
      nickname: state.nickname,
      chapter: state.chapterTitle,
      score: state.score,
      correctCount: state.correctCount,
      maxCombo: state.maxCombo,
      character: state.skin,
    });
  };

  const syncRecordToSheet = async (id: string, record: Parameters<typeof submitSheetRecord>[1]) => {
    setSyncStatus('saving');
    try {
      setRanking(await submitSheetRecord(id, record));
      setSyncStatus('saved');
      return;
    } catch {
      // 저장은 됐는데 응답만 못 받았을 수도 있으니, 랭킹을 다시 받아서 확인
    }
    try {
      const list = await fetchSheetRanking(id, record.chapter);
      const mine = list.find((e) => e.nickname.trim().toLowerCase() === record.nickname.trim().toLowerCase());
      setRanking(list);
      setSyncStatus(mine && mine.score >= record.score ? 'saved' : 'error');
    } catch {
      setRanking(getLeaderboard(record.chapter));
      setSyncStatus('error');
    }
  };

  // ---- 선생님 메뉴 ----
  const handleOpenTeacher = () => {
    if (isTeacher) setIsTeacherPanelOpen(true);
    else setIsPinOpen(true);
  };

  const handleUnlockTeacher = () => {
    setIsTeacher(true);
    try {
      sessionStorage.setItem(TEACHER_SESSION_KEY, '1');
    } catch {}
    setIsPinOpen(false);
    setIsTeacherPanelOpen(true);
  };

  const handleLockTeacher = () => {
    setIsTeacher(false);
    try {
      sessionStorage.removeItem(TEACHER_SESSION_KEY);
    } catch {}
    setIsTeacherPanelOpen(false);
  };

  const handleConnectSheet = async (id: string) => {
    try {
      const set = await fetchSheetQuestions(id);
      saveSheetId(id);
      sheetIdRef.current = id;
      setSheetId(id);
      setQuiz({ title: set.title || DEFAULT_QUIZ.title, questions: set.questions, source: 'sheet' });
      return { ok: true, message: `연결됐어요! '${set.title || DEFAULT_QUIZ.title}' 문제 ${set.questions.length}개를 불러왔어요.` };
    } catch {
      return {
        ok: false,
        message: "연결하지 못했어요. 배포할 때 액세스를 '모든 사용자'로 했는지, setup을 실행했는지 확인해 주세요.",
      };
    }
  };

  // 선생님용: 기록 저장 → 응답(랭킹) 받기까지 한 번에 확인.
  // 단원 이름을 따로 써서 반 랭킹에는 섞이지 않음
  const handleTestSheetSave = async () => {
    const id = sheetIdRef.current;
    if (!id) return { ok: false, message: '먼저 구글 시트를 연결해 주세요.' };
    try {
      await submitSheetRecord(id, {
        nickname: '연결 테스트',
        chapter: '🧪 연결 테스트',
        score: 0,
        correctCount: 0,
        maxCombo: 0,
        character: '',
      });
      return {
        ok: true,
        message: "저장·응답 모두 정상이에요! 시트 '기록' 탭 맨 아래 '연결 테스트' 줄은 지워도 돼요.",
      };
    } catch {
      return {
        ok: false,
        message:
          "응답을 받지 못했어요. 시트 '기록' 탭에 '연결 테스트' 줄이 생겼다면 저장은 된 거예요. 안 생겼다면 배포 설정(액세스: 모든 사용자)을 확인해 주세요.",
      };
    }
  };

  const handleDisconnectSheet = () => {
    saveSheetId(null);
    sheetIdRef.current = null;
    setSheetId(null);
  };

  // 학생용 접속 주소: 시트가 연결돼 있으면 ?sheet=ID 를 붙여서 QR 하나로 시트까지 연결
  const studentUrl = (() => {
    const base = `${window.location.origin}${window.location.pathname}`;
    return sheetId ? `${base}?sheet=${sheetId}` : base;
  })();

  // Touch Movement callbacks
  const handleMoveLeftStart = () => {
    setIsMovingLeft(true);
    gameStateRef.current.isMovingLeft = true;
  };
  const handleMoveLeftEnd = () => {
    setIsMovingLeft(false);
    gameStateRef.current.isMovingLeft = false;
  };
  const handleMoveRightStart = () => {
    setIsMovingRight(true);
    gameStateRef.current.isMovingRight = true;
  };
  const handleMoveRightEnd = () => {
    setIsMovingRight(false);
    gameStateRef.current.isMovingRight = false;
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      gameStateRef.current.isPaused = next;
      return next;
    });
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // 게임 도중 홈으로: 기록 저장 없이 시작 화면으로
  const handleGoHome = () => {
    const state = gameStateRef.current;
    state.screen = 'start';
    state.items = [];
    state.isMovingLeft = false;
    state.isMovingRight = false;
    setFallingItems([]);
    setIsMovingLeft(false);
    setIsMovingRight(false);
    setIsPaused(false);
    setScreen('start');
  };

  return (
    <div className="relative w-screen h-[100dvh] flex flex-col items-center justify-center bg-zinc-100 overflow-hidden font-doodle select-none touch-none text-zinc-900">
      {/* Mobile-first Smartphone Frame Container */}
      <div className="relative w-full max-w-[440px] h-full max-h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* 1. START SCREEN */}
        {screen === 'start' && (
          <StartScreen
            nickname={nickname}
            onChangeNickname={setNickname}
            characterSkin={characterSkin}
            onChangeSkin={handleChangeSkin}
            chapterTitle={quiz.title}
            questionCount={quiz.questions.length}
            isQuizLoading={isQuizLoading}
            timeLimit={STUDENT_TIME_LIMIT}
            isTeacher={isTeacher}
            onStartGame={() => handleStartGame(false)}
            onOpenTeacher={handleOpenTeacher}
            onOpenLeaderboard={() => setIsRankingOpen(true)}
          />
        )}

        {/* 2. PLAYING SCREEN */}
        {screen === 'playing' && (
          <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden bg-white">
            {/* Top HUD: Hearts, Timer, Big Question Banner, Score, Combo, Minute Alert */}
            <GameHUD
              hp={hp}
              maxHp={5}
              score={score}
              combo={combo}
              timeLeft={timeLeft}
              currentQuestion={currentQuestion}
              questionNumber={correctCount + 1}
              totalAnswered={correctCount}
              isPaused={isPaused}
              isMuted={isMuted}
              onTogglePause={handleTogglePause}
              onToggleMute={handleToggleMute}
              onGoHome={handleGoHome}
              showHealAlert={showHealAlert}
              stageAlert={stageAlert}
              isTestPlay={isTestPlay}
            />

            {/* Mobile Canvas: 480 x 800 */}
            <PixelCanvas
              playerX={playerX}
              playerDirection={playerDirection}
              characterAction={characterAction}
              characterSkin={characterSkin}
              combo={combo}
              fallingItems={fallingItems}
              particles={particles}
              floatingTexts={floatingTexts}
              isInvincible={isInvincible}
              screenShake={screenShake}
            />

            {/* Ergonomic Mobile Touch Controls: ◀ and ▶ + by.수인쌤ㅋ */}
            <TouchControls
              onMoveLeftStart={handleMoveLeftStart}
              onMoveLeftEnd={handleMoveLeftEnd}
              onMoveRightStart={handleMoveRightStart}
              onMoveRightEnd={handleMoveRightEnd}
              isMovingLeft={isMovingLeft}
              isMovingRight={isMovingRight}
            />
          </div>
        )}

        {/* 3. GAMEOVER / RESULT SCREEN */}
        {screen === 'gameover' && (
          <GameOverScreen
            nickname={gameStateRef.current.nickname || nickname || '학생'}
            finalScore={score}
            correctCount={correctCount}
            maxCombo={maxCombo}
            chapterTitle={gameStateRef.current.chapterTitle || quiz.title}
            isTestPlay={isTestPlay}
            ranking={ranking}
            rankingSource={sheetId ? 'sheet' : 'local'}
            syncStatus={syncStatus}
            onRetry={() => handleStartGame(isTestPlay)}
            onGoHome={() => setScreen('start')}
          />
        )}
      </div>

      {/* MODALS */}
      <PinModal isOpen={isPinOpen} onClose={() => setIsPinOpen(false)} onUnlock={handleUnlockTeacher} />
      <TeacherPanel
        isOpen={isTeacherPanelOpen}
        onClose={() => setIsTeacherPanelOpen(false)}
        sheetId={sheetId}
        onConnectSheet={handleConnectSheet}
        onTestSheetSave={handleTestSheetSave}
        onDisconnectSheet={handleDisconnectSheet}
        quizTitle={quiz.title}
        questions={quiz.questions}
        quizSource={quiz.source}
        isQuizLoading={isQuizLoading}
        onReloadQuiz={() => loadQuiz(sheetId)}
        onOpenQR={() => setIsQROpen(true)}
        onStartTestPlay={() => handleStartGame(true)}
        onExportCSV={exportRecordsToCSV}
        onLock={handleLockTeacher}
      />
      {/* QR은 선생님 메뉴 위에 떠야 하므로 뒤에 둠 */}
      <QRCodeModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} url={studentUrl} />
      <RankingModal
        isOpen={isRankingOpen}
        onClose={() => setIsRankingOpen(false)}
        sheetId={sheetId}
        chapterTitle={quiz.title}
        nickname={nickname}
        isTeacher={isTeacher}
      />
    </div>
  );
}
