# Water Sort Puzzle — 게임 로직 정리

리팩토링(`feat/LIQB_1`) 전 시점 기준, 현재 구현된 게임 로직을 있는 그대로 정리한 문서. 코드 변경 없이 현재 동작을 기술한다.

## 1. 도메인 타입

`src/entities/game/model/types.ts`

- `Color = number` — 색상은 정수 ID. `0`은 "없음", `1..N`이 실제 색. hex 매핑은 `src/entities/game/lib/constants.ts`의 `COLOR` 배열(인덱스 1~20)을 사용.
- `Bottle = Color[]` — 병 하나. 배열 인덱스 0이 바닥, 마지막 요소가 맨 위(top).
- `Puzzle = Bottle[]` — 병 전체 상태.
- `GameState { puzzle?, bottleHeight, numColors, difficulty, revealedPositions? }` — localStorage에 저장되는 세이브 데이터 형태.
- `RevealedPositions = Record<string, boolean>` — `"bottleIndex-colorIndex"` 키로 공개된 위치를 표시(난이도 가시성용).

## 2. 이동 규칙 — `LiquidMover` (`src/pages/game-board/lib/game-logic.ts:14`)

병 높이(`bottleHeight`, 기본값 `4`)를 생성자에서 받는다.

- **`calculateActualMoveAmount(state, move)`** (97번 줄) — 실제 이동 가능 여부/수량을 계산하는 핵심 함수.
  1. 출발 병(`from`)이 비어 있으면 0.
  2. 출발 병 **맨 위부터 연속된 같은 색**의 개수(`consecutiveCount`)를 센다.
  3. 목적지 병의 남은 용량 `availableSpace = bottleHeight - toBottle.length`. 0 이하면 이동 불가(0 반환).
  4. 목적지가 비어 있지 않으면, 목적지 맨 위 색과 출발 맨 위 색이 같아야 한다. 다르면 0.
  5. 최종 이동량 = `min(요청량, consecutiveCount, availableSpace)`.
- **`executeMove(state, move)`** (133번 줄) — 상태를 깊은 복사한 뒤 출발 병 끝에서 `splice(-amount)`로 꺼내 목적지 병에 `push`. 원본 배열은 변경하지 않는다.
- **`moveLiquid(state, move)`** (24번 줄) — `validateMove` → `calculateActualMoveAmount` → `executeMove` 순으로 실행하는 공개 진입점. 지정한 양(`amount`)만큼 정확히 이동하려 시도.
- **`autoMoveLiquid(state, from, to)`** (149번 줄) — `amount = bottleHeight`로 최대 이동량을 계산해 `moveLiquid`에 위임. **실제로 UI(`board.tsx`)가 사용하는 유일한 이동 함수.**
- **`findPossibleMoves` / `findAllPossibleMoves`** (185, 212번 줄) — 특정 병 또는 전체에서 가능한 이동 목록 계산. UI에서는 미사용.
- **`isGameCompleted(state)`** (226번 줄) — 모든 병이 "비었거나, 정확히 `bottleHeight`만큼 차 있고 단색"이면 완료.
- **`evaluateMove` / `calculateGameScore` / `getColorGroups`** (243~305번 줄) — 이동 전후 점수 비교용 휴리스틱. 빈 병 +1, 같은 색 연속 구간마다 `length²`, 완성된 단색 병에 보너스 +20(하드코딩). UI 미사용.

`GameAPI`(312번 줄)는 `LiquidMover`를 감싼 얇은 래퍼. `board.tsx`는 `new GameAPI(bottleHeight)`를 만들어 `autoMoveLiquid` 하나만 호출한다.

### 미사용 / 디버그 코드 (game-logic.ts)

- `GameUtils`(369번 줄), `PuzzleUtils`(463번 줄, non-export), `testLiquidMovement()`(407번 줄) — 콘솔 데모/디버그 용도이며 어디서도 import되지 않음. `console.log` 다수 포함(375, 379, 387, 391, 394, 399, 401~~402, 420, 427, 433, 437, 443, 447, 456~~459, 465, 478, 485~486번 줄).
- `LiquidMover.moveLiquid`(정확량 지정), `findAllPossibleMoves`, `findPossibleMoves`, `evaluateMove`, `isGameCompleted`/`GameAPI.isCompleted` — 프로덕션 경로에서 호출되지 않음.

## 3. 완료 판정 — `isSolved` (`src/pages/game-board/lib/game-solver.ts:9`)

```ts
export const isSolved = (Puzzle, bottleHeight = BOTTLE_HEIGHT) =>
  Puzzle.every(
    (bottle) =>
      bottle.length === 0 ||
      (bottle.length === bottleHeight && bottle.every((c) => c === bottle[0])),
  );
```

- `board.tsx`의 `useEffect`(123번 줄)가 매 `puzzle` 변경마다 호출해 클리어 여부를 판정하는 **유일하게 실제 사용되는 솔버 함수**.
- **버그**: 18번 줄에 `console.log(bottle.length, bottleHeight)`가 남아 있어 판정마다(=리렌더마다) 콘솔에 출력됨.
- 매개변수명이 타입명과 동일하게 `Puzzle`로 섀도잉되어 있음(가독성 문제, 동작에는 영향 없음).

### 완료 판정 3중 중복

같은 "퍼즐이 풀렸는가"를 서로 다른 기준으로 세 곳에서 각각 구현:

| 함수                          | 위치              | 기준                                                       |
| ----------------------------- | ----------------- | ---------------------------------------------------------- |
| `isSolved`                    | game-solver.ts:9  | 빈 병 OR (가득 차고 단색)                                  |
| `LiquidMover.isGameCompleted` | game-logic.ts:226 | 동일 기준이나 별도 구현                                    |
| `isGoalState` (솔버 내부)     | game-solver.ts:45 | **가득 참을 검사하지 않음** — 단색이기만 하면 통과(불일치) |

## 4. A* 솔버 (`src/pages/game-board/lib/game-solver.ts`)

`isSolved` 외 나머지는 모두 **어디서도 import되지 않는 죽은 코드**.

- `PriorityQueue<T>`(28번 줄) — 매 `enqueue`마다 전체 배열을 재정렬(33번 줄), O(n log n)/삽입으로 비효율적.
- `isGoalState`(45번 줄) — 위 표 참고, `isSolved`와 판정 기준이 다름.
- `getValidMoves(state)`(62번 줄) — 출발 병 맨 위 연속 동색 개수 계산 후, 목적지가 비었거나 `길이 < 4`(**하드코딩, `bottleHeight` 미사용**)이고 색이 같으면 이동 후보로 추가(89~~92번 줄). `bottleHeight`가 4가 아닌 설정(picker는 4~~10 지원)에서 오작동.
- `applyMove(state, move)`(100번 줄) — `game-logic.ts`의 `executeMove`와 동일한 로직을 별도로 재구현(중복).
- 휴리스틱: `countMisplacedColors`, `countIncompleteBottles`, `calculateColorDispersion`(107~154번 줄) → `heuristic` 합산.
- `solvePuzzle(initialState)`(164번 줄) — A* 탐색. `visited` Set으로 방문 상태 스킵, 해를 찾으면 `Move[]` 경로 반환, 없으면 `null`. **종료 조건이 상태공간 소진뿐이라 이론상 큰 설정에서 오래 걸릴 수 있음(상한 없음).**
- `printSolution`(217번 줄) — 콘솔 출력용, export는 되어 있으나 미사용.

`game-solver copy.ts`는 위 파일의 이전 스냅샷이 **전체 주석 처리**된 상태로 남아 있는 중복 파일(경로만 옛 `src/...` 프리픽스). 아무 곳에서도 import되지 않는 완전한 죽은 파일.

## 5. 퍼즐 생성 — `game-generator.ts`

`WaterSortPuzzleGenerator` / 공개 API `PuzzleGeneratorAPI.generateCustomPuzzle(config)`.

- `GAME_CONFIG`(11번 줄): `MIN_COLORS=2`, `MIN_BOTTLE_HEIGHT=4`, `DEFAULT_MIXING_STEPS=200`, `MAX_GENERATION_ATTEMPTS=10`, `MIN_EMPTY_BOTTLES=2`.
- `validateConfig`(33번 줄) — `numColors`/`bottleHeight` **최솟값만** 검사. 상한 없음.
- `generate()`(46번 줄):
  1. `createDirectlyMixedState()`로 색상 1..numColors를 각 `bottleHeight`개씩 만들어 Fisher-Yates 셔플 후 병에 순서대로 분배, 마지막에 빈 병 `MIN_EMPTY_BOTTLES(2)`개 추가.
  2. `isCompletelyMixed()`(인접 셀 색상 중복 금지) AND `hasValidStructure()`(색상별 정확히 `bottleHeight`개, 빈 병 수 확인)를 통과할 때까지 반복.
  3. **버그**: 루프가 `while (true)`(49번 줄)이고 `attempts`가 증가하지 않아 `MAX_GENERATION_ATTEMPTS`가 무의미. 조건이 오래 안 맞으면 메인 스레드가 멈출 수 있음.
  4. **풀이 가능성 미검증**: 구조(색상 수량·인접 중복·빈 병 수)만 확인할 뿐, 생성된 퍼즐이 실제로 룰대로 풀리는지는 어디서도 검사하지 않는다. `solvePuzzle`/`isSolved`가 생성 경로에서 전혀 호출되지 않기 때문.
  5. 성공 로그(57번 줄)가 `attempts + 1`을 출력하지만 `attempts`가 항상 0이라 매번 "1번째 시도"로 표시됨(사실과 무관).
- `PuzzleGeneratorAPI`의 `generateEasyPuzzle`/`generateMediumPuzzle`/`generateHardPuzzle` 프리셋은 미사용(실제로는 `generateCustomPuzzle`만 board에서 호출).
- `PuzzleUtils`(211번 줄, game-generator.ts 내부의 별도 클래스, game-logic.ts의 동명 클래스와 다름) — 콘솔 디버그용, 미사용.

## 6. 난이도별 색상 가시성 — `DifficultyManager` (`src/pages/game-board/lib/difficulty-manager.ts`)

싱글턴(`getInstance`). 상태는 인스턴스 필드에만 존재(메모리).

- **easy**: 항상 전부 표시.
- **medium**: 맨 위 색은 항상 표시. 나머지는 위치키(`"bottleIndex-colorIndex"`)별로 `Math.random() > 0.5`를 **한 번만** 굴려 `initialMediumVisibility`에 저장, 이후 세션 동안 유지.
- **hard**: 맨 위 색 또는 이미 공개된(`revealTopColors`로 이동 시 누적) 위치만 표시.
- `revealTopColors(puzzle)` — 이동 후 각 병의 새 맨 위 색을 `colorVisibility`에 영구 공개 처리.
- `resetRevealedColors()` — `colorVisibility`와 `initialMediumVisibility` 둘 다 초기화(새 게임 시작 시 호출).
- **저장 한계**: `initialMediumVisibility`(medium의 랜덤 시드)는 localStorage에 저장되지 않음 — 새로고침 후 이어하기를 하면 아직 공개되지 않았던 medium 칸들이 재랜덤화될 수 있음. 반면 `getRevealedColors()`로 꺼낸 "이미 공개된" 위치는 `saveGame`을 통해 저장/복원됨.

## 7. localStorage 저장 — `src/entities/game/model/storage.ts`

- 키: `current_game`.
- `saveGame`/`loadGame`/`clearGame` 모두 동기 `localStorage` API를 불필요하게 `async` 함수로 감싸고, 오류는 `catch {}`로 조용히 무시.

## 8. UI 통합 지점 — `board.tsx`

- `import { GameAPI } from '.../game-logic'` → `new GameAPI(finalBottleHeight)` → `autoMoveLiquid`만 호출(73번 줄).
- `import { isSolved } from '.../game-solver'` → `useEffect`에서 매 `puzzle` 변경마다 호출(124번 줄).
- 퍼즐 생성: `useState(() => generatePuzzle())`의 lazy initializer 안에서 `PuzzleGeneratorAPI.generateCustomPuzzle(...)` 호출 + `saveGame(...)` 호출 — **렌더 단계에서 부수효과 발생**. React `StrictMode`(main.tsx)에서 initializer가 두 번 호출될 수 있어 생성/저장이 중복될 위험.
- `location.state`를 `useLocation() as any`로 받아 타입 안전성 없이 `game`/`settings`/`revealedPositions`를 꺼냄.

## 9. 알려진 이슈 요약

1. `game-generator.ts` `generate()` — `while(true)` + `attempts` 미증가 → 무한루프 위험, 시도 횟수 상한 무의미.
2. 생성된 퍼즐의 **풀이 가능성 미검증** — 이미 존재하는 A* 솔버가 연결되지 않음.
3. `game-solver.ts:18` — `isSolved` 내부에 디버그 `console.log` 잔존 → 매 완료 체크마다 콘솔 오염.
4. `game-solver.ts:91` — `getValidMoves`에 병 높이 `4`가 하드코딩되어 `bottleHeight`가 4가 아닌 설정에서 솔버가 오작동(다만 솔버 자체가 현재 미사용).
5. 완료 판정 로직 3중 중복(`isSolved` / `isGoalState` / `LiquidMover.isGameCompleted`) — 서로 기준이 미묘하게 다름(`isGoalState`는 가득 참 여부를 검사하지 않음).
6. 이동 계산 로직 중복(`LiquidMover.calculateActualMoveAmount`/`executeMove` vs 솔버의 `getValidMoves`/`applyMove`) — 규칙 변경 시 한쪽만 고치면 불일치 발생 가능.
7. `board.tsx`의 `useState` lazy initializer 안에서 퍼즐 생성 + `saveGame` 호출 — 렌더 중 부수효과, StrictMode에서 중복 실행 위험.
8. `game-solver copy.ts` — 전체 주석 처리된 죽은 중복 파일.
9. `game-logic.ts`의 `GameUtils`/`PuzzleUtils`/`testLiquidMovement` — 콘솔 데모 코드, 프로덕션에서 미사용.
