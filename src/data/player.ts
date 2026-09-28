// 졸라맨 크기·위치 (게임 판정과 그림이 같은 값을 쓰도록 한 곳에 모음)
// 좌표계: 캔버스 480 x 800, 아래로 갈수록 y가 커짐

export const V_WIDTH = 480;
export const FLOOR_Y = 720;

/** 캐릭터가 차지하는 가로 폭 (이동 범위·충돌 판정 기준) */
export const PLAYER_W = 60;
export const PLAYER_START_X = (V_WIDTH - PLAYER_W) / 2;

/** 몸 길이: 발끝 → 엉덩이 → 목 */
export const LEG_LEN = 20;
export const SPINE_LEN = 28;
export const NECK_FROM_FLOOR = LEG_LEN + SPINE_LEN;

/** 얼굴 사진이 들어갈 최대 크기 (비율은 그대로 두고 이 틀 안에 맞춤) */
export const HEAD_MAX_W = 78;
export const HEAD_MAX_H = 70;
/** 얼굴 아래쪽이 목을 이만큼 덮어서, 얼굴과 몸이 붙어 보이게 함 */
export const HEAD_NECK_OVERLAP = 6;

/** 충돌 판정 상자: 머리카락 끝은 빼고 얼굴~발 */
export const HITBOX = {
  offsetX: 10,
  width: PLAYER_W - 20,
  top: FLOOR_Y - NECK_FROM_FLOOR - HEAD_MAX_H * 0.7,
  bottom: FLOOR_Y - 2,
};

/** 점수 글자 등이 뜨는 높이 (머리 위) */
export const PLAYER_TEXT_Y = FLOOR_Y - NECK_FROM_FLOOR - HEAD_MAX_H - 10;

/** 양 끝 쉼터 폭: 여기에는 단어 카드도 똥도 떨어지지 않음 (문제 읽고 생각하는 안전지대) */
export const SHELTER_W = 72;
/** 카드·똥이 떨어지는 가운데 구역 (쉼터에서 10px 더 띄움, 큰 얼굴이 살짝 삐져나와도 안 닿게) */
export const DROP_MIN_X = SHELTER_W + 10;
export const DROP_MAX_X = V_WIDTH - SHELTER_W - 10;
