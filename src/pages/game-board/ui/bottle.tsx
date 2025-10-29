import React from 'react'
import { LIQUID_HEIGHT } from '../lib/constants'
import './bottle.css'

interface Props {
    onClick: () => void
    colors: string[]
    isSelected?: boolean
    maxLiquidCount: number
}

export const Bottle: React.FC<Props> = React.memo(({ onClick, maxLiquidCount, colors, isSelected }) => {
    return (
        <button
            className={`bottle ${isSelected ? 'bottle-selected' : ''}`}
            style={{ height: maxLiquidCount * LIQUID_HEIGHT + 25 }}
            onClick={onClick}
        >
            {[...colors].reverse().map((color, idx) => {
                const isLast = idx === colors.length - 1
                return (
                    <div
                        key={idx}
                        className={`liquid ${isLast ? 'liquid-last' : ''}`}
                        style={{ backgroundColor: color }}
                    />
                )
            })}
        </button>
    )
})


