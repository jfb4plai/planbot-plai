// ===== PlanBot — grilles prédéfinies =====
// 3 tranches d'âge × 6 niveaux × 2 variantes = 36 grilles.
// Toutes les solutions ont été vérifiées.

import type { AgeGroup, CellType, GridDef } from './types';

function build(
  size: number,
  robotPos: [number, number],
  starPos: [number, number],
  obstacles: [number, number][],
  keys: [number, number][] = [],
  modifierPos?: [number, number],
): GridDef {
  const cells: CellType[][] = Array.from({ length: size }, () =>
    Array(size).fill('empty' as CellType),
  );
  cells[robotPos[0]][robotPos[1]] = 'robot';
  cells[starPos[0]][starPos[1]] = 'star';
  for (const [r, c] of obstacles) cells[r][c] = 'obstacle';
  if (keys[0]) cells[keys[0][0]][keys[0][1]] = 'key1';
  if (keys[1]) cells[keys[1][0]][keys[1][1]] = 'key2';
  if (modifierPos) cells[modifierPos[0]][modifierPos[1]] = 'modifier';
  return { size, cells, robotPos, starPos, keyPositions: keys, modifierPos };
}

// ─── Tranche 6 ans — grilles 3×3 (niveaux 1-2) et 4×4 (niveaux 3-6) ───

// Niveau 1 — 3×3, pas d'obstacle
// Var A : →→↓↓ ou ↓↓→→   |   Var B : ←←↓↓ ou ↓↓←←
const g6_L1: GridDef[] = [
  build(3, [0, 0], [2, 2], []),
  build(3, [0, 2], [2, 0], []),
];

// Niveau 2 — 3×3, 1 obstacle en (1,1)
// Var A : →→↓↓ = (0,0)→(0,1)→(0,2)↓(1,2)↓(2,2) ✓
// Var B : ↓↓←← = (0,2)↓(1,2)↓(2,2)←(2,1)←(2,0) ✓
const g6_L2: GridDef[] = [
  build(3, [0, 0], [2, 2], [[1, 1]]),
  build(3, [0, 2], [2, 0], [[1, 1]]),
];

// Niveau 3 — 4×4, pas de clé
// Var A : →→→↓↓↓ ou ↓↓↓→→→   |   Var B : ←←←↓↓↓ ou ↓↓↓←←←
const g6_L3: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 1], [2, 2]]),
  build(4, [0, 3], [3, 0], [[1, 2], [2, 1]]),
];

// Niveau 4 — 4×4, obstacles différents
// Var A : →→→↓↓↓ = (0,0)→…→(0,3)↓(1,3)↓(2,3)↓(3,3) ✓  obstacles (1,0)(2,2) hors chemin
// Var B : ←←←↓↓↓ = (0,3)←…←(0,0)↓(1,0)↓(2,0)↓(3,0) ✓  obstacles (1,3)(2,1) hors chemin
const g6_L4: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 0], [2, 2]]),
  build(4, [0, 3], [3, 0], [[1, 3], [2, 1]]),
];

// Niveau 5 — 4×4, 1 clé
// Var A : ↓→→→↓↓ = (0,0)↓(1,0)→(1,1)→(1,2)→(1,3)[k1]↓(2,3)↓(3,3) ✓
// Var B : ←↓↓←↓← = (0,3)←(0,2)↓(1,2)↓(2,2)←(2,1)[k1]↓(3,1)←(3,0) ✓
const g6_L5: GridDef[] = [
  build(4, [0, 0], [3, 3], [[2, 0], [0, 2]], [[1, 3]]),
  build(4, [0, 3], [3, 0], [[1, 3], [0, 1]], [[2, 1]]),
];

// Niveau 6 — 4×4, 1 clé, obstacles différents
// Var A : ↓→→↓↓ = (0,0)↓(1,0)→(1,1)→(1,2)[k1]↓(2,2)↓(3,2) ✓  obstacles (0,3)(2,0) hors chemin
// Var B : ↓←←↓↓ = (0,3)↓(1,3)←(1,2)←(1,1)[k1]↓(2,1)↓(3,1) ✓  obstacles (0,0)(2,3) hors chemin
const g6_L6: GridDef[] = [
  build(4, [0, 0], [3, 2], [[0, 3], [2, 0]], [[1, 2]]),
  build(4, [0, 3], [3, 1], [[0, 0], [2, 3]], [[1, 1]]),
];

// ─── Tranche 7-10 ans — grilles 4×4 ───

// Niveau 1 — 4×4, libre, pas de clé
// Var A : →→→↓↓↓ ou ↓↓↓→→→   |   Var B : ←←←↓↓↓ ou ↓↓↓←←←
const g7_L1: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 1], [2, 2]]),
  build(4, [0, 3], [3, 0], [[1, 2], [2, 1]]),
];

// Niveau 2 — 4×4, max 8, pas de clé
// Var A : ↓↓↓→→→ (6 cmds ≤ 8) ✓  obstacles (1,1)(2,3) hors chemin
// Var B : ↓↓↓←←← (6 cmds ≤ 8) ✓  obstacles (1,2)(2,2) hors chemin... wait
// Var B : ↓↓↓←←← = (0,3)↓(1,3)↓(2,3)↓(3,3)←(3,2)←(3,1)←(3,0)  obstacles (1,2)(2,2) hors chemin ✓
const g7_L2: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 1], [2, 3]]),
  build(4, [0, 3], [3, 0], [[1, 2], [2, 2]]),
];

// Niveau 3 — 4×4, max 6, pas de clé
// Var A : →→→↓↓↓ (6 cmds) ✓
// Var B : ↓↓→→→ (5 cmds ≤ 6) ✓
const g7_L3: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 1], [2, 2]]),
  build(4, [0, 0], [2, 3], [[0, 2], [1, 1]]),
];

// Niveau 4 — 4×4, max 8, 1 clé
// Var A : ↓→→→↓↓ (6 cmds ≤ 8) ✓
// Var B : ←↓↓←↓← (6 cmds ≤ 8) ✓
const g7_L4: GridDef[] = [
  build(4, [0, 0], [3, 3], [[2, 0], [0, 2]], [[1, 3]]),
  build(4, [0, 3], [3, 0], [[1, 3], [0, 1]], [[2, 1]]),
];

// Niveau 5 — 4×4, max 7, 1 clé
// Var A : →↓→→↓↓ (6 cmds ≤ 7) = (0,0)→(0,1)↓(1,1)→(1,2)→(1,3)[k1]↓(2,3)↓(3,3) ✓
//   obstacles (0,2)(2,1) hors chemin ✓
// Var B : ←↓←←↓↓ (6 cmds ≤ 7) = (0,3)←(0,2)↓(1,2)←(1,1)←(1,0)[k1]↓(2,0)↓(3,0) ✓
//   obstacles (0,1)(2,2) hors chemin ✓
const g7_L5: GridDef[] = [
  build(4, [0, 0], [3, 3], [[0, 2], [2, 1]], [[1, 3]]),
  build(4, [0, 3], [3, 0], [[0, 1], [2, 2]], [[1, 0]]),
];

// Niveau 6 — 4×4, max 6, 1 clé
// Var A : →→→↓↓↓ (6 cmds) = (0,0)→(0,1)→(0,2)→(0,3)↓(1,3)↓(2,3)[k1]↓(3,3) ✓
//   obstacles (1,2)(2,0) hors chemin ✓
// Var B : ←←←↓↓↓ (6 cmds) = (0,3)←(0,2)←(0,1)←(0,0)↓(1,0)↓(2,0)[k1]↓(3,0) ✓
//   obstacles (1,1)(2,3) hors chemin ✓
const g7_L6: GridDef[] = [
  build(4, [0, 0], [3, 3], [[1, 2], [2, 0]], [[2, 3]]),
  build(4, [0, 3], [3, 0], [[1, 1], [2, 3]], [[2, 0]]),
];

// ─── Tranche 11-13 ans — grilles 5×5 ───

// Niveau 1 — 5×5, libre, pas de clé
// Var A : →→→→↓↓↓↓ ou ↓↓↓↓→→→→ (8 cmds)  obstacles diagonale hors chemins bordure ✓
// Var B : ←←←←↓↓↓↓ ou ↓↓↓↓←←←← (8 cmds) ✓
const g11_L1: GridDef[] = [
  build(5, [0, 0], [4, 4], [[1, 1], [2, 2], [3, 3]]),
  build(5, [0, 4], [4, 0], [[1, 3], [2, 2], [3, 1]]),
];

// Niveau 2 — 5×5, max 10, pas de clé
// Var A : →→→→↓↓↓↓ (8 cmds ≤ 10) ✓  obstacles (1,1)(2,3)(3,0) hors chemin bordure ✓
// Var B : ←←←←↓↓↓↓ (8 cmds ≤ 10) ✓  obstacles (1,3)(2,1)(3,4) hors chemin bordure ✓
const g11_L2: GridDef[] = [
  build(5, [0, 0], [4, 4], [[1, 1], [2, 3], [3, 0]]),
  build(5, [0, 4], [4, 0], [[1, 3], [2, 1], [3, 4]]),
];

// Niveau 3 — 5×5, max 10, 1 clé
// Var A : →→↓↓→→↓↓ (8 cmds ≤ 10)
//   (0,0)→(0,1)→(0,2)↓(1,2)↓(2,2)→(2,3)→(2,4)[k1]↓(3,4)↓(4,4) ✓
//   obstacles (0,3)(2,1)(4,2) hors chemin ✓
// Var B : ←←↓↓←←↓↓ (8 cmds ≤ 10)
//   (0,4)←(0,3)←(0,2)↓(1,2)↓(2,2)←(2,1)←(2,0)[k1]↓(3,0)↓(4,0) ✓
//   obstacles (0,1)(2,3)(4,2) hors chemin ✓
const g11_L3: GridDef[] = [
  build(5, [0, 0], [4, 4], [[0, 3], [2, 1], [4, 2]], [[2, 4]]),
  build(5, [0, 4], [4, 0], [[0, 1], [2, 3], [4, 2]], [[2, 0]]),
];

// Niveau 4 — 5×5, max 10, 2 clés
// Var A : →→→↓↓→↓↓ (8 cmds ≤ 10)
//   (0,0)→(0,1)→(0,2)→(0,3)[k1]↓(1,3)↓(2,3)→(2,4)[k2]↓(3,4)↓(4,4) ✓
// Var B : →↓↓↓↓→→→ (8 cmds ≤ 10)
//   (0,0)→(0,1)↓(1,1)↓(2,1)[k1]↓(3,1)↓(4,1)→(4,2)[k2]→(4,3)→(4,4) ✓
const g11_L4: GridDef[] = [
  build(5, [0, 0], [4, 4], [[1, 1], [3, 3]], [[0, 3], [2, 4]]),
  build(5, [0, 0], [4, 4], [[1, 2], [3, 0]], [[2, 1], [4, 2]]),
];

// Niveau 5 — 5×5, max 12, modificateur, pas de clé
// Var A : →→↓↓←←↓↓ (8 cmds ≤ 12, avec flip en (2,2))
//   (0,0)→→(0,2)↓↓(2,2)[flip] → ← devient → : ←(2,3)←(2,4)↓(3,4)↓(4,4) ✓
// Var B : ←←↓↓→→↓↓ (8 cmds ≤ 12, avec flip en (2,2))
//   (0,4)←←(0,2)↓↓(2,2)[flip] → → devient ← : →(2,1)→(2,0)↓(3,0)↓(4,0) ✓
const g11_L5: GridDef[] = [
  build(5, [0, 0], [4, 4], [[2, 0], [2, 1]], [], [2, 2]),
  build(5, [0, 4], [4, 0], [[2, 3], [2, 4]], [], [2, 2]),
];

// Niveau 6 — 5×5, max 12, 1 clé + modificateur
// Var A : →→↓↓↓←←↓ (8 cmds ≤ 12)
//   (0,0)→(0,1)→(0,2)↓(1,2)[k1]↓(2,2)↓(3,2)[mod,flip]←=→(3,3)←=→(3,4)↓(4,4) ✓
// Var B : ←←↓↓↓→→↓ (8 cmds ≤ 12)
//   (0,4)←(0,3)←(0,2)↓(1,2)[k1]↓(2,2)↓(3,2)[mod,flip]→=←(3,1)→=←(3,0)↓(4,0) ✓
const g11_L6: GridDef[] = [
  build(5, [0, 0], [4, 4], [[0, 3], [4, 2]], [[1, 2]], [3, 2]),
  build(5, [0, 4], [4, 0], [[0, 1], [4, 2]], [[1, 2]], [3, 2]),
];

// ─── Index global ───

export const GROUP_GRIDS: Record<AgeGroup, GridDef[][]> = {
  '6':     [g6_L1,  g6_L2,  g6_L3,  g6_L4,  g6_L5,  g6_L6],
  '7-10':  [g7_L1,  g7_L2,  g7_L3,  g7_L4,  g7_L5,  g7_L6],
  '11-13': [g11_L1, g11_L2, g11_L3, g11_L4, g11_L5, g11_L6],
};

export function pickGroupGrid(ageGroup: AgeGroup, level: number): GridDef {
  const pool = GROUP_GRIDS[ageGroup][level - 1];
  return pool[Math.floor(Math.random() * pool.length)];
}
