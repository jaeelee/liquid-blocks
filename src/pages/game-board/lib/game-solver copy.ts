import { BOTTLE_HEIGHT } from "src/pages/game-board/lib/constants";
import { Color, Puzzle } from "src/entities/game";
import { Move } from "src/pages/game-board/model/types";

/**
 * 퍼즐이 해결되었는지 확인
 */
export const isSolved = (Puzzle: Puzzle, bottleHeight: number = BOTTLE_HEIGHT): boolean => {
    return Puzzle.every(bottle => {
        // 빈 병이거나
        if (bottle.length === 0) return true;

        // 가득 차있고 모든 색상이 같은 경우
        console.log(bottle.length, bottleHeight);
        if (bottle.length === bottleHeight) {
            const firstColor = bottle[0];
            return bottle.every(color => color === firstColor);
        }

        return false;
    });
}

class PriorityQueue<T> {
    private items: Array<{ priority: number; item: T }> = [];

    enqueue(item: T, priority: number): void {
        this.items.push({ priority, item });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue(): T | undefined {
        return this.items.shift()?.item;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}

function isGoalState(state: Puzzle): boolean {
    for (const bottle of state) {
        if (bottle.length === 0) {
            continue;
        }
        const firstColor = bottle[0];
        if (bottle.some(color => color !== firstColor)) {
            return false;
        }
    }
    return true;
}

function hashState(state: Puzzle): string {
    return JSON.stringify(state);
}

function getValidMoves(state: Puzzle): Move[] {
    const moves: Move[] = [];
    const n = state.length;

    for (let i = 0; i < n; i++) {
        if (state[i].length === 0) {
            continue;
        }

        const topColor = state[i][state[i].length - 1];
        let count = 1;

        // 연속된 같은 색상의 개수 계산
        for (let j = state[i].length - 2; j >= 0; j--) {
            if (state[i][j] === topColor) {
                count++;
            } else {
                break;
            }
        }

        for (let k = 0; k < n; k++) {
            if (i === k) {
                continue;
            }

            // 빈 병이거나, 병이 가득 차지 않았고 맨 위 색상이 같은 경우
            if (state[k].length === 0 ||
                (state[k].length < 4 && state[k][state[k].length - 1] === topColor)) {
                moves.push({ from: i, to: k, amount: count });
            }
        }
    }
    return moves;
}

function applyMove(state: Puzzle, move: Move): Puzzle {
    const newState: Puzzle = state.map(bottle => [...bottle]);
    const movingColors = newState[move.from].splice(-move.amount, move.amount);
    newState[move.to].push(...movingColors);
    return newState;
}

function countMisplacedColors(state: Puzzle): number {
    let misplaced = 0;
    for (const bottle of state) {
        if (bottle.length === 0) {
            continue;
        }
        const targetColor = bottle[0];
        for (const color of bottle) {
            if (color !== targetColor) {
                misplaced++;
            }
        }
    }
    return misplaced;
}

function countIncompleteBottles(state: Puzzle): number {
    let incomplete = 0;
    for (const bottle of state) {
        if (bottle.length === 0) {
            continue;
        }
        const firstColor = bottle[0];
        if (bottle.some(color => color !== firstColor)) {
            incomplete++;
        }
    }
    return incomplete;
}

function calculateColorDispersion(state: Puzzle): number {
    const colorPositions: Map<Color, Set<number>> = new Map();

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
    return countMisplacedColors(state) +
        countIncompleteBottles(state) +
        calculateColorDispersion(state);
}

function solvePuzzle(initialState: Puzzle): Move[] | null {
    const openList = new PriorityQueue<{
        state: Puzzle;
        path: Move[];
        gCost: number;
    }>();

    const initialHeuristic = heuristic(initialState);
    openList.enqueue({
        state: initialState,
        path: [],
        gCost: 0
    }, initialHeuristic);

    const visited = new Set<string>();

    while (!openList.isEmpty()) {
        const current = openList.dequeue()!;
        const { state: currentState, path, gCost } = current;

        if (isGoalState(currentState)) {
            return path;
        }

        const stateHash = hashState(currentState);
        if (visited.has(stateHash)) {
            continue;
        }
        visited.add(stateHash);

        for (const move of getValidMoves(currentState)) {
            const newState = applyMove(currentState, move);
            const newGCost = gCost + 1;
            const newFCost = newGCost + heuristic(newState);

            openList.enqueue({
                state: newState,
                path: [...path, move],
                gCost: newGCost
            }, newFCost);
        }
    }

    return null;
}



// 해결책을 단계별로 출력하는 함수
function printSolution(moves: Move[] | null): void {
    if (!moves) {
        console.log('해결책을 찾을 수 없습니다.');
        return;
    }

    console.log(`총 ${moves.length}번의 이동으로 해결:`);
    moves.forEach((move, index) => {
        console.log(`${index + 1}. 병 ${move.from}에서 병 ${move.to}로 ${move.amount}개 이동`);
    });
}

export { solvePuzzle, printSolution }