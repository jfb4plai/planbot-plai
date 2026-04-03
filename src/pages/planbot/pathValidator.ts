// ===== PlanBot — validateur de chemin =====

import type { Command, GridDef, LevelConfig, SimStep, ValidationResult } from './types';

const DELTAS: Record<Command, [number, number]> = {
  U: [-1, 0],
  D: [1, 0],
  L: [0, -1],
  R: [0, 1],
};

function applyFlip(cmd: Command, modifierActive: boolean): Command {
  if (!modifierActive) return cmd;
  if (cmd === 'L') return 'R';
  if (cmd === 'R') return 'L';
  return cmd;
}

export function validatePath(
  grid: GridDef,
  commands: Command[],
  config: LevelConfig,
  maxRepConsecutive: number,
): ValidationResult {
  // Check max commands
  if (config.maxCmds !== null && commands.length > config.maxCmds) {
    return { ok: false, reason: 'too_many_cmds' };
  }

  // Check repetition limit
  if (maxRepConsecutive > 0 && commands.length > 1) {
    for (let i = 0; i <= commands.length - (maxRepConsecutive + 1); i++) {
      const base = commands[i];
      let allSame = true;
      for (let j = 1; j <= maxRepConsecutive; j++) {
        if (commands[i + j] !== base) { allSame = false; break; }
      }
      if (allSame) return { ok: false, reason: 'rep_limit' };
    }
  }

  // Simulate movement
  let [row, col] = grid.robotPos;
  let modifierActive = false;
  const keysCollected: number[] = [];
  const simSteps: SimStep[] = [];

  for (const rawCmd of commands) {
    const cmd = applyFlip(rawCmd, modifierActive);
    const [dr, dc] = DELTAS[cmd];
    const newRow = row + dr;
    const newCol = col + dc;

    // Bounds check
    if (newRow < 0 || newRow >= grid.size || newCol < 0 || newCol >= grid.size) {
      return { ok: false, reason: 'out_of_bounds' };
    }

    // Obstacle check
    const cell = grid.cells[newRow][newCol];
    if (cell === 'obstacle') {
      return { ok: false, reason: 'obstacle' };
    }

    row = newRow;
    col = newCol;

    // Collect modifier
    if (cell === 'modifier') {
      modifierActive = true;
    }

    // Collect keys
    for (let k = 0; k < grid.keyPositions.length; k++) {
      const [kr, kc] = grid.keyPositions[k];
      if (row === kr && col === kc && !keysCollected.includes(k)) {
        keysCollected.push(k);
      }
    }

    simSteps.push({
      pos: [row, col],
      keysCollected: [...keysCollected],
      modifierActive,
    });
  }

  // Check star reached
  const [sr, sc] = grid.starPos;
  if (row !== sr || col !== sc) {
    return { ok: false, reason: 'no_star' };
  }

  // Check keys collected
  if (config.keyCount > 0) {
    for (let k = 0; k < config.keyCount; k++) {
      if (!keysCollected.includes(k)) {
        return { ok: false, reason: 'missing_key' };
      }
      // Check order: key k must be collected before key k+1
      if (k > 0) {
        const prevIdx = simSteps.findIndex(s => s.keysCollected.includes(k - 1));
        const currIdx = simSteps.findIndex(s => s.keysCollected.includes(k));
        if (currIdx < prevIdx) {
          return { ok: false, reason: 'wrong_key_order' };
        }
      }
    }
  }

  return { ok: true, simSteps };
}

export const VALIDATION_MESSAGES: Record<string, string> = {
  out_of_bounds: 'Le robot sort de la grille ! Repère bien les bords avant de valider.',
  obstacle: 'Le robot heurte un mur 🧱 ! Trace le trajet case par case et repère à quelle commande ça coince.',
  no_star: "Le robot n'a pas atteint l'étoile ⭐. Continue à planifier le chemin !",
  missing_key: 'N\'oublie pas de ramasser la clé 🔑 avant d\'arriver à l\'étoile !',
  wrong_key_order: 'Les clés doivent être ramassées dans l\'ordre : d\'abord la première 🔑, puis la deuxième !',
  too_many_cmds: 'Trop de commandes ! Essaie de trouver un chemin plus court.',
  rep_limit: 'Tu répètes trop souvent la même direction. Varie tes commandes !',
};

export function wouldViolateRepLimit(
  commands: Command[],
  next: Command,
  maxRep: number,
): boolean {
  if (maxRep === 0 || commands.length === 0) return false;
  let count = 0;
  for (let i = commands.length - 1; i >= 0; i--) {
    if (commands[i] === next) count++;
    else break;
  }
  return count >= maxRep;
}
