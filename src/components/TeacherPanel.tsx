import React, { useEffect, useState } from 'react';
import {
  X,
  QrCode,
  Link2,
  Unlink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Download,
  Lock,
  BookOpen,
} from 'lucide-react';
import { QuizQuestion } from '../types/game';
import { TEST_TIME_LIMIT } from '../config';
import { extractSheetId } from '../utils/sheet';
import scriptCode from '../../google-apps-script/Code.gs?raw';

export type QuizSource = 'sheet' | 'cache' | 'default';

interface TeacherPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string | null;
  onConnectSheet: (id: string) => Promise<{ ok: boolean; message: string }>;
  onTestSheetSave: () => Promise<{ ok: boolean; message: string }>;
  onDisconnectSheet: () => void;
  quizTitle: string;
  questions: QuizQuestion[];
  quizSource: QuizSource;
  isQuizLoading: boolean;
  onReloadQuiz: () => void;
  onOpenQR: () => void;
  onStartTestPlay: () => void;
  onExportCSV: () => boolean;
  onLock: () => void;
}

const SOURCE_LABEL: Record<QuizSource, string> = {
  sheet: '구글 시트에서 불러옴',
  cache: '인터넷 연결 실패 → 마지막으로 불러온 시트 문제 사용 중',
  default: '기본 문제 (시트 연결 전)',
};

const sectionClass = 'bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-3 space-y-2 shadow-[2px_2px_0px_#18181b]';
const smallBtn =
  'flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-zinc-900 text-xs font-doodle font-bold shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50';

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  isOpen,
  onClose,
  sheetId,
  onConnectSheet,
  onTestSheetSave,
  onDisconnectSheet,
  quizTitle,
  questions,
  quizSource,
  isQuizLoading,
  onReloadQuiz,
  onOpenQR,
  onStartTestPlay,
  onExportCSV,
  onLock,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [connectMsg, setConnectMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaveTesting, setIsSaveTesting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrlInput('');
      setConnectMsg(null);
      setCsvMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    const id = extractSheetId(urlInput);
    if (!id) {
      setConnectMsg({ ok: false, text: "주소 형식이 달라요. '웹 앱 URL'(…/exec 로 끝나는 주소)을 붙여넣어 주세요." });
      return;
    }
    setIsConnecting(true);
    setConnectMsg(null);
    const result = await onConnectSheet(id);
    setIsConnecting(false);
    setConnectMsg({ ok: result.ok, text: result.message });
    if (result.ok) setUrlInput('');
  };

  const handleTestSave = async () => {
    setIsSaveTesting(true);
    setConnectMsg(null);
    const result = await onTestSheetSave();
    setIsSaveTesting(false);
    setConnectMsg({ ok: result.ok, text: result.message });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode).then(() => {
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleExport = () => {
    setCsvMsg(onExportCSV() ? null : '이 기기에 저장된 기록이 없어요.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[92dvh] flex flex-col bg-white border-3 border-zinc-900 rounded-3xl shadow-[5px_5px_0px_#18181b] text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b-2 border-zinc-200">
          <h2 className="text-xl font-doodle font-bold">👩‍🏫 선생님 메뉴</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b]"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 1. QR */}
          <button
            onClick={onOpenQR}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-yellow-300 hover:bg-yellow-400 border-3 border-zinc-900 font-doodle font-bold text-base shadow-[3px_3px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px]"
          >
            <QrCode className="w-5 h-5" />
            <span>수업용 QR 띄우기</span>
          </button>
          {!sheetId && (
            <p className="text-[11px] text-amber-700 font-doodle -mt-1 px-1">
              ⚠️ 구글 시트를 먼저 연결해야 학생 기록이 반 전체 랭킹으로 모여요.
            </p>
          )}

          {/* 2. Google Sheet */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-doodle font-bold">📊 구글 시트 연결</span>
              <span
                className={`text-[11px] font-doodle font-bold px-2 py-0.5 rounded-full border border-zinc-900 ${
                  sheetId ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {sheetId ? '연결됨 ✓' : '연결 안 됨'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-600 font-doodle leading-relaxed">
              시트 하나로 <b>기록 모으기 · 반 전체 랭킹 · 문제 관리</b>를 해요. 연결하면 수업용 QR에 시트 정보가 함께 담겨
              학생 폰에도 자동으로 연결돼요.
            </p>

            <div className="flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/…/exec"
                className="flex-1 min-w-0 bg-white border-2 border-zinc-900 rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={!urlInput.trim() || isConnecting}
                className={`${smallBtn} bg-zinc-900 text-white`}
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{sheetId ? '바꾸기' : '연결'}</span>
              </button>
            </div>
            {connectMsg && (
              <p className={`text-[11px] font-doodle font-bold ${connectMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                {connectMsg.text}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <button onClick={handleCopyCode} className={`${smallBtn} bg-white`}>
                {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? '복사됨!' : '시트용 스크립트 코드 복사'}</span>
              </button>
              {sheetId && (
                <button onClick={handleTestSave} disabled={isSaveTesting} className={`${smallBtn} bg-white`}>
                  {isSaveTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🧪</span>}
                  <span>시트 저장 테스트</span>
                </button>
              )}
              {sheetId && (
                <button
                  onClick={() => {
                    if (confirm('이 기기에서 구글 시트 연결을 끊을까요? (시트의 기록은 그대로 남아요)')) onDisconnectSheet();
                  }}
                  className={`${smallBtn} bg-white text-red-600`}
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>연결 끊기</span>
                </button>
              )}
            </div>

            <details className="text-[11px] font-doodle text-zinc-700">
              <summary className="cursor-pointer font-bold text-zinc-900">처음 설정하는 방법 (5단계)</summary>
              <ol className="list-decimal pl-5 mt-1.5 space-y-1 leading-relaxed">
                <li>새 구글 시트 → 메뉴 [확장 프로그램] → [Apps Script]</li>
                <li>원래 코드를 지우고, 위 버튼으로 복사한 코드를 붙여넣고 저장</li>
                <li>
                  함수 칸에서 <b>setup</b> 선택 → [▶ 실행] → 권한 허용 ('기록', '문제', '설정' 탭이 생겨요)
                </li>
                <li>
                  [배포] → [새 배포] → 유형 <b>웹 앱</b>, 실행: <b>나</b>, 액세스: <b>모든 사용자</b> → 배포
                </li>
                <li>나온 '웹 앱 URL'을 위 칸에 붙여넣고 [연결]</li>
              </ol>
              <p className="mt-1.5 text-zinc-500">
                학교 계정에서 '모든 사용자'가 안 보이면 개인 Gmail 계정으로 만들어 주세요.
              </p>
            </details>
          </div>

          {/* 3. Questions */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-doodle font-bold flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> 문제 {questions.length}개
              </span>
              <button onClick={onReloadQuiz} disabled={!sheetId || isQuizLoading} className={`${smallBtn} bg-white`}>
                <RefreshCw className={`w-3.5 h-3.5 ${isQuizLoading ? 'animate-spin' : ''}`} />
                <span>시트에서 다시 불러오기</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 font-doodle">
              단원: <b>{quizTitle}</b> · {SOURCE_LABEL[quizSource]}
            </p>
            <p className="text-[11px] text-zinc-500 font-doodle">
              문제는 구글 시트 '문제' 탭에서, 단원 이름은 '설정' 탭에서 고쳐요. 학생은 게임을 새로 열면 바뀐 문제를 받아요.
            </p>
            <details className="text-[11px] font-doodle">
              <summary className="cursor-pointer font-bold text-zinc-900">문제 미리보기</summary>
              <ol className="mt-1.5 space-y-1 max-h-48 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <li key={q.id} className="bg-white border border-zinc-300 rounded-lg p-1.5">
                    <div className="font-bold text-zinc-900">
                      {i + 1}. {q.question}
                    </div>
                    <div className="text-emerald-700">✓ {q.correctAnswer}</div>
                    <div className="text-red-600">✗ {q.wrongAnswers.join(', ')}</div>
                  </li>
                ))}
              </ol>
            </details>
          </div>

          {/* 4. Test play & CSV */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onStartTestPlay}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 border-2 border-zinc-900 font-doodle font-bold shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span className="flex items-center gap-1 text-sm">
                <Zap className="w-4 h-4 text-amber-500" /> {TEST_TIME_LIMIT}초 테스트
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">기록이 남지 않아요</span>
            </button>
            <button
              onClick={handleExport}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl bg-white hover:bg-zinc-50 border-2 border-zinc-900 font-doodle font-bold shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span className="flex items-center gap-1 text-sm">
                <Download className="w-4 h-4" /> 기록 CSV
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">이 기기에서 한 게임만</span>
            </button>
          </div>
          {csvMsg && <p className="text-[11px] text-zinc-600 font-doodle text-center">{csvMsg}</p>}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t-2 border-zinc-200">
          <button
            onClick={onLock}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 text-xs font-doodle font-bold"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>선생님 메뉴 잠그기 (학생에게 기기를 넘길 때)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
