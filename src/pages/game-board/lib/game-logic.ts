// shared/model/types.ts (기존과 동일)

import type { Bottle, Color, Puzzle } from "../../../entities/game";
import type { Move } from "../model/types";

export interface MoveResult {
    success: boolean;
    newState?: Puzzle;
    error?: string;
    actualAmount?: number;
}

// features/game-logic/model/liquid-mover.ts
export class LiquidMover {
    private bottleHeight: number;

    constructor(bottleHeight: number = 4) {
        this.bottleHeight = bottleHeight;
    }

    /**
     * 액체를 이동시키는 메인 함수
     */
    moveLiquid(state: Puzzle, move: Move): MoveResult {
        // 1. 기본 유효성 검사
        const validationResult = this.validateMove(state, move);
        if (!validationResult.success) {
            return validationResult;
        }

        // 2. 실제 이동 가능한 양 계산
        const actualAmount = this.calculateActualMoveAmount(state, move);
        if (actualAmount === 0) {
            return {
                success: false,
                error: '이동할 수 있는 액체가 없습니다.'
            };
        }

        // 3. 액체 이동 실행
        const newState = this.executeMove(state, {
            ...move,
            amount: actualAmount
        });

        return {
            success: true,
            newState,
            actualAmount
        };
    }

    /**
     * 이동 유효성 검사
     */
    private validateMove(state: Puzzle, move: Move): MoveResult {
        const { from, to, amount } = move;

        // 병 인덱스 범위 확인
        if (from < 0 || from >= state.length || to < 0 || to >= state.length) {
            return {
                success: false,
                error: '잘못된 병 인덱스입니다.'
            };
        }

        // 같은 병으로 이동 시도
        if (from === to) {
            return {
                success: false,
                error: '같은 병으로는 이동할 수 없습니다.'
            };
        }

        // 출발지 병이 비어있는 경우
        if (state[from].length === 0) {
            return {
                success: false,
                error: '출발지 병이 비어있습니다.'
            };
        }

        // 이동량이 0 이하인 경우
        if (amount <= 0) {
            return {
                success: false,
                error: '이동량은 1 이상이어야 합니다.'
            };
        }

        return { success: true };
    }

    /**
     * 실제 이동 가능한 액체 양 계산
     */
    private calculateActualMoveAmount(state: Puzzle, move: Move): number {
        const { from, to, amount } = move;
        const fromBottle = state[from];
        const toBottle = state[to];

        if (fromBottle.length === 0) return 0;

        const topColor = fromBottle[fromBottle.length - 1];

        // 1. 연속된 같은 색상의 개수 계산
        let consecutiveCount = 0;
        for (let i = fromBottle.length - 1; i >= 0; i--) {
            if (fromBottle[i] === topColor) {
                consecutiveCount++;
            } else {
                break;
            }
        }

        // 2. 목적지 병의 용량 확인
        const availableSpace = this.bottleHeight - toBottle.length;
        if (availableSpace <= 0) return 0;

        // 3. 목적지 병의 색상 호환성 확인
        if (toBottle.length > 0) {
            const toTopColor = toBottle[toBottle.length - 1];
            if (topColor !== toTopColor) return 0;
        }

        // 4. 실제 이동 가능한 양 결정
        return Math.min(amount, consecutiveCount, availableSpace);
    }

    /**
     * 액체 이동 실행
     */
    private executeMove(state: Puzzle, move: Move): Puzzle {
        const newState = this.deepCopyState(state);
        const { from, to, amount } = move;

        // 출발지에서 액체 제거
        const movingLiquids = newState[from].splice(-amount, amount);

        // 목적지에 액체 추가
        newState[to].push(...movingLiquids);

        return newState;
    }

    /**
     * 자동으로 최적의 이동량 계산하여 이동
     */
    autoMoveLiquid(state: Puzzle, from: number, to: number): MoveResult {
        if (from < 0 || from >= state.length || to < 0 || to >= state.length) {
            return {
                success: false,
                error: '잘못된 병 인덱스입니다.'
            };
        }

        const fromBottle = state[from];
        if (fromBottle.length === 0) {
            return {
                success: false,
                error: '출발지 병이 비어있습니다.'
            };
        }

        // 최대한 많이 이동할 수 있는 양 계산
        const maxAmount = this.calculateActualMoveAmount(state, {
            from,
            to,
            amount: this.bottleHeight
        });

        if (maxAmount === 0) {
            return {
                success: false,
                error: '이동할 수 없습니다.'
            };
        }

        return this.moveLiquid(state, { from, to, amount: maxAmount });
    }

    /**
     * 특정 위치에서 가능한 모든 이동 찾기
     */
    findPossibleMoves(state: Puzzle, from: number): Move[] {
        const possibleMoves: Move[] = [];

        if (from < 0 || from >= state.length || state[from].length === 0) {
            return possibleMoves;
        }

        for (let to = 0; to < state.length; to++) {
            if (from === to) continue;

            const maxAmount = this.calculateActualMoveAmount(state, {
                from,
                to,
                amount: this.bottleHeight
            });

            if (maxAmount > 0) {
                possibleMoves.push({ from, to, amount: maxAmount });
            }
        }

        return possibleMoves;
    }

    /**
     * 전체 게임에서 가능한 모든 이동 찾기
     */
    findAllPossibleMoves(state: Puzzle): Move[] {
        const allMoves: Move[] = [];

        for (let from = 0; from < state.length; from++) {
            const moves = this.findPossibleMoves(state, from);
            allMoves.push(...moves);
        }

        return allMoves;
    }

    /**
     * 게임이 완료되었는지 확인
     */
    isGameCompleted(state: Puzzle): boolean {
        for (const bottle of state) {
            if (bottle.length === 0) continue;

            // 병이 가득 차지 않았거나, 다른 색상이 섞여있으면 미완료
            if (bottle.length !== this.bottleHeight) return false;

            const firstColor = bottle[0];
            if (bottle.some(color => color !== firstColor)) return false;
        }

        return true;
    }

    /**
     * 이동 후 상태가 더 나아졌는지 평가
     */
    evaluateMove(state: Puzzle, move: Move): number {
        const result = this.moveLiquid(state, move);
        if (!result.success || !result.newState) return -1;

        const beforeScore = this.calculateGameScore(state);
        const afterScore = this.calculateGameScore(result.newState);

        return afterScore - beforeScore;
    }

    /**
     * 게임 상태 점수 계산 (높을수록 완료에 가까움)
     */
    private calculateGameScore(state: Puzzle): number {
        let score = 0;

        for (const bottle of state) {
            if (bottle.length === 0) {
                score += 1; // 빈 병은 좋음
                continue;
            }

            // 같은 색상이 연속으로 있는 정도
            const colorGroups = this.getColorGroups(bottle);
            score += colorGroups.reduce((sum, group) => sum + group.length * group.length, 0);

            // 완성된 병은 보너스
            if (bottle.length === this.bottleHeight && colorGroups.length === 1) {
                score += 20;
            }
        }

        return score;
    }

    /**
     * 병 내의 색상 그룹 분석
     */
    private getColorGroups(bottle: Bottle): Array<{ color: Color; length: number }> {
        if (bottle.length === 0) return [];

        const groups: Array<{ color: Color; length: number }> = [];
        let currentColor = bottle[0];
        let currentLength = 1;

        for (let i = 1; i < bottle.length; i++) {
            if (bottle[i] === currentColor) {
                currentLength++;
            } else {
                groups.push({ color: currentColor, length: currentLength });
                currentColor = bottle[i];
                currentLength = 1;
            }
        }

        groups.push({ color: currentColor, length: currentLength });
        return groups;
    }

    private deepCopyState(state: Puzzle): Puzzle {
        return state.map(bottle => [...bottle]);
    }
}

export class GameAPI {
    private liquidMover: LiquidMover;

    constructor(bottleHeight: number = 4) {
        this.liquidMover = new LiquidMover(bottleHeight);
    }

    /**
     * 액체 이동 (정확한 양 지정)
     */
    moveLiquid(state: Puzzle, from: number, to: number, amount: number): MoveResult {
        return this.liquidMover.moveLiquid(state, { from, to, amount });
    }

    /**
     * 액체 자동 이동 (최대한 많이)
     */
    autoMoveLiquid(state: Puzzle, from: number, to: number): MoveResult {
        return this.liquidMover.autoMoveLiquid(state, from, to);
    }

    /**
     * 가능한 이동들 조회
     */
    getPossibleMoves(state: Puzzle, from?: number): Move[] {
        if (from !== undefined) {
            return this.liquidMover.findPossibleMoves(state, from);
        }
        return this.liquidMover.findAllPossibleMoves(state);
    }

    /**
     * 게임 완료 확인
     */
    isCompleted(state: Puzzle): boolean {
        return this.liquidMover.isGameCompleted(state);
    }

    /**
     * 이동 평가
     */
    evaluateMove(state: Puzzle, from: number, to: number, amount: number): number {
        return this.liquidMover.evaluateMove(state, { from, to, amount });
    }
}

// features/game-logic/lib/game-utils.ts
export class GameUtils {
    /**
     * 이동 결과를 콘솔에 출력
     */
    static printMoveResult(result: MoveResult, move: Move): void {
        if (result.success) {
            console.log(`✅ 이동 성공: 병 ${move.from} → 병 ${move.to} (${result.actualAmount}개)`);
        } else {
            console.log(`❌ 이동 실패: ${result.error}`);
        }
    }

    /**
     * 게임 상태와 가능한 이동들 출력
     */
    static printGameStatus(state: Puzzle, gameAPI: GameAPI): void {
        console.log('\n=== 현재 게임 상태 ===');
        PuzzleUtils.printPuzzle(state);

        const possibleMoves = gameAPI.getPossibleMoves(state);
        console.log(`가능한 이동: ${possibleMoves.length}개`);

        possibleMoves.forEach((move, index) => {
            console.log(`${index + 1}. 병 ${move.from} → 병 ${move.to} (${move.amount}개)`);
        });

        if (gameAPI.isCompleted(state)) {
            console.log('🎉 게임 완료!');
        }
        console.log('==================\n');
    }
}

// 사용 예시
export function testLiquidMovement() {
    // 게임 API 초기화
    const gameAPI = new GameAPI(4);

    // 테스트용 퍼즐 생성
    const initialState: Puzzle = [
        [1, 2, 3, 1],  // 병 0
        [2, 3, 1, 2],  // 병 1
        [3, 1, 2, 3],  // 병 2
        [],            // 병 3 (빈 병)
        []             // 병 4 (빈 병)
    ];

    console.log('=== Liquid Movement 테스트 ===');
    GameUtils.printGameStatus(initialState, gameAPI);

    // 이동 테스트
    let currentState = initialState;

    // 1. 병 0에서 병 3으로 이동 (자동)
    console.log('1. 병 0 → 병 3 자동 이동');
    const result1 = gameAPI.autoMoveLiquid(currentState, 0, 3);
    GameUtils.printMoveResult(result1, { from: 0, to: 3, amount: 0 });

    if (result1.success && result1.newState) {
        currentState = result1.newState;
        GameUtils.printGameStatus(currentState, gameAPI);
    }

    // 2. 병 1에서 병 4로 정확한 양 이동
    console.log('2. 병 1 → 병 4 (2개 이동)');
    const result2 = gameAPI.moveLiquid(currentState, 1, 4, 2);
    GameUtils.printMoveResult(result2, { from: 1, to: 4, amount: 2 });

    if (result2.success && result2.newState) {
        currentState = result2.newState;
        GameUtils.printGameStatus(currentState, gameAPI);
    }

    // 3. 특정 병에서 가능한 이동들 조회
    console.log('3. 병 2에서 가능한 이동들:');
    const possibleFromBottle2 = gameAPI.getPossibleMoves(currentState, 2);
    possibleFromBottle2.forEach((move, index) => {
        const score = gameAPI.evaluateMove(currentState, move.from, move.to, move.amount);
        console.log(`   ${index + 1}. 병 ${move.to}로 ${move.amount}개 이동 (점수: ${score})`);
    });
}

// PuzzleUtils import (이전 코드에서)
class PuzzleUtils {
    static printPuzzle(state: Puzzle): void {
        console.log('\n=== Water Sort Puzzle ===');
        const maxHeight = Math.max(...state.map(bottle => bottle.length), 1);

        for (let level = maxHeight - 1; level >= 0; level--) {
            let row = '';
            for (let bottleIndex = 0; bottleIndex < state.length; bottleIndex++) {
                const bottle = state[bottleIndex];
                if (level < bottle.length) {
                    row += `[${bottle[level]}] `;
                } else {
                    row += '[ ] ';
                }
            }
            console.log(row);
        }

        let bottleNumbers = '';
        for (let i = 0; i < state.length; i++) {
            bottleNumbers += ` ${i}  `;
        }
        console.log(bottleNumbers);
        console.log('========================\n');
    }
}

// 테스트 실행
