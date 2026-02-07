import type {Color, Puzzle} from '../../../entities/game';
import type {Difficulty} from '../../../entities/game/model/types';

export interface ColorVisibility {
  [key: string]: boolean; // "bottleIndex-colorIndex" 형식의 키
}

export interface VisiblePuzzle {
  bottles: Array<{
    colors: Array<{
      color: Color;
      isVisible: boolean;
    }>;
  }>;
}

export class DifficultyManager {
  private static instance: DifficultyManager;
  private colorVisibility: ColorVisibility = {};
  /** medium 난이도에서 한 번 정해진 랜덤 가림 상태 유지 */
  private initialMediumVisibility: ColorVisibility = {};

  static getInstance(): DifficultyManager {
    if (!DifficultyManager.instance) {
      DifficultyManager.instance = new DifficultyManager();
    }
    return DifficultyManager.instance;
  }

  /**
   * 난이도에 따른 색상 가시성 계산
   */
  calculateVisibility(
    puzzle: Puzzle,
    difficulty: Difficulty,
    revealedPositions?: ColorVisibility,
  ): VisiblePuzzle {
    const visibility = {...this.colorVisibility, ...revealedPositions};

    return {
      bottles: puzzle.map((bottle: Color[], bottleIndex: number) => ({
        colors: bottle.map((color: Color, colorIndex: number) => {
          const positionKey = `${bottleIndex}-${colorIndex}`;
          const isTopColor = colorIndex === bottle.length - 1;
          const isRevealed = visibility[positionKey];

          let isVisible = true;

          switch (difficulty) {
            case 'easy':
              // 모든 색상 표시
              isVisible = true;
              break;

            case 'medium':
              // 상단 색상은 항상 표시, 나머지는 50% 확률로 표시 (한 번 정해지면 유지)
              if (isTopColor) {
                isVisible = true;
              } else {
                if (isRevealed) {
                  isVisible = true;
                } else {
                  if (this.initialMediumVisibility[positionKey] === undefined) {
                    this.initialMediumVisibility[positionKey] = Math.random() > 0.5;
                  }
                  isVisible = this.initialMediumVisibility[positionKey];
                }
              }
              break;

            case 'hard':
              // 상단 색상만 표시
              isVisible = isTopColor || isRevealed;
              break;
          }

          return {
            color,
            isVisible,
          };
        }),
      })),
    };
  }

  /**
   * 특정 위치의 색상 공개
   */
  revealColor(bottleIndex: number, colorIndex: number): void {
    const positionKey = `${bottleIndex}-${colorIndex}`;
    this.colorVisibility[positionKey] = true;
  }

  /**
   * 병의 상단 색상 공개 (이동 시)
   */
  revealTopColors(puzzle: Puzzle): void {
    puzzle.forEach((bottle: Color[], bottleIndex: number) => {
      if (bottle.length > 0) {
        const topColorIndex = bottle.length - 1;
        this.revealColor(bottleIndex, topColorIndex);
      }
    });
  }

  /**
   * 현재 공개된 색상 정보 가져오기
   */
  getRevealedColors(): ColorVisibility {
    return {...this.colorVisibility};
  }

  /**
   * 공개된 색상 정보 초기화
   */
  resetRevealedColors(): void {
    this.colorVisibility = {};
    this.initialMediumVisibility = {};
  }

  /**
   * 색상 표시 여부 확인
   */
  isColorVisible(
    bottleIndex: number,
    colorIndex: number,
    revealedColors?: ColorVisibility,
  ): boolean {
    const positionKey = `${bottleIndex}-${colorIndex}`;
    return (revealedColors || this.colorVisibility)[positionKey] === true;
  }
}
