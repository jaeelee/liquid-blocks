export type Difficulty = 'easy' | 'medium' | 'hard'
export type Color = number
export type Bottle = Color[]
export type Puzzle = Bottle[]

/** 난이도용: "bottleIndex-colorIndex" → true 이면 공개된 색 */
export type RevealedPositions = Record<string, boolean>

export interface GameState {
    puzzle?: Puzzle
    bottleHeight: number
    numColors: number
    difficulty: Difficulty
    /** 이어하기 시 복원할, 이미 밝혀진 색 위치 */
    revealedPositions?: RevealedPositions
}


