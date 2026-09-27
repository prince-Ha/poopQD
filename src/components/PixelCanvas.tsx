import React, { useRef, useEffect } from 'react';
import { FallingItem, Particle, FloatingText, CharacterAction, CharacterSkin } from '../types/game';
import { HEAD_IMAGES } from '../data/heads';
import { drawFeverBackdrop, drawFeverOverlay } from './feverEffects';
import {
  V_WIDTH,
  FLOOR_Y,
  PLAYER_W,
  LEG_LEN,
  SPINE_LEN,
  NECK_FROM_FLOOR,
  HEAD_MAX_W,
  HEAD_MAX_H,
  HEAD_NECK_OVERLAP,
} from '../data/player';

interface PixelCanvasProps {
  playerX: number;
  playerDirection: 'left' | 'right';
  characterAction: CharacterAction;
  characterSkin?: CharacterSkin;
  /** 피버타임 시작 후 지난 시간(초). null이면 피버 아님 */
  feverElapsed: number | null;
  fallingItems: FallingItem[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  isInvincible: boolean;
  screenShake: number;
}

// 얼굴 사진 미리 불러오기 (배경은 이미 투명 PNG)
function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

const HEADS = Object.fromEntries(
  Object.entries(HEAD_IMAGES).map(([skin, src]) => [skin, { normal: loadImage(src.normal), hit: loadImage(src.hit) }])
) as Record<CharacterSkin, { normal: HTMLImageElement; hit: HTMLImageElement }>;

const isReady = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  playerX,
  playerDirection,
  characterAction,
  characterSkin = 'giyeong',
  feverElapsed,
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
  const V_HEIGHT = 800;

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

      // 2-1. 피버 효과 (단어 카드 뒤에 깔아서 글씨가 가려지지 않게)
      if (feverElapsed !== null) {
        const headY = FLOOR_Y - NECK_FROM_FLOOR - HEAD_MAX_H / 2;
        drawFeverBackdrop(ctx, characterSkin, feverElapsed, playerX + PLAYER_W / 2, headY);
      }

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
        playerDirection,
        characterAction,
        characterSkin,
        feverElapsed !== null,
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

      // 7. 피버 테두리 빛 + 'FEVER TIME!' 글자
      if (feverElapsed !== null) drawFeverOverlay(ctx, characterSkin, feverElapsed);

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
    feverElapsed,
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
// - 얼굴은 선생님이 준 사진을 비율 그대로 그림 (늘이거나 좌우 반전하지 않음)
// - 얼굴 아래쪽이 목을 살짝 덮어서 몸과 붙어 보이게 함
// - 흔들림·기울기는 머리+몸 전체에 한꺼번에 적용 → 얼굴과 몸이 떨어지지 않음
// ==========================================
function drawBigHeadDoodlePlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  dir: 'left' | 'right',
  action: CharacterAction,
  skin: CharacterSkin,
  isFever: boolean,
  isInvincible: boolean,
  idleTick: number
) {
  ctx.save();

  // Invincibility flash after damage
  if (isInvincible && Math.floor(Date.now() / 90) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  const isRunning = action === 'run-left' || action === 'run-right';
  const isDamaged = action === 'squish' || action === 'wobble';

  // 발끝(바닥 중앙)을 원점으로
  ctx.translate(x + PLAYER_W / 2, FLOOR_Y);

  // 몸 전체 동작
  if (isDamaged) {
    ctx.translate(Math.sin(idleTick * 14) * 2.5, 0); // 작게 부르르
  } else if (isRunning) {
    ctx.rotate((dir === 'left' ? -1 : 1) * 0.05); // 달리는 쪽으로 살짝 기울기
  }

  // 얼굴 크기: 캐릭터마다 '평소' 사진 기준으로 배율을 정해서, 맞았을 때 사진도 같은 배율로
  const head = HEADS[skin];
  const img = isDamaged ? head.hit : head.normal;
  const scale = isReady(head.normal)
    ? Math.min(HEAD_MAX_W / head.normal.naturalWidth, HEAD_MAX_H / head.normal.naturalHeight)
    : 0;
  const headW = scale && isReady(img) ? img.naturalWidth * scale : 56;
  const headH = scale && isReady(img) ? img.naturalHeight * scale : 56;

  const neckY = -NECK_FROM_FLOOR;
  const headBottom = neckY + HEAD_NECK_OVERLAP;
  const headTop = headBottom - headH;

  // 1. 몸 (방향에 따라 몸만 좌우 반전)
  ctx.save();
  if (dir === 'left') ctx.scale(-1, 1);
  drawStickBody(ctx, neckY, action, skin, isFever, isRunning, isDamaged, idleTick);
  ctx.restore();

  // 2. 얼굴 (몸 위에 덮어 그림)
  if (scale && isReady(img)) {
    ctx.drawImage(img, -headW / 2, headTop, headW, headH);
  } else {
    // 사진 불러오기 전 임시 동그라미
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, headTop + headH / 2, headH / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// 졸라맨 몸통·팔·다리 (원점 = 발끝, 위로 갈수록 y가 음수)
function drawStickBody(
  ctx: CanvasRenderingContext2D,
  neckY: number,
  action: CharacterAction,
  skin: CharacterSkin,
  isFever: boolean,
  isRunning: boolean,
  isDamaged: boolean,
  idleTick: number
) {
  ctx.strokeStyle = '#18181b';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const spineTop = neckY;
  const hipY = spineTop + SPINE_LEN; // = -LEG_LEN

  // Spine
  ctx.beginPath();
  ctx.moveTo(0, spineTop);
  ctx.lineTo(0, hipY);
  ctx.stroke();

  // Arms
  const shoulderY = spineTop + 8;
  // 바쿠고는 피버 동안 수류탄 장갑 만세
  if (action === 'happy' || (skin === 'bakugo' && isFever)) {
    // 만세: 큰 얼굴에 가리지 않게 옆으로 벌려 올림
    const handX = 22;
    const handY = shoulderY - 8;
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-handX, handY);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    if (skin === 'bakugo') {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-handX - 5, handY - 6, 10, 12);
      ctx.strokeRect(-handX - 5, handY - 6, 10, 12);
      ctx.fillRect(handX - 5, handY - 6, 10, 12);
      ctx.strokeRect(handX - 5, handY - 6, 10, 12);
      drawDoodleMiniStar(ctx, -handX - 9, handY + 2, 6);
      drawDoodleMiniStar(ctx, handX + 9, handY + 2, 6);
    }
  } else if (isRunning) {
    const armCycle = Math.sin(idleTick * 3.0);
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-12 * armCycle, shoulderY + 8);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(12 * armCycle, shoulderY + 8);
    ctx.stroke();
  } else if (isDamaged) {
    // 맞았을 때: 팔을 옆으로 번쩍
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-13, shoulderY - 4);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(13, shoulderY - 4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-9, shoulderY + 10);
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(9, shoulderY + 10);
    ctx.stroke();
  }

  // Legs (발끝이 바닥 y=0 에 닿게)
  if (action === 'happy') {
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-7, 0);
    ctx.moveTo(0, hipY);
    ctx.lineTo(7, 0);
    ctx.stroke();
  } else if (isRunning) {
    const legCycle = Math.sin(idleTick * 3.4);
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(13 * legCycle, hipY + LEG_LEN * 0.55);
    ctx.lineTo(15 * legCycle + 2, 0);
    ctx.moveTo(0, hipY);
    ctx.lineTo(-13 * legCycle, hipY + LEG_LEN * 0.55);
    ctx.lineTo(-15 * legCycle + 2, 0);
    ctx.stroke();
  } else if (isDamaged) {
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-11, 0);
    ctx.moveTo(0, hipY);
    ctx.lineTo(11, 0);
    ctx.stroke();
  } else {
    const idleBob = Math.sin(idleTick) * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-7, idleBob);
    ctx.moveTo(0, hipY);
    ctx.lineTo(7, idleBob);
    ctx.stroke();
  }
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
