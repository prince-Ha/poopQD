import { ScienceChapter } from '../types/game';

export const INITIAL_CHAPTERS: ScienceChapter[] = [
  {
    id: 'bio-genetics',
    grade: '중3',
    title: '생식과 유전 (용어 연습)',
    description: '',
    theme: 'cell',
    questions: [
      {
        id: 'q1',
        question: '사람의 체세포 염색체 수는?',
        correctAnswer: '46개',
        wrongAnswers: ['23개', '92개', '48개'],
      },
      {
        id: 'q2',
        question: '사람의 생식세포(정자, 난자) 염색체 수는?',
        correctAnswer: '23개',
        wrongAnswers: ['46개', '12개', '92개'],
      },
      {
        id: 'q3',
        question: '사람의 상염색체 쌍의 수는?',
        correctAnswer: '22쌍',
        wrongAnswers: ['23쌍', '44쌍', '1쌍'],
      },
      {
        id: 'q4',
        question: '여성의 성염색체 구성은?',
        correctAnswer: 'XX',
        wrongAnswers: ['XY', 'YY', 'XO'],
      },
      {
        id: 'q5',
        question: '남성의 성염색체 구성은?',
        correctAnswer: 'XY',
        wrongAnswers: ['XX', 'YY', 'XZ'],
      },
      {
        id: 'q6',
        question: '체세포 분열 결과 만들어지는 딸세포 수는?',
        correctAnswer: '2개',
        wrongAnswers: ['4개', '1개', '8개'],
      },
      {
        id: 'q7',
        question: '감수 분열 결과 만들어지는 딸세포 수는?',
        correctAnswer: '4개',
        wrongAnswers: ['2개', '1개', '8개'],
      },
      {
        id: 'q8',
        question: 'DNA와 단백질이 꼬여 세포 분열 시 나타나는 구조는?',
        correctAnswer: '염색체',
        wrongAnswers: ['엽록체', '미토콘드리아', '세포벽'],
      },
      {
        id: 'q9',
        question: '부모와 자손의 염색체 수가 세대를 거듭해도 일정한 이유는?',
        correctAnswer: '감수 분열',
        wrongAnswers: ['체세포 분열', '삼투 현상', '광합성'],
      },
      {
        id: 'q10',
        question: '멘델 유전에서 대립 형질 중 잡종 1대에서 겉으로 드러나는 형질은?',
        correctAnswer: '우성',
        wrongAnswers: ['열성', '돌연변이', '중성'],
      },
      {
        id: 'q11',
        question: '잡종 1대에서 겉으로 드러나지 않고 숨겨지는 형질은?',
        correctAnswer: '열성',
        wrongAnswers: ['우성', '가성', '진성'],
      },
      {
        id: 'q12',
        question: '순종 둥근 완두(RR)와 주름진 완두(rr) 교배 시 잡종 1대 표현형은?',
        correctAnswer: '둥근 완두',
        wrongAnswers: ['주름진 완두', '반반 완두', '모두 주름짐'],
      },
      {
        id: 'q13',
        question: '잡종 2대(Rr x Rr)에서 둥근 완두와 주름진 완두의 분리비는?',
        correctAnswer: '3 : 1',
        wrongAnswers: ['1 : 1', '9 : 3', '2 : 1'],
      },
      {
        id: 'q14',
        question: '모양과 크기가 같고 부모에게서 하나씩 물려받은 한 쌍의 염색체는?',
        correctAnswer: '상동 염색체',
        wrongAnswers: ['성염색체', '염색분체', '돌연변이체'],
      },
      {
        id: 'q15',
        question: '복제된 한 개의 염색체를 이루는 각각의 가닥은?',
        correctAnswer: '염색분체',
        wrongAnswers: ['상동염색체', '유전자좌', '중심체'],
      },
    ],
  },
];
