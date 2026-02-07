import type {Difficulty} from '../model/types';

export const DIFFICULTY_CONFIG = {
  easy: {
    name: '쉬움',
    description: '모든 색상 표시',
    visibilityRule: 'all' as const,
  },
  medium: {
    name: '보통',
    description: '상단 제외 50% 랜덤 가림',
    visibilityRule: 'random-half' as const,
  },
  hard: {
    name: '어려움',
    description: '상단만 표시',
    visibilityRule: 'top-only' as const,
  },
} as const;

export type VisibilityRule =
  (typeof DIFFICULTY_CONFIG)[Difficulty]['visibilityRule'];

export function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTY_CONFIG[difficulty];
}


export const COLOR = [
  '',
  '#FF0000',
  '#008000',
  '#0000FF',
  '#FFFF00',
  '#FF8000',
  '#8000FF',
  '#FF4F80',
  '#0080FF',
  '#808080',
  '#8B4513',
  '#32CD32',
  '#FF00FF',
  '#66CCFF',
  '#FF8080',
  '#999900',
  '#8080FF',
  '#FFF8DC',
  '#FFC080',
  '#C080FF',
  '#FF80FF',
];
