import { describe, expect, it } from 'vitest';

import { isSolvable, isSolved, solvePuzzle } from '/features/puzzle-generator';

import type { Puzzle } from '/entities/game';

describe('isSolved', () => {
  it('모든 병이 비어 있으면 완료로 본다', () => {
    expect(isSolved([[], []], 4)).toBe(true);
  });

  it('가득 찬 단색 병 + 빈 병은 완료다', () => {
    expect(isSolved([[1, 1, 1, 1], []], 4)).toBe(true);
  });

  it('색이 섞인 병이 있으면 미완료다', () => {
    expect(isSolved([[1, 2, 1, 1]], 4)).toBe(false);
  });

  it('단색이지만 가득 차지 않은 병은 미완료다', () => {
    expect(isSolved([[1, 1, 1]], 4)).toBe(false);
  });
});

describe('isSolvable / solvePuzzle', () => {
  // 2색·높이2, 빈 병 2개. A=[1,2], B=[2,1] → 몇 수면 정렬 가능.
  const solvable: Puzzle = [[1, 2], [2, 1], [], []];

  it('이미 정렬된 퍼즐은 풀이 가능하다', () => {
    expect(isSolvable([[1, 1, 1, 1], []], 4)).toBe(true);
  });

  it('작은 풀이 가능 퍼즐의 해를 찾는다', () => {
    const path = solvePuzzle(solvable, 2);
    expect(path).not.toBeNull();
    expect(Array.isArray(path)).toBe(true);
  });

  it('탐색 노드 상한(maxNodes)에 걸리면 null 을 반환한다', () => {
    // 상한이 넉넉하면 풀리지만, 0이면 탐색 전에 중단되어 실패한다.
    expect(isSolvable(solvable, 2)).toBe(true);
    expect(isSolvable(solvable, 2, 0)).toBe(false);
  });

  it('입력 상태를 변형하지 않는다(불변성)', () => {
    const before = JSON.stringify(solvable);
    solvePuzzle(solvable, 2);
    expect(JSON.stringify(solvable)).toBe(before);
  });
});
