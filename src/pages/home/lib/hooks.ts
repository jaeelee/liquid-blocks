import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Puzzle, GameState } from '/entities/game'
import { loadGame } from '/entities/game'

export const useHome = () => {
    const navigate = useNavigate()
    const [isVisible, setIsVisible] = useState<string | null>(null)
    const [game, setGame] = useState<Puzzle>([])
    const [revealedPositions, setRevealedPositions] = useState<GameState['revealedPositions']>({})
    const [settings, setSettings] = useState<Omit<GameState, 'puzzle' | 'revealedPositions'>>({
        difficulty: 'easy',
        bottleHeight: 4,
        numColors: 3,
    })

    const handleStartNewGame = () => {
        navigate('/game', { state: { settings } })
    }

    const handleResumeGame = () => {
        navigate('/game', { state: { game, settings, revealedPositions: revealedPositions ?? {} } })
    }

    const refresh = useCallback(() => {
        loadGame().then((saved) => {
            const { puzzle, difficulty, bottleHeight, numColors, revealedPositions: savedRevealed } = saved || {}
            setGame(puzzle || [])
            setRevealedPositions(savedRevealed ?? {})
            setSettings({
                difficulty: difficulty || 'easy',
                bottleHeight: bottleHeight || 4,
                numColors: numColors || 3,
            })
        })
    }, [])

    useEffect(() => { refresh() }, [refresh])

    return { isVisible, game, settings, setIsVisible, setSettings, handleStartNewGame, handleResumeGame }
}


