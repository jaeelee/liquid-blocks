import { describe, expect, it } from 'vitest';

import {
  GENERATOR_LIMITS,
  generatePuzzle,
  isSolvable,
  isSolved,
} from '/features/puzzle-generator';

import type { Puzzle } from '/entities/game';

function colorCounts(puzzle: Puzzle): Map<number, number> {
  const counts = new Map<number, number>();
  for (const bottle of puzzle) {
    for (const color of bottle) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  }
  return counts;
}

describe('generatePuzzle 불변식', () => {
  it('3색·높이4 퍼즐을 반복 생성해도 항상 불변식을 만족한다', () => {
    const numColors = 3;
    const bottleHeight = 4;
    const numBottles = numColors + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES;

    for (let run = 0; run < 15; run++) {
      const puzzle = generatePuzzle({ numColors, bottleHeight });

      // (a) 병 개수 = numColors + 빈 병 최소치
      expect(puzzle).toHaveLength(numBottles);

      // (b) 색상별 정확히 bottleHeight 개, 색상 종류는 numColors 개
      const counts = colorCounts(puzzle);
      expect(counts.size).toBe(numColors);
      for (const count of counts.values()) {
        expect(count).toBe(bottleHeight);
      }

      // (c) 빈 병이 최소치 이상
      const emptyBottles = puzzle.filter((b) => b.length === 0).length;
      expect(emptyBottles).toBeGreaterThanOrEqual(
        GENERATOR_LIMITS.MIN_EMPTY_BOTTLES,
      );

      // (d) 아직 풀리지 않은(섞인) 상태
      expect(isSolved(puzzle, bottleHeight)).toBe(false);

      // (e) 실제로 풀이 가능
      expect(isSolvable(puzzle, bottleHeight)).toBe(true);
    }
  });

  it('색상 수가 커도(6색·높이5) 유한 시간 내 유효 구조를 반환한다', () => {
    const numColors = 6;
    const bottleHeight = 5;
    const puzzle = generatePuzzle({ numColors, bottleHeight });

    expect(puzzle).toHaveLength(numColors + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES);
    const counts = colorCounts(puzzle);
    expect(counts.size).toBe(numColors);
    for (const count of counts.values()) {
      expect(count).toBe(bottleHeight);
    }
  });
});
