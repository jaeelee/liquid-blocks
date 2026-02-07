import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { COLOR, type GameState, type Puzzle } from "../../../entities/game";
import { PuzzleGeneratorAPI } from "../lib/game-generator";
import { GameAPI } from "../lib/game-logic";
import { clearGame, saveGame } from "../../../entities/game/model/storage";
import { isSolved } from "../lib/game-solver";
import { DifficultyManager } from "../lib/difficulty-manager";
import type { ColorVisibility } from "../lib/difficulty-manager";
import { Bottle } from "./bottle";

export const Board: React.FC<{ bottleHeight?: number; numColors?: number }> = ({
  bottleHeight = 4,
  numColors = 10,
}) => {
  //   const { handleStartNewGame } = useHome();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const params = location.state || {};
  const game = params.game as Puzzle | undefined;
  const settings = params.settings as GameState | undefined;

  const finalBottleHeight = settings?.bottleHeight || bottleHeight;
  const gameAPI = useMemo(
    () => new GameAPI(finalBottleHeight),
    [finalBottleHeight]
  );

  const difficulty = settings?.difficulty ?? "easy";
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [solved, setSolved] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<ColorVisibility>(() => ({}));

  const difficultyManager = useMemo(() => DifficultyManager.getInstance(), []);

  const generatePuzzle = useCallback(() => {
    if (game && game.length > 0) return game;

    difficultyManager.resetRevealedColors();
    const finalNumColors = settings?.numColors || numColors;
    const finalNumBottles = finalNumColors + 2;

    const puzzle: Puzzle = PuzzleGeneratorAPI.generateCustomPuzzle({
      numColors: finalNumColors,
      bottleHeight: finalBottleHeight,
      numBottles: finalNumBottles,
    });
    saveGame({
      puzzle,
      bottleHeight: finalBottleHeight,
      numColors: finalNumColors,
      difficulty: settings?.difficulty || "easy",
    });
    return puzzle;
  }, [game, settings, finalBottleHeight, numColors, difficultyManager]);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle());

  const handleBottleClick = (index: number) => {
    if (selectedIndex > -1) {
      if (selectedIndex === index) {
        setSelectedIndex(-1);
        return;
      }

      const result = gameAPI.autoMoveLiquid(puzzle, selectedIndex, index);
      if (result.success && result.newState) {
        difficultyManager.revealTopColors(result.newState);
        setRevealedPositions(difficultyManager.getRevealedColors());
        setPuzzle(result.newState);
        setSelectedIndex(-1);
      } else {
        setSelectedIndex(-1);
      }
    } else {
      if (puzzle[index].length === 0) return;
      if (
        puzzle[index].length === finalBottleHeight &&
        puzzle[index].every((c) => c === puzzle[index][0])
      )
        return;
      setSelectedIndex(index);
    }
  };

  useEffect(() => {
    difficultyManager.resetRevealedColors();
    setRevealedPositions({});
  }, [difficultyManager]);

  const visiblePuzzle = useMemo(
    () =>
      difficultyManager.calculateVisibility(puzzle, difficulty, revealedPositions),
    [puzzle, difficulty, revealedPositions, difficultyManager]
  );

  useEffect(() => {
    if (isSolved(puzzle, finalBottleHeight)) {
      setSolved(true);
      clearGame();
    }
  }, [puzzle, finalBottleHeight]);

  return (
    <>
      <div className="board-container">
        {solved && (
          <div className="modal">
            <div className="modal-body">
              <div className="modal-title">축하합니다! 완료되었습니다 🎉</div>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setSolved(false);
                    setRevealedPositions({});
                    setPuzzle(generatePuzzle());
                  }}
                >
                  다시하기
                </button>
                <button onClick={() => navigate(-1)}>뒤로가기</button>
              </div>
            </div>
          </div>
        )}

        <div className="board-grid">
          {visiblePuzzle.bottles.map((bottle, index) => (
            <Bottle
              key={index}
              maxLiquidCount={finalBottleHeight}
              onClick={() => handleBottleClick(index)}
              isSelected={selectedIndex === index}
              colors={bottle.colors.map(({ color, isVisible }) => ({
                color: COLOR[color],
                isVisible,
              }))}
            />
          ))}
        </div>

        <div className="buttons">
          <button onClick={() => navigate(-1)}>뒤로가기</button>
        </div>
      </div>
    </>
  );
};
