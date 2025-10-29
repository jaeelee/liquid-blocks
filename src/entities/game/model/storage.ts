import type { GameState } from './types'

const GAME_STORAGE_KEY = 'current_game'

export const saveGame = async (game: GameState) => {
    try {
        localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(game))
    } catch { }
}

export const loadGame = async (): Promise<GameState | null> => {
    try {
        const data = localStorage.getItem(GAME_STORAGE_KEY)
        return data ? JSON.parse(data) as GameState : null
    } catch {
        return null
    }
}

export const clearGame = async () => {
    try { localStorage.removeItem(GAME_STORAGE_KEY) } catch { }
}


