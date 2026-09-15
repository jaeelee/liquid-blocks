import { isSolvable } from '/features/puzzle-generator/lib/solver';
import {
  GENERATOR_LIMITS,
  createColorPool,
  resolvePuzzleConfig,
} from '/features/puzzle-generator/model/config';
import type { PuzzleGeneratorConfig } from '/features/puzzle-generator/model/config';

import type { Color, Puzzle } from '/entities/game';

// Fisher-Yates 셔플
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createDirectlyMixedState(
  numColors: number,
  bottleHeight: number,
  numBottles: number,
): Puzzle {
  const pool = createColorPool(numColors, bottleHeight);
  shuffleArray(pool);

  const state: Puzzle = [];
  let colorIndex = 0;

  // 대부분의 병을 가득 채우되, 마지막 몇 개는 빈 상태로 남김
  const filledBottles = numBottles - GENERATOR_LIMITS.MIN_EMPTY_BOTTLES;

  for (let bottleIdx = 0; bottleIdx < filledBottles; bottleIdx++) {
    const bottle: Color[] = [];
    for (let i = 0; i < bottleHeight && colorIndex < pool.length; i++) {
      bottle.push(pool[colorIndex++]);
    }
    state.push(bottle);
  }

  for (let i = 0; i < GENERATOR_LIMITS.MIN_EMPTY_BOTTLES; i++) {
    state.push([]);
  }

  return state;
}

/** 병 내에 연속된 같은 색이 없는지(=충분히 섞였는지) 검사 */
function isCompletelyMixed(state: Puzzle): boolean {
  for (const bottle of state) {
    if (bottle.length === 0) continue;
    let prevColor = 0;
    for (const color of bottle) {
      if (prevColor === color) return false;
      prevColor = color;
    }
  }
  return true;
}

/** 색상별 정확히 bottleHeight개씩, 빈 병은 최소 개수 이상인지 검사 */
function hasValidStructure(
  state: Puzzle,
  numColors: number,
  bottleHeight: number,
): boolean {
  const colorCounts = new Map<Color, number>();
  for (const bottle of state) {
    for (const color of bottle) {
      colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
    }
  }

  if (colorCounts.size !== numColors) return false;

  for (const count of colorCounts.values()) {
    if (count !== bottleHeight) return false;
  }

  const emptyBottles = state.filter((bottle) => bottle.length === 0).length;
  return emptyBottles >= GENERATOR_LIMITS.MIN_EMPTY_BOTTLES;
}

/**
 * 무작위로 섞인 퍼즐을 생성하고, 실제로 풀 수 있는지 솔버로 검증한다.
 * 두 단계 상한으로 무한루프를 막는다(이전 구현은 while(true)로 무한 재시도했음):
 *  1. 저렴한 셔플+구조 검증은 MAX_MIX_ATTEMPTS까지 반복 — 색상·병 높이가 클수록
 *     "인접 중복 없음" 조건 자체가 잘 안 맞아 수백~수천 회가 정상적으로 필요하다.
 *  2. 구조가 유효한 후보 중에서는 MAX_SOLVABILITY_CHECKS번까지만 (비용이 큰) A*
 *     풀이 가능성 검증을 시도한다.
 * 두 상한을 모두 소진했는데 구조상 유효한 후보가 있었다면, 풀이 검증은 못 했더라도
 * 그 후보를 반환해 UI가 멈추지 않게 한다(구조만 검증하던 이전 동작과 동급 이상).
 */
export function generatePuzzle(config: PuzzleGeneratorConfig): Puzzle {
  const { numColors, bottleHeight, numBottles } = resolvePuzzleConfig(config);

  let lastValidCandidate: Puzzle | null = null;
  let solvabilityChecks = 0;

  for (
    let attempt = 0;
    attempt < GENERATOR_LIMITS.MAX_MIX_ATTEMPTS;
    attempt++
  ) {
    const candidate = createDirectlyMixedState(
      numColors,
      bottleHeight,
      numBottles,
    );

    if (
      !isCompletelyMixed(candidate) ||
      !hasValidStructure(candidate, numColors, bottleHeight)
    ) {
      continue;
    }

    lastValidCandidate = candidate;

    if (solvabilityChecks >= GENERATOR_LIMITS.MAX_SOLVABILITY_CHECKS) {
      break;
    }
    solvabilityChecks++;

    if (isSolvable(candidate, bottleHeight)) {
      return candidate;
    }
  }

  if (lastValidCandidate) {
    console.warn(
      '풀이 가능성이 검증된 퍼즐을 찾지 못해, 구조가 유효한 마지막 후보를 사용합니다.',
    );
    return lastValidCandidate;
  }

  throw new Error(
    `${GENERATOR_LIMITS.MAX_MIX_ATTEMPTS}번 시도 후에도 유효한 구조의 퍼즐을 생성할 수 없습니다.`,
  );
}
