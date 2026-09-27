/**
 * 똥 피하기 퀴즈 — 구글 시트 연동 스크립트
 *
 * 이 시트 하나가 세 가지 일을 해요.
 *   - '기록' 탭: 학생이 게임을 끝낼 때마다 한 줄씩 쌓여요.
 *   - '문제' 탭: 여기 적힌 문제가 모든 학생 게임에 나와요.
 *   - '설정' 탭: 단원 이름 (시작 화면과 랭킹에 쓰여요).
 *
 * [처음 설치]
 * 1. 새 구글 시트를 만들고 메뉴 [확장 프로그램] → [Apps Script]를 엽니다.
 * 2. 원래 있던 코드를 모두 지우고, 이 파일 내용을 통째로 붙여넣은 뒤 저장(💾)합니다.
 * 3. 위쪽 함수 선택 칸에서 setup 을 고르고 [▶ 실행] → 권한을 허용합니다.
 *    → '기록', '문제', '설정' 탭이 만들어지고 기본 15문제가 들어가요.
 * 4. [배포] → [새 배포] → 톱니바퀴에서 '웹 앱' 선택
 *      - 다음 사용자 인증 정보로 실행: 나
 *      - 액세스 권한이 있는 사용자: 모든 사용자
 *    → [배포]를 누르고 나오는 '웹 앱 URL'을 복사합니다.
 * 5. 게임 시작 화면 → 선생님 메뉴 → '구글 시트 연결'에 URL을 붙여넣으면 끝!
 *
 * ※ 이 코드를 고쳤다면 [배포] → [배포 관리] → 연필 아이콘 → 버전 '새 버전'으로 다시 배포해야 반영돼요.
 *   (문제·설정 탭 내용을 고치는 건 다시 배포할 필요 없어요.)
 */

var RECORD_SHEET = '기록';
var QUESTION_SHEET = '문제';
var SETTING_SHEET = '설정';

var RECORD_HEADER = ['시간', '이름', '단원', '점수', '맞힌 정답', '최대 콤보', '캐릭터'];
var QUESTION_HEADER = ['문제', '정답', '오답1', '오답2', '오답3'];

var DEFAULT_TITLE = '생식과 유전 (용어 연습)';
var DEFAULT_QUESTIONS = [
  ['사람의 체세포 염색체 수는?', '46개', '23개', '92개', '48개'],
  ['사람의 생식세포(정자, 난자) 염색체 수는?', '23개', '46개', '12개', '92개'],
  ['사람의 상염색체 쌍의 수는?', '22쌍', '23쌍', '44쌍', '1쌍'],
  ['여성의 성염색체 구성은?', 'XX', 'XY', 'YY', 'XO'],
  ['남성의 성염색체 구성은?', 'XY', 'XX', 'YY', 'XZ'],
  ['체세포 분열 결과 만들어지는 딸세포 수는?', '2개', '4개', '1개', '8개'],
  ['감수 분열 결과 만들어지는 딸세포 수는?', '4개', '2개', '1개', '8개'],
  ['DNA와 단백질이 꼬여 세포 분열 시 나타나는 구조는?', '염색체', '엽록체', '미토콘드리아', '세포벽'],
  ['부모와 자손의 염색체 수가 세대를 거듭해도 일정한 이유는?', '감수 분열', '체세포 분열', '삼투 현상', '광합성'],
  ['멘델 유전에서 대립 형질 중 잡종 1대에서 겉으로 드러나는 형질은?', '우성', '열성', '돌연변이', '중성'],
  ['잡종 1대에서 겉으로 드러나지 않고 숨겨지는 형질은?', '열성', '우성', '가성', '진성'],
  ['순종 둥근 완두(RR)와 주름진 완두(rr) 교배 시 잡종 1대 표현형은?', '둥근 완두', '주름진 완두', '반반 완두', '모두 주름짐'],
  ['잡종 2대(Rr x Rr)에서 둥근 완두와 주름진 완두의 분리비는?', '3 : 1', '1 : 1', '9 : 3', '2 : 1'],
  ['모양과 크기가 같고 부모에게서 하나씩 물려받은 한 쌍의 염색체는?', '상동 염색체', '성염색체', '염색분체', '돌연변이체'],
  ['복제된 한 개의 염색체를 이루는 각각의 가닥은?', '염색분체', '상동염색체', '유전자좌', '중심체'],
];

// ─────────────────────────────────────────────
// 웹 앱 입구
// ─────────────────────────────────────────────

/** GET: ?action=questions → 문제 목록 / 그 외 → 랭킹 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'questions') {
    return json_(getQuestions_());
  }
  return json_({ ok: true, ranking: getRanking_(p.chapter || getTitle_()) });
}

/** POST: 게임 기록 한 줄 저장 → 저장 후 랭킹을 돌려줌 */
function doPost(e) {
  var data = {};
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: '잘못된 데이터' });
  }

  var name = clean_(data.nickname, 20);
  if (!name) return json_({ ok: false, error: '이름이 비어 있어요' });
  var chapter = clean_(data.chapter, 60) || getTitle_();

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_(RECORD_SHEET, RECORD_HEADER).appendRow([
      new Date(),
      name,
      chapter,
      num_(data.score, 100000),
      num_(data.correctCount, 10000),
      num_(data.maxCombo, 10000),
      clean_(data.character, 20),
    ]);
  } finally {
    lock.releaseLock();
  }

  return json_({ ok: true, ranking: getRanking_(chapter) });
}

// ─────────────────────────────────────────────
// 처음 한 번 실행: 탭 만들기 + 기본 문제 넣기
// ─────────────────────────────────────────────
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  getSheet_(RECORD_SHEET, RECORD_HEADER);

  var q = getSheet_(QUESTION_SHEET, QUESTION_HEADER);
  // '3 : 1', '1:1' 같은 답이 시간으로 바뀌지 않도록 문제 칸은 '일반 텍스트'로
  q.getRange('A:G').setNumberFormat('@');
  if (q.getLastRow() < 2) {
    q.getRange(2, 1, DEFAULT_QUESTIONS.length, QUESTION_HEADER.length).setValues(DEFAULT_QUESTIONS);
  }
  q.setColumnWidth(1, 420);

  var s = getSheet_(SETTING_SHEET, null);
  if (!String(s.getRange('B1').getValue()).trim()) {
    s.getRange('A1:B1').setValues([['단원 이름', DEFAULT_TITLE]]);
    s.getRange('A1').setFontWeight('bold');
    s.setColumnWidth(2, 300);
  }

  // 비어 있는 기본 탭(시트1) 정리
  ['시트1', 'Sheet1'].forEach(function (n) {
    var sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
}

// ─────────────────────────────────────────────
// 내부 함수
// ─────────────────────────────────────────────

function getQuestions_() {
  var sheet = getSheet_(QUESTION_SHEET, QUESTION_HEADER);
  var rows = sheet.getDataRange().getDisplayValues().slice(1);
  var questions = [];
  rows.forEach(function (r, i) {
    var question = String(r[0] || '').trim();
    var answer = String(r[1] || '').trim();
    if (!question || !answer) return;
    var wrongs = r
      .slice(2)
      .map(function (v) { return String(v || '').trim(); })
      .filter(function (v) { return v && v !== answer; });
    if (!wrongs.length) return;
    questions.push({
      id: 'sheet_' + (i + 2),
      question: question,
      correctAnswer: answer,
      wrongAnswers: wrongs,
    });
  });
  return { ok: true, title: getTitle_(), questions: questions };
}

/** 이름별 최고점만 남겨 점수 높은 순으로 */
function getRanking_(chapter) {
  var sheet = getSheet_(RECORD_SHEET, RECORD_HEADER);
  if (sheet.getLastRow() < 2) return [];
  var rows = sheet.getDataRange().getValues().slice(1);
  var tz = Session.getScriptTimeZone();
  var best = {};
  rows.forEach(function (r) {
    var name = String(r[1] || '').trim();
    if (!name) return;
    if (chapter && String(r[2]) !== chapter) return;
    var score = Number(r[3]) || 0;
    var key = name.toLowerCase();
    if (!best[key] || score > best[key].score) {
      best[key] = {
        nickname: name,
        score: score,
        correctCount: Number(r[4]) || 0,
        maxCombo: Number(r[5]) || 0,
        date: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]),
      };
    }
  });
  return Object.keys(best)
    .map(function (k) { return best[k]; })
    .sort(function (a, b) { return b.score - a.score; });
}

function getTitle_() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTING_SHEET);
  var title = s ? String(s.getRange('B1').getValue()).trim() : '';
  return title || DEFAULT_TITLE;
}

function getSheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (header && sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#fef08a');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** 글자 정리: 길이 제한 + 수식으로 해석되지 않게 */
function clean_(value, maxLen) {
  var s = String(value == null ? '' : value).trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num_(value, max) {
  var n = Math.floor(Number(value) || 0);
  return Math.max(0, Math.min(max, n));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
