import { describe, expect, it } from 'vitest';

import {
  GENERATOR_LIMITS,
  createColorPool,
  resolvePuzzleConfig,
} from '/features/puzzle-generator/model/config';

describe('resolvePuzzleConfig', () => {
  it('유효한 설정을 그대로 통과시킨다', () => {
    const resolved = resolvePuzzleConfig({
      numColors: 5,
      bottleHeight: 4,
      numBottles: 8,
    });
    expect(resolved).toEqual({ numColors: 5, bottleHeight: 4, numBottles: 8 });
  });

  it('numBottles 생략 시 numColors + MIN_EMPTY_BOTTLES 를 기본값으로 채운다', () => {
    const resolved = resolvePuzzleConfig({ numColors: 5, bottleHeight: 4 });
    expect(resolved.numBottles).toBe(5 + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES);
  });

  it('색상 수가 하한 미만이면 throw', () => {
    expect(() =>
      resolvePuzzleConfig({
        numColors: GENERATOR_LIMITS.MIN_COLORS - 1,
        bottleHeight: 4,
      }),
    ).toThrow();
  });

  it('색상 수가 상한을 초과하면 throw', () => {
    expect(() =>
      resolvePuzzleConfig({
        numColors: GENERATOR_LIMITS.MAX_COLORS + 1,
        bottleHeight: 4,
      }),
    ).toThrow();
  });

  it('병 높이가 범위를 벗어나면 throw', () => {
    expect(() =>
      resolvePuzzleConfig({
        numColors: 5,
        bottleHeight: GENERATOR_LIMITS.MIN_BOTTLE_HEIGHT - 1,
      }),
    ).toThrow();
    expect(() =>
      resolvePuzzleConfig({
        numColors: 5,
        bottleHeight: GENERATOR_LIMITS.MAX_BOTTLE_HEIGHT + 1,
      }),
    ).toThrow();
  });

  it('numBottles 가 색상 수 + 빈 병 최소치보다 작으면 throw', () => {
    expect(() =>
      resolvePuzzleConfig({
        numColors: 5,
        bottleHeight: 4,
        numBottles: 5 + GENERATOR_LIMITS.MIN_EMPTY_BOTTLES - 1,
      }),
    ).toThrow();
  });
});

describe('createColorPool', () => {
  it('색상 1..numColors 를 각 bottleHeight 개씩 담는다', () => {
    const pool = createColorPool(3, 4);
    expect(pool).toHaveLength(3 * 4);

    const counts = new Map<number, number>();
    for (const color of pool) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([1, 2, 3]);
    for (const count of counts.values()) {
      expect(count).toBe(4);
    }
  });
});
