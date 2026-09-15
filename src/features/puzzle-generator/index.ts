export { generatePuzzle } from '/features/puzzle-generator/lib/generator';
export {
  isSolvable,
  isSolved,
  solvePuzzle,
} from '/features/puzzle-generator/lib/solver';
export {
  GENERATOR_LIMITS,
  resolvePuzzleConfig,
} from '/features/puzzle-generator/model/config';
export type {
  PuzzleGeneratorConfig,
  ResolvedPuzzleConfig,
} from '/features/puzzle-generator/model/config';
export type { Move } from '/features/puzzle-generator/model/move';
