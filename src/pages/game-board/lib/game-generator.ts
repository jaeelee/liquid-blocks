import type { Bottle, Color, Puzzle } from '/entities/game';

export interface GeneratorConfig {
    numColors: number;
    bottleHeight: number;
    numBottles?: number;
    mixingSteps?: number;
}

// shared/lib/constants.ts (동일)
export const GAME_CONFIG = {
    MIN_COLORS: 2,
    MIN_BOTTLE_HEIGHT: 4,
    DEFAULT_MIXING_STEPS: 200,
    MAX_GENERATION_ATTEMPTS: 10,
    MIN_EMPTY_BOTTLES: 2,
} as const;

// features/puzzle-generator/model/generator.ts
class WaterSortPuzzleGenerator {
    private config: Required<GeneratorConfig>;

    constructor(config: GeneratorConfig) {
        this.validateConfig(config);
        this.config = {
            numColors: config.numColors,
            bottleHeight: config.bottleHeight,
            numBottles: config.numBottles || config.numColors + 2,
            mixingSteps: config.mixingSteps || GAME_CONFIG.DEFAULT_MIXING_STEPS
        };
    }

    private validateConfig(config: GeneratorConfig): void {
        if (config.numColors < GAME_CONFIG.MIN_COLORS) {
            throw new Error(`색상 개수는 최소 ${GAME_CONFIG.MIN_COLORS}개 이상이어야 합니다.`);
        }
        if (config.bottleHeight < GAME_CONFIG.MIN_BOTTLE_HEIGHT) {
            throw new Error(`병의 높이는 최소 ${GAME_CONFIG.MIN_BOTTLE_HEIGHT} 이상이어야 합니다.`);
        }
    }

    generate(): Puzzle {
        // 역방향 생성 대신 직접 섞인 상태 생성 + 검증
        let attempts = 0;
        while (true) {
            // while (attempts < GAME_CONFIG.MAX_GENERATION_ATTEMPTS) {
            const mixedState = this.createDirectlyMixedState();

            if (this.isCompletelyMixed(mixedState) && this.hasValidStructure(mixedState)) {
                console.log(`${attempts + 1}번째 시도에서 성공적으로 생성됨`);
                return mixedState;
            }
        }

        throw new Error(`${GAME_CONFIG.MAX_GENERATION_ATTEMPTS}번 시도 후에도 유효한 퍼즐을 생성할 수 없습니다.`);
    }

    private createDirectlyMixedState(): Puzzle {
        // 1. 모든 색상을 배열로 생성
        const allColors: Color[] = [];
        for (let colorId = 1; colorId <= this.config.numColors; colorId++) {
            for (let i = 0; i < this.config.bottleHeight; i++) {
                allColors.push(colorId);
            }
        }

        // 2. 색상 배열을 완전히 섞기
        this.shuffleArray(allColors);

        // 3. 섞인 색상을 병에 분배 (전략적으로)
        const state: Puzzle = [];
        let colorIndex = 0;

        // 대부분의 병을 가득 채우되, 마지막 몇 개는 빈 상태로 남김
        const filledBottles = this.config.numBottles - GAME_CONFIG.MIN_EMPTY_BOTTLES;

        for (let bottleIdx = 0; bottleIdx < filledBottles; bottleIdx++) {
            const bottle: Bottle = [];

            // 각 병을 가득 채우기 (4개)
            for (let i = 0; i < this.config.bottleHeight && colorIndex < allColors.length; i++) {
                bottle.push(allColors[colorIndex++]);
            }

            state.push(bottle);
        }

        // 빈 병들 추가
        for (let i = 0; i < GAME_CONFIG.MIN_EMPTY_BOTTLES; i++) {
            state.push([]);
        }

        return state;
    }

    // Fisher-Yates 셔플 알고리즘
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private countEmptyBottles(state: Puzzle): number {
        return state.filter(bottle => bottle.length === 0).length;
    }

    // 완전 섞임 검증: 1. 색이 겹치지 않았는가 (각 병에 다양한 색상이 있는가)
    private isCompletelyMixed(state: Puzzle): boolean {
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

    // 완전 섞임 검증: 2. 빈병이 아닌 곳은 모두 적절히 구성되어 있는가
    private hasValidStructure(state: Puzzle): boolean {
        // 색상 개수 검증
        const colorCounts = new Map<Color, number>();
        for (const bottle of state) {
            for (const color of bottle) {
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
            }
        }

        // 모든 색상이 정확히 bottleHeight개씩 있어야 함
        if (colorCounts.size !== this.config.numColors) {
            console.log(`색상 개수 불일치: 기대 ${this.config.numColors}, 실제 ${colorCounts.size}`);
            return false;
        }

        for (const [color, count] of colorCounts.entries()) {
            if (count !== this.config.bottleHeight) {
                console.log(`색상 ${color}의 개수 불일치: 기대 ${this.config.bottleHeight}, 실제 ${count}`);
                return false;
            }
        }

        // 빈 병 개수 확인
        const emptyBottles = this.countEmptyBottles(state);
        if (emptyBottles < GAME_CONFIG.MIN_EMPTY_BOTTLES) {
            console.log(`빈 병 부족: 최소 ${GAME_CONFIG.MIN_EMPTY_BOTTLES}개 필요, 실제 ${emptyBottles}개`);
            return false;
        }

        return true;
    }
}

// features/puzzle-generator/api/generator-api.ts
export class PuzzleGeneratorAPI {
    static generateEasyPuzzle(): Puzzle {
        const generator = new WaterSortPuzzleGenerator({
            numColors: 3,
            bottleHeight: 4,
            numBottles: 5
        });
        return generator.generate();
    }

    static generateMediumPuzzle(): Puzzle {
        const generator = new WaterSortPuzzleGenerator({
            numColors: 5,
            bottleHeight: 4,
            numBottles: 7
        });
        return generator.generate();
    }

    static generateHardPuzzle(): Puzzle {
        const generator = new WaterSortPuzzleGenerator({
            numColors: 8,
            bottleHeight: 4,
            numBottles: 10
        });
        return generator.generate();
    }

    static generateCustomPuzzle(config: GeneratorConfig): Puzzle {
        const generator = new WaterSortPuzzleGenerator(config);
        return generator.generate();
    }
}

// features/puzzle-generator/lib/utils.ts
export class PuzzleUtils {
    static printPuzzle(state: Puzzle): void {
        console.log('\n=== Water Sort Puzzle ===');
        const maxHeight = Math.max(...state.map(bottle => bottle.length), 1);

        // 위에서부터 출력
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

        // 병 번호 출력
        let bottleNumbers = '';
        for (let i = 0; i < state.length; i++) {
            bottleNumbers += ` ${i}  `;
        }
        console.log(bottleNumbers);
        console.log('========================\n');
    }

    static analyzePuzzle(state: Puzzle): void {
        console.log('=== 퍼즐 분석 ===');

        let mixedBottles = 0;
        let completedBottles = 0;
        let emptyBottles = 0;

        for (let i = 0; i < state.length; i++) {
            const bottle = state[i];
            if (bottle.length === 0) {
                emptyBottles++;
                console.log(`병 ${i}: 빈 병`);
            } else {
                const uniqueColors = new Set(bottle);
                if (uniqueColors.size === 1) {
                    completedBottles++;
                    console.log(`병 ${i}: 완성된 병 (색상 ${bottle[0]})`);
                } else {
                    mixedBottles++;
                    console.log(`병 ${i}: 섞인 병 (색상: ${Array.from(uniqueColors).join(', ')})`);
                }
            }
        }

        console.log(`\n총계: 섞인 병 ${mixedBottles}개, 완성된 병 ${completedBottles}개, 빈 병 ${emptyBottles}개`);
        console.log('================\n');
    }

    static validatePuzzleConstraints(state: Puzzle): boolean {
        const colorCounts = new Map<Color, number>();

        for (const bottle of state) {
            for (const color of bottle) {
                colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
            }
        }

        // 모든 색상이 같은 개수인지 확인
        const counts = Array.from(colorCounts.values());
        if (counts.length === 0) return false;

        const expectedCount = counts[0];
        const isValid = counts.every(count => count === expectedCount);

        if (!isValid) {
            console.log('색상 개수 불일치:', Object.fromEntries(colorCounts));
        }

        return isValid;
    }
}