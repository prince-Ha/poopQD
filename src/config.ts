// 선생님이 바꿀 수 있는 설정 모음

/**
 * 선생님 메뉴 비밀번호 (숫자 4자리).
 * 학생이 실수로 선생님 버튼을 누르지 않게 막는 '잠금'일 뿐, 보안 장치는 아니에요.
 */
export const TEACHER_PIN = '6666';

/**
 * 구글 시트 웹 앱 ID (https://script.google.com/macros/s/<여기>/exec 의 <여기> 부분).
 * 비워 두어도 선생님 메뉴에서 연결하면 수업용 QR에 함께 담겨 학생들에게 전달돼요.
 */
export const DEFAULT_SHEET_ID = 'AKfycbzl0xU7Zp-J4htUUxAaYzxH6eWIXQYQbqakwTTL5i5X-WUo9bFOyxpELUVF14oTXXkg';

/** 학생 플레이 시간 (초) */
export const STUDENT_TIME_LIMIT = 300;

/** 선생님 테스트 플레이 시간 (초) — 기록이 남지 않아요 */
export const TEST_TIME_LIMIT = 20;

/** 연속 정답 이만큼이면 피버타임 */
export const FEVER_COMBO = 5;

/** 피버타임 길이 (초) — 이 동안 똥에 맞아도 무적 */
export const FEVER_DURATION = 5;
