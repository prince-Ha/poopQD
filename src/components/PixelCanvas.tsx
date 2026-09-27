import React, { useRef, useEffect } from 'react';
import { FallingItem, Particle, FloatingText, CharacterAction, CharacterSkin } from '../types/game';
import charNormalSrc from '../assets/char_normal.jpg';
import charAngrySrc from '../assets/char_angry.jpg';
import giyeongNormalSrc from '../assets/giyeong_normal.jpg';
import giyeongCrySrc from '../assets/giyeong_cry.jpg';
import pikaNormalSrc from '../assets/pika_normal.jpg';
import pikaHellSrc from '../assets/pika_hell.jpg';
import ganadiNormalSrc from '../assets/ganadi_normal.jpg';
import ganadiCrySrc from '../assets/ganadi_cry.jpg';
import saitamaNormalSrc from '../assets/saitama_normal.jpg';
import saitamaAngrySrc from '../assets/saitama_angry.jpg';

interface PixelCanvasProps {
  playerX: number;
  playerDirection: 'left' | 'right';
  characterAction: CharacterAction;
  characterSkin?: CharacterSkin;
  combo?: number;
  fallingItems: FallingItem[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  isInvincible: boolean;
  screenShake: number;
}

// Background cutout cache (하얀 배경 투명화 캐시)
const cutoutCache = new Map<string, HTMLCanvasElement>();

function getCutoutCanvas(img: HTMLImageElement, key: string, threshold = 230): HTMLCanvasElement | null {
  if (!img.complete || img.naturalWidth === 0) return null;
  if (cutoutCache.has(key)) return cutoutCache.get(key)!;

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];

    // Push all border pixels that are white/near-white
    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      queue.push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      queue.push(0, y);
      queue.push(w - 1, y);
    }

    let head = 0;
    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];
      const idx = qy * w + qx;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pIdx = idx * 4;
      const r = d[pIdx];
      const g = d[pIdx + 1];
      const b = d[pIdx + 2];

      if (r >= threshold && g >= threshold && b >= threshold) {
        d[pIdx + 3] = 0; // Alpha 0 (투명)
        if (qx > 0 && !visited[idx - 1]) queue.push(qx - 1, qy);
        if (qx < w - 1 && !visited[idx + 1]) queue.push(qx + 1, qy);
        if (qy > 0 && !visited[idx - w]) queue.push(qx, qy - 1);
        if (qy < h - 1 && !visited[idx + w]) queue.push(qx, qy + 1);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    cutoutCache.set(key, c);
    return c;
  } catch {
    return null;
  }
}

// Preload 5 character images
const giyeongNormalImg = new Image();
giyeongNormalImg.src = giyeongNormalSrc;
const giyeongCryImg = new Image();
giyeongCryImg.src = giyeongCrySrc;

const pikaNormalImg = new Image();
pikaNormalImg.src = pikaNormalSrc;
const pikaHellImg = new Image();
pikaHellImg.src = pikaHellSrc;

const ganadiNormalImg = new Image();
ganadiNormalImg.src = ganadiNormalSrc;
const ganadiCryImg = new Image();
ganadiCryImg.src = ganadiCrySrc;

const saitamaNormalImg = new Image();
saitamaNormalImg.src = saitamaNormalSrc;
const saitamaAngryImg = new Image();
saitamaAngryImg.src = saitamaAngrySrc;

const bakugoNormalImg = new Image();
bakugoNormalImg.src = charNormalSrc;
const bakugoAngryImg = new Image();
bakugoAngryImg.src = charAngrySrc;

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  playerX,
  playerDirection,
  characterAction,
  characterSkin = 'giyeong',
  combo = 0,
  fallingItems,
  particles,
  floatingTexts,
  isInvincible,
  screenShake,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number>(0);
  const idleTickRef = useRef<number>(0);

  // Mobile coordinate space: 480 x 800 (Portrait)
  const V_WIDTH = 480;
  const V_HEIGHT = 800;
  const FLOOR_Y = 720;
  const PLAYER_Y = 625;
  const PLAYER_W = 60;
  const PLAYER_H = 95; // slightly taller for big head

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      idleTickRef.current += 0.08;

      ctx.save();

      // Screen shake offset
      let shakeX = 0;
      let shakeY = 0;
      if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 8;
        shakeY = (Math.random() - 0.5) * screenShake * 8;
      }
      ctx.translate(shakeX, shakeY);

      // 1. Pure White Canvas Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // 2. Hand-Drawn Floor Line & Safe Shelter Zones
      drawDoodleFloorWithShelters(ctx, V_WIDTH, FLOOR_Y);

      // 3. Falling Items (똥 & 단어 카드)
      fallingItems.forEach((item) => {
        if (item.type === 'obstacle') {
          drawDoodlePoop(ctx, item.x, item.y, item.width, item.height);
        } else {
          drawDoodleWordCard(ctx, item.text || '', item.x, item.y, item.width, item.height);
        }
      });

      // 4. Big Head Stickman Player (대두 쫄라맨 5종)
      drawBigHeadDoodlePlayer(
        ctx,
        playerX,
        PLAYER_Y,
        PLAYER_W,
        PLAYER_H,
        playerDirection,
        characterAction,
        characterSkin,
        combo,
        isInvincible,
        idleTickRef.current
      );

      // 5. Particles
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color || '#18181b';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.4;
        drawDoodleMiniStar(ctx, p.x, p.y, p.size);
        ctx.restore();
      });

      // 6. Floating Texts
      floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.font = `bold ${ft.size}px 'Gaegu', 'Jua', cursive, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(ft.text, ft.x, ft.y);

        ctx.fillStyle = ft.color === '#facc15' ? '#000000' : ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    playerX,
    playerDirection,
    characterAction,
    characterSkin,
    combo,
    fallingItems,
    particles,
    floatingTexts,
    isInvincible,
    screenShake,
  ]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white select-none">
      <canvas
        ref={canvasRef}
        width={V_WIDTH}
        height={V_HEIGHT}
        className="w-full h-full object-contain"
        style={{ aspectRatio: '480/800' }}
      />
    </div>
  );
};

// ==========================================
// 1. HAND-DRAWN DOODLE FLOOR & SAFE SHELTERS
// ==========================================
function drawDoodleFloorWithShelters(ctx: CanvasRenderingContext2D, width: number, floorY: number) {
  ctx.save();

  // Left Safe Shelter Highlight (x: 0 ~ 72)
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(0, floorY - 3, 72, 70);
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(4, floorY - 2, 64, 60);
  ctx.setLineDash([]);

  // Right Safe Shelter Highlight (x: 408 ~ 480)
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(width - 72, floorY - 3, 72, 70);
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(width - 68, floorY - 2, 64, 60);
  ctx.setLineDash([]);

  // Safe Zone Labels
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️쉼터', 36, floorY + 22);
  ctx.fillText('🛡️쉼터', width - 36, floorY + 22);

  // Main Floor Line
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  // Little doodle dust tick marks
  const ticks = [110, 180, 240, 300, 370];
  ticks.forEach((tx) => {
    ctx.beginPath();
    ctx.moveTo(tx - 4, floorY);
    ctx.lineTo(tx - 1, floorY - 4);
    ctx.moveTo(tx, floorY);
    ctx.lineTo(tx + 2, floorY - 6);
    ctx.moveTo(tx + 5, floorY);
    ctx.lineTo(tx + 7, floorY - 3);
    ctx.stroke();
  });

  ctx.restore();
}

// ==========================================
// 2. HAND-DRAWN DOODLE POOP
// ==========================================
function drawDoodlePoop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.strokeStyle = '#18181b';
  ctx.fillStyle = '#78350f'; // 똥색깔
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Bottom Layer
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, width * 0.45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Middle Layer
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 1, width * 0.36, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Top Swirl
  ctx.fillStyle = '#a16207';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy - 4);
  ctx.quadraticCurveTo(cx - 5, cy - 15, cx + 1, cy - 17);
  ctx.quadraticCurveTo(cx + 6, cy - 20, cx + 3, cy - 23);
  ctx.quadraticCurveTo(cx, cy - 21, cx + 3, cy - 17);
  ctx.quadraticCurveTo(cx + 8, cy - 12, cx + 9, cy - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shine Highlight
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 2, 3.5, 1.0, 2.5);
  ctx.stroke();

  // Cute eyes
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy - 1, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx + 5, cy - 1, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pupils
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(cx - 4.5, cy - 0.5, 1.3, 0, Math.PI * 2);
  ctx.arc(cx + 5.5, cy - 0.5, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// 3. HAND-DRAWN WORD CARD
// ==========================================
function drawDoodleWordCard(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();

  // Drop shadow
  ctx.fillStyle = '#e4e4e7';
  drawDoodleRectPath(ctx, x + 2.5, y + 2.5, width, height, 4);
  ctx.fill();

  // Card Body
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  drawDoodleRectPath(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = '#18181b';
  ctx.font = `bold 19px 'Gaegu', 'Jua', 'Noto Sans KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2 + 1);

  ctx.restore();
}

// ==========================================
// 4. BIG HEAD (대두) DOODLE PLAYER
// 요구사항: "그리고 졸라맨 캐릭터는 대두가 되게 표현해줘. 얼굴이 너무 작아서 안보여."
// 5종 캐릭터:
// 1. giyeong (기영이: 평소 미소 / 피격 시 엉엉 우는 표정)
// 2. pikachu (피카츄: 평소 윙크 / 피격 시 지옥의 피카츄)
// 3. ganadi (가나디: 평소 헤드폰 / 피격 시 우는 표정)
// 4. saitama (원펀맨: 평소 멍 / 피격 시 핏대 분노)
// 5. bakugo (바쿠고: 기존 연출 100% 보존 + 콤보 폭발)
// ==========================================
function drawBigHeadDoodlePlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  dir: 'left' | 'right',
  action: CharacterAction,
  skin: CharacterSkin,
  combo: number,
  isInvincible: boolean,
  idleTick: number
) {
  ctx.save();

  // Invincibility flash after damage
  if (isInvincible && Math.floor(Date.now() / 90) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  const cx = x + width / 2;
  const bottomY = y + height; // floor position

  ctx.translate(cx, bottomY);

  if (dir === 'left') {
    ctx.scale(-1, 1);
  }

  const isRunning = action === 'run-left' || action === 'run-right';
  const isDamaged = action === 'squish' || action === 'wobble';

  // Determine Head Image & Cutout Key based on Skin & State
  let targetImg = giyeongNormalImg;
  let cacheKey = 'giyeong_normal_cutout';

  if (skin === 'giyeong') {
    targetImg = isDamaged ? giyeongCryImg : giyeongNormalImg;
    cacheKey = isDamaged ? 'giyeong_cry_cutout' : 'giyeong_normal_cutout';
  } else if (skin === 'pikachu') {
    targetImg = isDamaged ? pikaHellImg : pikaNormalImg;
    cacheKey = isDamaged ? 'pika_hell_cutout' : 'pika_normal_cutout';
  } else if (skin === 'ganadi') {
    targetImg = isDamaged ? ganadiCryImg : ganadiNormalImg;
    cacheKey = isDamaged ? 'ganadi_cry_cutout' : 'ganadi_normal_cutout';
  } else if (skin === 'saitama') {
    targetImg = isDamaged ? saitamaAngryImg : saitamaNormalImg;
    cacheKey = isDamaged ? 'saitama_angry_cutout' : 'saitama_normal_cutout';
  } else if (skin === 'bakugo') {
    targetImg = isDamaged ? bakugoAngryImg : bakugoNormalImg;
    cacheKey = isDamaged ? 'bakugo_angry_cutout' : 'bakugo_normal_cutout';
  }

  const cutoutCanvas = getCutoutCanvas(targetImg, cacheKey, 230);

  // ==========================================
  // 대두 (BIG HEAD) 크기: 66px x 66px 로 큼직하고 시원하게!
  // ==========================================
  const headW = 66;
  const headH = 66;
  const headX = -headW / 2;
  const headY = -height + 4; // Head sits high

  // Bakugo Combo Max Explosion Effect (3콤보 이상 시 화려한 폭발 구름 & 빨간 빤짝이)
  if (skin === 'bakugo' && combo >= 3) {
    drawComboMaxExplosionEffect(ctx, 0, headY + headH / 2, idleTick, combo);
  }

  // 1. Draw Big Head (누끼 배경 투명화)
  ctx.save();
  if (isDamaged) {
    ctx.rotate(Math.sin(idleTick * 12) * 0.1);
  } else if (isRunning) {
    ctx.rotate(Math.sin(idleTick * 3.5) * 0.05);
  }

  if (cutoutCanvas) {
    ctx.drawImage(cutoutCanvas, headX, headY, headW, headH);
  } else if (targetImg.complete && targetImg.naturalWidth > 0) {
    ctx.drawImage(targetImg, headX, headY, headW, headH);
  } else {
    // Fallback circle
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, headY + headH / 2, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Stickman Body (대두 머리 턱 바로 밑에 깔끔하게 연결되는 날렵한 쫄라맨 몸)
  ctx.strokeStyle = '#18181b';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const spineTop = headY + headH - 6; // connects under the chin
  const spineBottom = spineTop + 24;

  // Spine
  ctx.beginPath();
  ctx.moveTo(0, spineTop);
  ctx.lineTo(0, spineBottom);
  ctx.stroke();

  // Arms
  const shoulderY = spineTop + 5;
  if (action === 'happy' || (skin === 'bakugo' && combo >= 3)) {
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-14, shoulderY - 12);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(14, shoulderY - 12);
    ctx.stroke();

    if (skin === 'bakugo') {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-22, shoulderY - 18, 10, 12);
      ctx.strokeRect(-22, shoulderY - 18, 10, 12);
      ctx.fillRect(12, shoulderY - 18, 10, 12);
      ctx.strokeRect(12, shoulderY - 18, 10, 12);
      drawDoodleMiniStar(ctx, -26, shoulderY - 10, 6);
      drawDoodleMiniStar(ctx, 26, shoulderY - 10, 6);
    }
  } else if (isRunning) {
    const armCycle = Math.sin(idleTick * 3.0);
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-12 * armCycle, shoulderY + 8);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(12 * armCycle, shoulderY + 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-9, shoulderY + 10);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(9, shoulderY + 10);
    ctx.stroke();
  }

  // Legs
  const hipY = spineBottom;
  if (action === 'happy') {
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-7, hipY + 15);
    ctx.moveTo(0, hipY);
    ctx.lineTo(7, hipY + 15);
    ctx.stroke();
  } else if (isRunning) {
    const legCycle = Math.sin(idleTick * 3.4);
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(13 * legCycle, hipY + 10);
    ctx.lineTo(15 * legCycle + 2, hipY + 18);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-13 * legCycle, hipY + 10);
    ctx.lineTo(-15 * legCycle + 2, hipY + 18);
    ctx.stroke();
  } else if (isDamaged) {
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-11, hipY + 16);
    ctx.moveTo(0, hipY);
    ctx.lineTo(11, hipY + 16);
    ctx.stroke();
  } else {
    const idleBob = Math.sin(idleTick) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-7, hipY + 17 + idleBob);
    ctx.moveTo(0, hipY);
    ctx.lineTo(7, hipY + 17 + idleBob);
    ctx.stroke();
  }

  ctx.restore();
}

// ==========================================
// COMBO MAX EXPLOSION & RED SPARKLE EFFECT
// ==========================================
function drawComboMaxExplosionEffect(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tick: number,
  combo: number
) {
  ctx.save();

  const pulse = Math.sin(tick * 3.5) * 6;
  const clouds = [
    { x: -35, y: -20, r: 24 + pulse, color: '#f97316' },
    { x: 35, y: -20, r: 24 + pulse, color: '#f97316' },
    { x: -45, y: 10, r: 22 - pulse * 0.5, color: '#ef4444' },
    { x: 45, y: 10, r: 22 - pulse * 0.5, color: '#ef4444' },
    { x: 0, y: -45, r: 28 + pulse, color: '#eab308' },
    { x: -20, y: -40, r: 20, color: '#dc2626' },
    { x: 20, y: -40, r: 20, color: '#dc2626' },
  ];

  ctx.globalAlpha = 0.85;
  clouds.forEach((c) => {
    ctx.beginPath();
    ctx.fillStyle = c.color;
    ctx.arc(cx + c.x, cy + c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  const sparkles = [
    { x: -55, y: -50, size: 14, color: '#ef4444', rot: tick * 2 },
    { x: 55, y: -50, size: 14, color: '#ef4444', rot: -tick * 2 },
    { x: -65, y: 5, size: 11, color: '#facc15', rot: tick * 3 },
    { x: 65, y: 5, size: 11, color: '#facc15', rot: -tick * 3 },
    { x: -25, y: -70, size: 13, color: '#f97316', rot: tick * 2.5 },
    { x: 25, y: -70, size: 13, color: '#f97316', rot: -tick * 2.5 },
    { x: 0, y: -78, size: 16, color: '#dc2626', rot: tick * 4 },
  ];

  sparkles.forEach((s) => {
    ctx.save();
    ctx.translate(cx + s.x, cy + s.y);
    ctx.rotate(s.rot);
    drawCrossSparkle(ctx, 0, 0, s.size, s.color);
    ctx.restore();
  });

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + tick * 2;
    const dist = 52 + Math.sin(tick * 4 + i) * 12;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#facc15';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`💥 폭발 ${combo}콤보!`, cx, cy - 88);
  ctx.restore();

  ctx.restore();
}

function drawCrossSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x, y, x + size, y);
  ctx.quadraticCurveTo(x, y, x, y + size);
  ctx.quadraticCurveTo(x, y, x - size, y);
  ctx.quadraticCurveTo(x, y, x, y - size);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDoodleRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDoodleMiniStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  const spikes = 5;
  const outerRadius = r;
  const innerRadius = r * 0.45;
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
