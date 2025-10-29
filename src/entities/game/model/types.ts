export type Difficulty = 'easy' | 'medium' | 'hard'
export type Color = number
export type Bottle = Color[]
export type Puzzle = Bottle[]

export interface GameState {
    puzzle?: Puzzle
    bottleHeight: number
    numColors: number
    difficulty: Difficulty
}


