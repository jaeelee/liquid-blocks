import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { DifficultyManager } from '/pages/game-board/lib/difficulty-manager';
import type { ColorVisibility } from '/pages/game-board/lib/difficulty-manager';
import { GameAPI } from '/pages/game-board/lib/game-logic';
import { Bottle } from '/pages/game-board/ui/bottle';

import { generatePuzzle, isSolved } from '/features/puzzle-generator';

import {
  COLOR,
  type GameState,
  type Puzzle,
  clearGame,
  saveGame,
} from '/entities/game';

export const Board: React.FC<{ bottleHeight?: number; numColors?: number }> = ({
  bottleHeight = 4,
  numColors = 10,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = location.state || {};
  const game = params.game as Puzzle | undefined;
  const settings = params.settings as GameState | undefined;
  const savedRevealed = params.revealedPositions as ColorVisibility | undefined;

  // 마운트 시점에 이어하기인지 새 게임인지 한 번만 확정(이후 재계산되지 않음)
  const isResuming = !!(game && game.length > 0);

  const finalBottleHeight = settings?.bottleHeight || bottleHeight;
  const finalNumColors = settings?.numColors || numColors;
  const finalNumBottles = finalNumColors + 2;

  const gameAPI = useMemo(
    () => new GameAPI(finalBottleHeight),
    [finalBottleHeight],
  );

  const difficulty = settings?.difficulty ?? 'easy';
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [solved, setSolved] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<ColorVisibility>(
    () => savedRevealed ?? {},
  );

  const difficultyManager = useMemo(() => DifficultyManager.getInstance(), []);

  // 새 퍼즐을 생성해 즉시 저장까지 하는 헬퍼. 이벤트 핸들러("다시하기" 클릭)에서만
  // 호출하며, 여기서는 saveGame 같은 부수효과를 실행해도 렌더 단계가 아니므로 안전하다.
  const startNewGame = useCallback((): Puzzle => {
    difficultyManager.resetRevealedColors();
    const puzzle = generatePuzzle({
      numColors: finalNumColors,
      bottleHeight: finalBottleHeight,
      numBottles: finalNumBottles,
    });
    saveGame({
      puzzle,
      bottleHeight: finalBottleHeight,
      numColors: finalNumColors,
      difficulty: settings?.difficulty || 'easy',
      revealedPositions: {},
    });
    return puzzle;
  }, [
    difficultyManager,
    finalNumColors,
    finalBottleHeight,
    finalNumBottles,
    settings,
  ]);

  // useState의 lazy initializer는 순수 생성만 담당한다(이어하기면 기존 game 그대로,
  // 아니면 새로 생성). localStorage 저장은 아래 useEffect로 분리했다 — 초기화 함수를
  // StrictMode가 두 번 호출해도(개발 모드) 버려지는 첫 호출 결과가 저장되는 일이 없다.
  const buildInitialPuzzle = useCallback((): Puzzle => {
    if (game && game.length > 0) return game;

    difficultyManager.resetRevealedColors();
    return generatePuzzle({
      numColors: finalNumColors,
      bottleHeight: finalBottleHeight,
      numBottles: finalNumBottles,
    });
  }, [
    game,
    difficultyManager,
    finalNumColors,
    finalBottleHeight,
    finalNumBottles,
  ]);

  const [puzzle, setPuzzle] = useState<Puzzle>(() => buildInitialPuzzle());

  // 새로 생성한 초기 퍼즐만, 실제로 렌더에 쓰인 상태 그대로 마운트 시 1회 저장한다.
  // ref 가드로 StrictMode의 effect 이중 실행 및 이후 puzzle 변경(이동) 시 재실행을 방지.
  const didSaveInitialPuzzle = useRef(false);
  useEffect(() => {
    if (isResuming || didSaveInitialPuzzle.current) return;
    didSaveInitialPuzzle.current = true;
    saveGame({
      puzzle,
      bottleHeight: finalBottleHeight,
      numColors: finalNumColors,
      difficulty: settings?.difficulty || 'easy',
      revealedPositions: {},
    });
  }, [isResuming, puzzle, finalBottleHeight, finalNumColors, settings]);

  const handleBottleClick = (index: number) => {
    if (selectedIndex > -1) {
      if (selectedIndex === index) {
        setSelectedIndex(-1);
        return;
      }

      const result = gameAPI.autoMoveLiquid(puzzle, selectedIndex, index);
      if (result.success && result.newState) {
        difficultyManager.revealTopColors(result.newState);
        const nextRevealed = difficultyManager.getRevealedColors();
        setRevealedPositions(nextRevealed);
        setPuzzle(result.newState);
        saveGame({
          puzzle: result.newState,
          bottleHeight: finalBottleHeight,
          numColors: finalNumColors,
          difficulty,
          revealedPositions: nextRevealed,
        });
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

  // 이어하기 시 불러온 밝힌 위치를 매니저에 반영 (이후 이동 시 getRevealedColors()에 포함되도록)
  useEffect(() => {
    if (
      game &&
      game.length > 0 &&
      savedRevealed &&
      Object.keys(savedRevealed).length > 0
    ) {
      difficultyManager.setRevealedPositions(savedRevealed);
    }
  }, [difficultyManager, game, savedRevealed]);

  const visiblePuzzle = useMemo(
    () =>
      difficultyManager.calculateVisibility(
        puzzle,
        difficulty,
        revealedPositions,
      ),
    [puzzle, difficulty, revealedPositions, difficultyManager],
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
                    setPuzzle(startNewGame());
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
            <div className="tube" key={index}>
              <Bottle
                maxLiquidCount={finalBottleHeight}
                onClick={() => handleBottleClick(index)}
                isSelected={selectedIndex === index}
                colors={bottle.colors.map(({ color, isVisible }) => ({
                  color: COLOR[color],
                  isVisible,
                }))}
              />
            </div>
          ))}
        </div>

        <div className="buttons">
          <button onClick={() => navigate(-1)}>뒤로가기</button>
        </div>
      </div>
    </>
  );
};
