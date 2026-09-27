// 피버타임 효과 (캐릭터별)
// - 매 프레임 '피버 시작 후 지난 시간(t)'만으로 그림 → 따로 기억할 상태가 없음
// - 같은 번호(i)의 효과는 늘 같은 난수를 쓰도록 seededRand 사용 (프레임마다 모양이 튀지 않게)
import { CharacterSkin } from '../types/game';
import { V_WIDTH, FLOOR_Y } from '../data/player';
import ganadiFeverSrc from '../assets/heads/ganadi_fever.png';

const V_HEIGHT = 800;

const ganadiSprite = new Image();
ganadiSprite.src = ganadiFeverSrc;

/** 0~1 사이 고정 난수 (i번째 효과의 k번째 값) */
function seededRand(i: number, k: number): number {
  const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
}

/** interval초마다 하나씩 생겨서 life초 동안 사는 효과들을 돌며 draw 호출 */
function forEachSpawn(
  t: number,
  interval: number,
  life: number,
  draw: (i: number, age: number, progress: number) => void
) {
  const last = Math.floor(t / interval);
  const first = Math.max(0, Math.floor((t - life) / interval));
  for (let i = first; i <= last; i++) {
    const age = t - i * interval;
    if (age < 0 || age > life) continue;
    draw(i, age, age / life);
  }
}

const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

// ctx.roundRect는 오래된 폰 브라우저에 없어서 직접 그림
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 캐릭터별 피버 분위기 색 (화면 가장자리 빛, 글자)
const FEVER_COLORS: Record<CharacterSkin, { glow: string; text: string }> = {
  ganadi: { glow: '#f9a8d4', text: '#db2777' },
  giyeong: { glow: '#fde047', text: '#ca8a04' },
  bakugo: { glow: '#fb923c', text: '#dc2626' },
  pikachu: { glow: '#facc15', text: '#a16207' },
  saitama: { glow: '#ef4444', text: '#b91c1c' },
};

/** 단어 카드 뒤에 깔리는 효과 (카드 글씨가 가려지지 않게) */
export function drawFeverBackdrop(
  ctx: CanvasRenderingContext2D,
  skin: CharacterSkin,
  t: number,
  playerCenterX: number,
  headY: number
) {
  ctx.save();
  switch (skin) {
    case 'ganadi':
      drawGanadiParty(ctx, t, playerCenterX, headY);
      break;
    case 'giyeong':
      drawBananaStorm(ctx, t, playerCenterX, headY);
      break;
    case 'bakugo':
      drawExplosionFlashes(ctx, t);
      break;
    case 'pikachu':
      drawLightning(ctx, t, playerCenterX, headY);
      break;
    case 'saitama':
      drawSeriousPunches(ctx, t, playerCenterX, headY);
      break;
  }
  ctx.restore();
}

/** 맨 위에 덮는 것: 화면 테두리 빛 + 시작할 때 'FEVER TIME!' 글자 */
export function drawFeverOverlay(ctx: CanvasRenderingContext2D, skin: CharacterSkin, t: number) {
  const colors = FEVER_COLORS[skin];
  ctx.save();

  // 테두리 빛 (두근두근)
  const pulse = 0.55 + Math.sin(t * 10) * 0.25;
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = colors.glow;
  ctx.lineWidth = 14;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 24;
  ctx.strokeRect(7, 7, V_WIDTH - 14, V_HEIGHT - 14);
  ctx.shadowBlur = 0;

  // 시작 1.1초 동안 큰 글자
  if (t < 1.1) {
    const p = Math.min(1, t / 0.35);
    const scale = easeOutBack(p);
    const alpha = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.3;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(V_WIDTH / 2, 330);
    ctx.rotate(-0.08);
    ctx.scale(scale, scale);
    ctx.font = `bold 58px 'Jua', 'Gaegu', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#18181b';
    ctx.strokeText('FEVER TIME!', 0, 0);
    ctx.fillStyle = colors.glow;
    ctx.fillText('FEVER TIME!', 0, 0);
    ctx.font = `bold 24px 'Jua', 'Gaegu', sans-serif`;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('똥 무적!', 0, 48);
    ctx.fillStyle = colors.text;
    ctx.fillText('똥 무적!', 0, 48);
  }
  ctx.restore();
}

// ==========================================
// 가나디: 귀여운 가나디가 팡팡 튀어나옴
// ==========================================
function drawGanadiParty(ctx: CanvasRenderingContext2D, t: number, px: number, headY: number) {
  // 연분홍 배경
  ctx.fillStyle = 'rgba(253, 226, 236, 0.45)';
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  if (!(ganadiSprite.complete && ganadiSprite.naturalWidth > 0)) return;
  const aspect = ganadiSprite.naturalWidth / ganadiSprite.naturalHeight;
  const gravity = 950;

  forEachSpawn(t, 0.08, 1.5, (i, age, progress) => {
    // 3번에 1번은 캐릭터 머리에서, 나머지는 바닥 여기저기서 튀어나옴
    const fromPlayer = i % 3 === 0;
    const x0 = fromPlayer ? px : 30 + seededRand(i, 1) * (V_WIDTH - 60);
    const y0 = fromPlayer ? headY : FLOOR_Y;
    const vx = (seededRand(i, 2) - 0.5) * (fromPlayer ? 560 : 260);
    const vy = -(460 + seededRand(i, 3) * 420);
    const x = x0 + vx * age;
    const y = y0 + vy * age + 0.5 * gravity * age * age;

    const h = 66 + seededRand(i, 4) * 40;
    const pop = age < 0.18 ? easeOutBack(age / 0.18) : 1;
    const squash = 1 + Math.sin(age * 18) * 0.06;
    const rot = (seededRand(i, 5) - 0.5) * 0.7 + Math.sin(age * 7 + i) * 0.18;

    ctx.save();
    ctx.globalAlpha = progress > 0.75 ? (1 - progress) / 0.25 : 1;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(pop / squash, pop * squash);
    ctx.drawImage(ganadiSprite, (-h * aspect) / 2, -h / 2, h * aspect, h);
    ctx.restore();
  });
}

// ==========================================
// 기영이: 바나나가 사방으로 흩뿌려짐
// ==========================================
function drawBanana(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 초승달 모양 몸통
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.12);
  ctx.quadraticCurveTo(0, s * 0.5, s * 0.5, -s * 0.12);
  ctx.quadraticCurveTo(0, s * 0.2, -s * 0.5, -s * 0.12);
  ctx.closePath();
  ctx.fillStyle = '#fde047';
  ctx.fill();
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 윤기
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.08);
  ctx.quadraticCurveTo(0, s * 0.27, s * 0.22, s * 0.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 양 끝 꼭지
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(-s * 0.5, -s * 0.12, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.48, -s * 0.1);
  ctx.lineTo(s * 0.6, -s * 0.24);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawBananaStorm(ctx: CanvasRenderingContext2D, t: number, px: number, headY: number) {
  // 하늘색 배경 + 퍼지는 빛줄기
  ctx.fillStyle = 'rgba(186, 230, 253, 0.5)';
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
  ctx.save();
  ctx.translate(px, headY);
  ctx.rotate(t * 0.4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let k = 0; k < 10; k++) {
    ctx.rotate((Math.PI * 2) / 10);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(900, -70);
    ctx.lineTo(900, 70);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 위에서 우수수
  forEachSpawn(t, 0.09, 3.2, (i, age) => {
    const x = 20 + seededRand(i, 1) * (V_WIDTH - 40) + Math.sin(age * 2 + i) * 20;
    const y = -40 + (230 + seededRand(i, 2) * 200) * age;
    const s = 34 + seededRand(i, 3) * 26;
    drawBanana(ctx, x, y, s, age * (seededRand(i, 4) - 0.5) * 8 + i);
  });

  // 캐릭터 주변에서 팡 퍼짐
  forEachSpawn(t, 0.07, 1.3, (i, age, progress) => {
    const angle = -Math.PI * (0.05 + seededRand(i, 5) * 0.9); // 위쪽 반원
    const speed = 380 + seededRand(i, 6) * 360;
    const x = px + Math.cos(angle) * speed * age;
    const y = headY + Math.sin(angle) * speed * age + 260 * age * age;
    const s = 30 + seededRand(i, 7) * 22;
    ctx.save();
    ctx.globalAlpha = progress > 0.8 ? (1 - progress) / 0.2 : 1;
    drawBanana(ctx, x, y, s, age * 9 * (seededRand(i, 8) > 0.5 ? 1 : -1));
    ctx.restore();
  });
}

// ==========================================
// 바쿠고: 노랑·빨강 폭발 섬광
// ==========================================
function drawCrossGlint(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.globalAlpha = alpha;
  for (const horizontal of [true, false]) {
    const g = horizontal
      ? ctx.createLinearGradient(-size, 0, size, 0)
      : ctx.createLinearGradient(0, -size, 0, size);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    if (horizontal) ctx.fillRect(-size, -2.5, size * 2, 5);
    else ctx.fillRect(-2.5, -size, 5, size * 2);
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.35);
  core.addColorStop(0, 'rgba(255,255,255,0.95)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExplosionFlashes(ctx: CanvasRenderingContext2D, t: number) {
  // 폭발 구름: 커지면서 사라짐
  forEachSpawn(t, 0.1, 0.75, (i, _age, progress) => {
    const x = seededRand(i, 1) * V_WIDTH;
    const y = 140 + seededRand(i, 2) * 560;
    const r = (70 + seededRand(i, 3) * 90) * (0.35 + 0.65 * easeOutCubic(Math.min(1, progress * 2.2)));
    const alpha = progress < 0.4 ? 0.9 : 0.9 * (1 - (progress - 0.4) / 0.6);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255, 253, 208, ${alpha})`);
    g.addColorStop(0.3, `rgba(253, 224, 71, ${alpha})`);
    g.addColorStop(0.6, `rgba(249, 115, 22, ${alpha * 0.9})`);
    g.addColorStop(0.85, `rgba(239, 68, 68, ${alpha * 0.8})`);
    g.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 반짝 십자 섬광
  const glintColors = ['rgba(250, 204, 21, 0.95)', 'rgba(239, 68, 68, 0.9)', 'rgba(249, 115, 22, 0.95)'];
  forEachSpawn(t, 0.05, 0.4, (i, _age, progress) => {
    const x = seededRand(i, 4) * V_WIDTH;
    const y = 120 + seededRand(i, 5) * 600;
    const size = (35 + seededRand(i, 6) * 75) * (0.6 + 0.4 * Math.sin(progress * Math.PI));
    drawCrossGlint(ctx, x, y, size, glintColors[i % 3], Math.sin(progress * Math.PI));
  });

  // 반짝이 가루
  ctx.fillStyle = '#facc15';
  for (let k = 0; k < 40; k++) {
    const x = seededRand(k, 7) * V_WIDTH + Math.sin(t * 3 + k) * 10;
    const y = 120 + seededRand(k, 8) * 600 + Math.cos(t * 2.5 + k) * 10;
    if ((Math.floor(t * 12) + k) % 3 === 0) continue;
    ctx.fillRect(x, y, 3, 3);
  }
}

// ==========================================
// 피카츄: 번개 지지직
// ==========================================
function boltPath(i: number, x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const n = 10 + Math.floor(seededRand(i, 9) * 5);
  const pts: [number, number][] = [[x0, y0]];
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  for (let k = 1; k < n; k++) {
    const p = k / n;
    const off = (seededRand(i, 20 + k) - 0.5) * 70;
    pts.push([x0 + (x1 - x0) * p + nx * off, y0 + (y1 - y0) * p + ny * off]);
  }
  pts.push([x1, y1]);
  return pts;
}

function strokeBolt(ctx: CanvasRenderingContext2D, pts: [number, number][], width: number) {
  ctx.beginPath();
  pts.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'round';
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)';
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = width * 0.35;
  ctx.stroke();
}

function drawLightning(ctx: CanvasRenderingContext2D, t: number, px: number, headY: number) {
  // 어두운 하늘
  ctx.fillStyle = 'rgba(17, 16, 36, 0.62)';
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  forEachSpawn(t, 0.1, 0.24, (i, age) => {
    // 깜빡깜빡
    if (Math.floor(age * 45) % 3 === 2) return;
    const x0 = 30 + seededRand(i, 1) * (V_WIDTH - 60);
    const toPlayer = i % 3 === 0;
    const x1 = toPlayer ? px + (seededRand(i, 2) - 0.5) * 40 : 30 + seededRand(i, 3) * (V_WIDTH - 60);
    const y1 = toPlayer ? headY - 30 : 300 + seededRand(i, 4) * (FLOOR_Y - 320);
    const pts = boltPath(i, x0, 0, x1, y1);
    strokeBolt(ctx, pts, 9);
    // 곁가지
    const mid = pts[Math.floor(pts.length / 2)];
    const branch = boltPath(i + 1000, mid[0], mid[1], mid[0] + (seededRand(i, 5) - 0.5) * 220, mid[1] + 90 + seededRand(i, 6) * 120);
    strokeBolt(ctx, branch.slice(0, 7), 5);

    // 번개 칠 때 화면 번쩍
    if (age < 0.05) {
      ctx.fillStyle = 'rgba(255, 255, 230, 0.35)';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }
  });

  // 캐릭터 주변 지지직
  const seed = Math.floor(t * 16);
  ctx.save();
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    const angle = seededRand(seed, k) * Math.PI * 2;
    const r0 = 40 + seededRand(seed, k + 10) * 10;
    let x = px + Math.cos(angle) * r0;
    let y = headY + Math.sin(angle) * r0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += Math.cos(angle) * 10 + (seededRand(seed, k * 10 + s + 30) - 0.5) * 14;
      y += Math.sin(angle) * 10 + (seededRand(seed, k * 10 + s + 60) - 0.5) * 14;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ==========================================
// 사이타마: 빨간 장갑 주먹 연타 (진심 시리즈 연속 보통 펀치)
// ==========================================
function drawRedGloveFist(ctx: CanvasRenderingContext2D, s: number) {
  // 오른쪽(+x)을 향한 주먹
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.5;

  // 소매(장갑 목)
  ctx.fillStyle = '#991b1b';
  roundRectPath(ctx, -s * 0.95, -s * 0.3, s * 0.45, s * 0.6, s * 0.08);
  ctx.fill();
  ctx.stroke();

  // 주먹
  ctx.fillStyle = '#ef4444';
  roundRectPath(ctx, -s * 0.58, -s * 0.46, s * 1.1, s * 0.92, s * 0.34);
  ctx.fill();
  ctx.stroke();

  // 손가락 마디
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const y = -s * 0.24 + k * s * 0.22;
    ctx.beginPath();
    ctx.moveTo(s * 0.18, y);
    ctx.quadraticCurveTo(s * 0.38, y + s * 0.02, s * 0.46, y + s * 0.1);
    ctx.stroke();
  }
  // 엄지
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.2);
  ctx.quadraticCurveTo(s * 0.05, s * 0.34, s * 0.2, s * 0.18);
  ctx.stroke();

  // 광택
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.12, s * 0.22, Math.PI * 1.1, Math.PI * 1.6);
  ctx.stroke();
}

function drawSeriousPunches(ctx: CanvasRenderingContext2D, t: number, px: number, headY: number) {
  // 푸른 배경
  const bg = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
  bg.addColorStop(0, 'rgba(30, 64, 175, 0.4)');
  bg.addColorStop(1, 'rgba(59, 130, 246, 0.18)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  forEachSpawn(t, 0.045, 0.42, (i, _age, progress) => {
    // 캐릭터에서 사방(위쪽)으로 주먹이 뻗어 나감
    const angle = -Math.PI * (0.15 + seededRand(i, 1) * 0.7);
    const dist = 150 + seededRand(i, 2) * 260;
    const reach = easeOutCubic(Math.min(1, progress * 1.6));
    const x = px + Math.cos(angle) * dist * reach;
    const y = headY - 10 + Math.sin(angle) * dist * reach;
    const s = (44 + seededRand(i, 3) * 28) * (0.7 + 0.5 * reach);

    ctx.save();
    ctx.globalAlpha = progress > 0.7 ? (1 - progress) / 0.3 : 1;
    ctx.translate(x, y);
    ctx.rotate(angle);

    // 속도선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(-s * 1.05, k * s * 0.28);
      ctx.lineTo(-s * (1.6 + seededRand(i, 4 + k) * 0.9), k * s * 0.28);
      ctx.stroke();
    }
    drawRedGloveFist(ctx, s);

    // 끝까지 뻗었을 때 '팡!'
    if (reach > 0.95) {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const r = k % 2 === 0 ? s * 0.55 : s * 0.25;
        const a = (k / 16) * Math.PI * 2;
        const bx = s * 0.75 + Math.cos(a) * r;
        const by = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(bx, by);
        else ctx.lineTo(bx, by);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}
