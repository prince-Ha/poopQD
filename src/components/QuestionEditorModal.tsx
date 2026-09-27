import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { ScienceChapter, QuizQuestion } from '../types/game';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ScienceChapter[];
  onSaveChapters: (chapters: ScienceChapter[]) => void;
  onResetDefaults: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  chapters,
  onSaveChapters,
  onResetDefaults,
}) => {
  const [selectedChapId, setSelectedChapId] = useState<string>(chapters[0]?.id || 'bio-genetics');
  const [localChapters, setLocalChapters] = useState<ScienceChapter[]>(chapters);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalChapters(chapters);
      setSelectedChapId(chapters[0]?.id || 'bio-genetics');
    }
  }, [isOpen, chapters]);

  if (!isOpen) return null;

  const currentChapter = localChapters.find((c) => c.id === selectedChapId) || localChapters[0];

  const handleUpdateQuestion = (qIndex: number, field: keyof QuizQuestion, value: string | string[]) => {
    const updatedChaps = localChapters.map((ch) => {
      if (ch.id !== currentChapter.id) return ch;
      const newQuestions = [...ch.questions];
      newQuestions[qIndex] = {
        ...newQuestions[qIndex],
        [field]: value,
      };
      return { ...ch, questions: newQuestions };
    });
    setLocalChapters(updatedChaps);
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: 'custom_' + Date.now(),
      question: '새 과학 문제를 입력하세요',
      correctAnswer: '정답 단어',
      wrongAnswers: ['오답 1', '오답 2'],
      hint: '',
    };
    const updatedChaps = localChapters.map((ch) => {
      if (ch.id !== currentChapter.id) return ch;
      return { ...ch, questions: [...ch.questions, newQ] };
    });
    setLocalChapters(updatedChaps);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (currentChapter.questions.length <= 3) {
      alert('문제가 최소 3개 이상이어야 원활한 게임 진행이 가능합니다.');
      return;
    }
    const updatedChaps = localChapters.map((ch) => {
      if (ch.id !== currentChapter.id) return ch;
      const newQuestions = ch.questions.filter((_, idx) => idx !== qIndex);
      return { ...ch, questions: newQuestions };
    });
    setLocalChapters(updatedChaps);
  };

  const handleSaveAll = () => {
    onSaveChapters(localChapters);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border-3 border-zinc-900 rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0px_#18181b] flex flex-col text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-doodle font-bold text-zinc-950 flex items-center gap-2">
              <span>수업용 과학 퀴즈 문제 편집기</span>
              {showSavedToast && (
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 저장 완료!
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 font-doodle">
              오늘 수업 진도에 맞춰 핵심 과학 용어와 정답/오답을 직접 수정할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 shadow-[1.5px_1.5px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {currentChapter.questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-3 sm:p-4 space-y-2 relative shadow-[2px_2px_0px_#18181b]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-doodle bg-white text-zinc-900 px-2.5 py-0.5 rounded-md border-2 border-zinc-900">
                  문제 {idx + 1}
                </span>
                <button
                  onClick={() => handleDeleteQuestion(idx)}
                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  title="문제 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Question text */}
              <div>
                <label className="text-xs text-zinc-600 font-doodle font-bold block mb-1">문제 내용</label>
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                  className="w-full bg-white border-2 border-zinc-900 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-doodle text-zinc-950 outline-none"
                />
              </div>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-emerald-700 font-doodle font-bold block mb-1">
                    ✓ 정답 (캐릭터가 먹을 답)
                  </label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) => handleUpdateQuestion(idx, 'correctAnswer', e.target.value)}
                    className="w-full bg-emerald-50 border-2 border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs font-doodle text-emerald-950 outline-none font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-red-700 font-doodle font-bold block mb-1">
                    ✗ 오답들 (쉼표로 구분하여 입력)
                  </label>
                  <input
                    type="text"
                    value={q.wrongAnswers.join(', ')}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        idx,
                        'wrongAnswers',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="w-full bg-red-50 border-2 border-zinc-900 rounded-lg px-2.5 py-1.5 text-xs font-doodle text-red-950 outline-none"
                    placeholder="오답1, 오답2, 오답3"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            onClick={handleAddQuestion}
            className="w-full py-3 border-2 border-dashed border-zinc-400 hover:border-zinc-900 rounded-2xl text-xs sm:text-sm font-doodle font-bold text-zinc-600 hover:text-zinc-950 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 문제 추가하기</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t-2 border-zinc-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('기본 과학 문제들로 초기화하시겠습니까?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 font-doodle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 문제로 복원</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-doodle font-bold border-2 border-zinc-900"
            >
              취소
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-yellow-300 hover:bg-yellow-400 text-zinc-950 rounded-xl text-xs font-doodle font-bold transition-all flex items-center gap-1.5 border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>수정 사항 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
