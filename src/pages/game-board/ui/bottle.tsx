import React from "react";
import { LIQUID_HEIGHT } from '/pages/game-board/lib/constants';

export interface LiquidColor {
  color: string;
  isVisible: boolean;
}

interface Props {
  onClick: () => void;
  colors: LiquidColor[];
  isSelected?: boolean;
  maxLiquidCount: number;
}

export const Bottle: React.FC<Props> = React.memo(
  ({ onClick, maxLiquidCount, colors, isSelected }) => {
    return (
      <button
        className={`bottle ${isSelected ? "bottle-selected" : ""}`}
        style={{ height: maxLiquidCount * LIQUID_HEIGHT + 25 }}
        onClick={onClick}
      >
        {[...colors].reverse().map(({ color, isVisible }, idx) => {
          const isLast = idx === colors.length - 1;
          return (
            <div
              key={idx}
              className={`liquid ${isLast ? "liquid-last" : ""} ${!isVisible ? "liquid-hidden" : ""}`}
              style={{
                backgroundColor: isVisible ? color : "var(--liquid-hidden, #888)",
                opacity: isVisible ? 1 : 0.6,
              }}
            />
          );
        })}
      </button>
    );
  }
);
