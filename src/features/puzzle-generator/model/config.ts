import { COLOR, type Color } from '/entities/game';

export interface PuzzleGeneratorConfig {
  numColors: number;
  bottleHeight: number;
  /** 생략 시 numColors + MIN_EMPTY_BOTTLES */
  numBottles?: number;
}

export interface ResolvedPuzzleConfig {
  numColors: number;
  bottleHeight: number;
  numBottles: number;
}

/** COLOR[0]은 "없음"이므로 실제 사용 가능한 색상은 COLOR.length - 1개. */
const MAX_COLORS = COLOR.length - 1;

export const GENERATOR_LIMITS = {
  MIN_COLORS: 2,
  MAX_COLORS,
  MIN_BOTTLE_HEIGHT: 4,
  MAX_BOTTLE_HEIGHT: 10,
  MIN_EMPTY_BOTTLES: 2,
  /**
   * "셔플 후 인접 중복 없음" 구조 조건을 통과할 때까지의 재시도 상한.
   * 한 번의 셔플+검사는 O(numColors*bottleHeight)로 매우 저렴하지만(마이크로초 단위),
   * 색상·병 높이가 클수록 조건을 통과할 확률 자체가 낮고 꼬리가 길다(실측 300샘플,
   * 20색·높이10 기준: 중앙값 약 2800회, p99 약 21000회, 관측 최댓값 약 29600회).
   * 100,000은 그 꼬리에 넉넉한 여유를 두면서도(최악의 경우에도 1초 내외) 유한하게
   * 끝나도록 보장한다 — 원래 코드의 while(true)는 이 상한이 아예 없었다.
   */
  MAX_MIX_ATTEMPTS: 100_000,
  /**
   * 구조가 유효한 후보 중 실제로 A* 솔버로 풀이 가능성을 검증해볼 최대 횟수.
   * 솔버 1회 호출이 MAX_SOLVER_NODES까지 탐색할 수 있어 비용이 크므로, 저렴한
   * MAX_MIX_ATTEMPTS와 별도로 훨씬 작게 제한한다.
   */
  MAX_SOLVABILITY_CHECKS: 20,
  /** 솔버가 이 노드 수를 넘게 탐색하면 포기하고 null 반환(무한 탐색 방지) */
  MAX_SOLVER_NODES: 20_000,
} as const;

/**
 * 세팅 값을 검증하고 numBottles 기본값을 채워 확정된 생성 설정을 반환한다.
 * 범위를 벗어나면 throw — 생성기가 잘못된 설정으로 무의미하게 재시도하는 것을 막는다.
 */
export function resolvePuzzleConfig(
  config: PuzzleGeneratorConfig,
): ResolvedPuzzleConfig {
  const { numColors, bottleHeight } = config;

  if (
    numColors < GENERATOR_LIMITS.MIN_COLORS ||
    numColors > GENERATOR_LIMITS.MAX_COLORS
  ) {
    throw new Error(
      `색상 개수는 ${GENERATOR_LIMITS.MIN_COLORS}~${GENERATOR_LIMITS.MAX_COLORS} 사이여야 합니다.`,
    );
  }

  if (
    bottleHeight < GENERATOR_LIMITS.MIN_BOTTLE_HEIGHT ||
    bottleHeight > GENERATOR_LIMITS.MAX_BOTTLE_HEIGHT
  ) {
    throw new Error(
      `병의 높이는 ${GENERATOR_LIMITS.MIN_BOTTLE_HEIGHT}~${GENERATOR_LIMITS.MAX_BOTTLE_HEIGHT} 사이여야 합니다.`,
    );
  }

  const numBottles =
    config.numBottles ?? numColors + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES;

  if (numBottles < numColors + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES) {
    throw new Error(
      `병 개수는 색상 수 + 빈 병 ${GENERATOR_LIMITS.MIN_EMPTY_BOTTLES}개 이상이어야 합니다.`,
    );
  }

  return { numColors, bottleHeight, numBottles };
}

/** 색상 ID 1..numColors를 각 bottleHeight개씩 담은 셔플 전 풀(pool). */
export function createColorPool(
  numColors: number,
  bottleHeight: number,
): Color[] {
  const pool: Color[] = [];
  for (let colorId = 1; colorId <= numColors; colorId++) {
    for (let i = 0; i < bottleHeight; i++) {
      pool.push(colorId);
    }
  }
  return pool;
}
