import { GENERATOR_LIMITS } from '/features/puzzle-generator/model/config';
import type { Move } from '/features/puzzle-generator/model/move';

import type { Color, Puzzle } from '/entities/game';

/**
 * 병 하나가 완료 상태인지: 비어 있거나, 가득 차 있고(=bottleHeight) 단색.
 * 생성기의 풀이 가능성 검증과 board의 클리어 판정이 반드시 이 기준 하나를 공유해야
 * "생성기가 풀린다고 판단했는데 화면은 안 풀렸다고 표시" 같은 불일치가 생기지 않는다.
 */
function isBottleSolved(bottle: Color[], bottleHeight: number): boolean {
  if (bottle.length === 0) return true;
  if (bottle.length !== bottleHeight) return false;
  const firstColor = bottle[0];
  return bottle.every((color) => color === firstColor);
}

export function isSolved(puzzle: Puzzle, bottleHeight: number): boolean {
  return puzzle.every((bottle) => isBottleSolved(bottle, bottleHeight));
}

/** 이진 힙 기반 최소 우선순위 큐. 매 삽입마다 전체 정렬하던 이전 구현 대비 O(log n) 삽입/추출. */
class PriorityQueue<T> {
  private heap: Array<{ priority: number; item: T }> = [];

  enqueue(item: T, priority: number): void {
    const heap = this.heap;
    heap.push({ priority, item });
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent].priority <= heap[i].priority) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  dequeue(): T | undefined {
    const heap = this.heap;
    if (heap.length === 0) return undefined;

    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      const n = heap.length;
      while (true) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let smallest = i;
        if (left < n && heap[left].priority < heap[smallest].priority) {
          smallest = left;
        }
        if (right < n && heap[right].priority < heap[smallest].priority) {
          smallest = right;
        }
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
      }
    }
    return top.item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}

function hashState(state: Puzzle): string {
  return JSON.stringify(state);
}

/** 출발 병에서 목적지 병으로 이동 가능한 모든 (from, to) 조합. bottleHeight는 인자로 받아
 * 병 높이 설정과 무관하게 항상 정확히 동작한다(이전 구현은 4가 하드코딩되어 있었음). */
function getValidMoves(state: Puzzle, bottleHeight: number): Move[] {
  const moves: Move[] = [];
  const n = state.length;

  for (let i = 0; i < n; i++) {
    if (state[i].length === 0) continue;

    const topColor = state[i][state[i].length - 1];
    let count = 1;
    for (let j = state[i].length - 2; j >= 0; j--) {
      if (state[i][j] === topColor) {
        count++;
      } else {
        break;
      }
    }

    for (let k = 0; k < n; k++) {
      if (i === k) continue;

      const destBottle = state[k];
      const destTopColor = destBottle[destBottle.length - 1];

      if (
        destBottle.length === 0 ||
        (destBottle.length < bottleHeight && destTopColor === topColor)
      ) {
        moves.push({ from: i, to: k, amount: count });
      }
    }
  }

  return moves;
}

function applyMove(state: Puzzle, move: Move): Puzzle {
  const newState: Puzzle = state.map((bottle) => [...bottle]);
  const movingColors = newState[move.from].splice(-move.amount, move.amount);
  newState[move.to].push(...movingColors);
  return newState;
}

function countMisplacedColors(state: Puzzle): number {
  let misplaced = 0;
  for (const bottle of state) {
    if (bottle.length === 0) continue;
    const targetColor = bottle[0];
    for (const color of bottle) {
      if (color !== targetColor) misplaced++;
    }
  }
  return misplaced;
}

function countIncompleteBottles(state: Puzzle): number {
  let incomplete = 0;
  for (const bottle of state) {
    if (bottle.length === 0) continue;
    const firstColor = bottle[0];
    if (bottle.some((color) => color !== firstColor)) incomplete++;
  }
  return incomplete;
}

function calculateColorDispersion(state: Puzzle): number {
  const colorPositions = new Map<Color, Set<number>>();

  for (let i = 0; i < state.length; i++) {
    for (const color of state[i]) {
      if (!colorPositions.has(color)) {
        colorPositions.set(color, new Set());
      }
      colorPositions.get(color)!.add(i);
    }
  }

  let dispersion = 0;
  for (const positions of colorPositions.values()) {
    dispersion += positions.size - 1;
  }
  return dispersion;
}

function heuristic(state: Puzzle): number {
  return (
    countMisplacedColors(state) +
    countIncompleteBottles(state) +
    calculateColorDispersion(state)
  );
}

/**
 * A* 탐색으로 해결 경로를 찾는다. `maxNodes`를 넘어서면 포기하고 null을 반환해
 * 큰 설정(색상·병 수가 많은 경우)에서도 탐색이 무한정 걸리지 않도록 상한을 둔다.
 */
export function solvePuzzle(
  initialState: Puzzle,
  bottleHeight: number,
  maxNodes: number = GENERATOR_LIMITS.MAX_SOLVER_NODES,
): Move[] | null {
  const openList = new PriorityQueue<{
    state: Puzzle;
    path: Move[];
    gCost: number;
  }>();

  openList.enqueue(
    { state: initialState, path: [], gCost: 0 },
    heuristic(initialState),
  );

  const visited = new Set<string>();
  let expanded = 0;

  while (!openList.isEmpty()) {
    if (expanded >= maxNodes) return null;

    const current = openList.dequeue()!;
    const { state: currentState, path, gCost } = current;

    if (isSolved(currentState, bottleHeight)) {
      return path;
    }

    const stateHash = hashState(currentState);
    if (visited.has(stateHash)) continue;
    visited.add(stateHash);
    expanded++;

    for (const move of getValidMoves(currentState, bottleHeight)) {
      const newState = applyMove(currentState, move);
      const newGCost = gCost + 1;
      const newFCost = newGCost + heuristic(newState);

      openList.enqueue(
        { state: newState, path: [...path, move], gCost: newGCost },
        newFCost,
      );
    }
  }

  return null;
}

/** 생성기가 "이 퍼즐이 실제로 풀리는가"만 알면 되는 경우를 위한 얇은 래퍼. */
export function isSolvable(
  puzzle: Puzzle,
  bottleHeight: number,
  maxNodes?: number,
): boolean {
  return solvePuzzle(puzzle, bottleHeight, maxNodes) !== null;
}
