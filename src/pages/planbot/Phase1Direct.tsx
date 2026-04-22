// ===== PlanBot — Mode exécution directe (sans planification) =====

import { useMemo, useState } from 'react';
import type { Command, GridDef, LevelConfig, PlayerSettings, SimStep } from './types';
import { CMD_ARROW } from './types';
import { computeMinPathLength, wouldViolateRepLimit } from './pathValidator';
import { playClick } from './sounds';

const CELL_EMOJI: Record<string, string> = {
  empty: '',
  robot: '🤖',
  obstacle: '🧱',
  star: '⭐',
  key1: '🔑',
  key2: '🗝️',
  modifier: '🔀',
  robot_star: '🎉',
};

const CELL_BG: Record<string, string> = {
  empty: 'bg-gray-50',
  robot: 'bg-indigo-200',
  obstacle: 'bg-gray-700',
  star: 'bg-yellow-100',
  key1: 'bg-amber-100',
  key2: 'bg-orange-100',
  modifier: 'bg-blue-100',
  robot_star: 'bg-green-200',
};

const DELTAS: Record<Command, [number, number]> = {
  U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1],
};

function applyFlip(cmd: Command, modifierActive: boolean): Command {
  if (!modifierActive) return cmd;
  if (cmd === 'L') return 'R';
  if (cmd === 'R') return 'L';
  return cmd;
}

type Props = {
  grid: GridDef;
  level: number;
  config: LevelConfig;
  settings: PlayerSettings;
  initialScore: number;
  onValidate: (commands: Command[], simSteps: SimStep[], newScore: number, newTries: number, isOptimal: boolean, perseverations: number) => void;
  onQuit: () => void;
};

export default function Phase1Direct({
  grid, level, config, settings, initialScore, onValidate, onQuit,
}: Props) {
  const [robotPos, setRobotPos] = useState<[number, number]>([grid.robotPos[0], grid.robotPos[1]]);
  const [keysCollected, setKeysCollected] = useState<number[]>([]);
  const [modifierActive, setModifierActive] = useState(false);
  const [history, setHistory] = useState<Command[]>([]);
  const [simSteps, setSimSteps] = useState<SimStep[]>([]);
  const [score, setScore] = useState(initialScore);
  const [tries, setTries] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const effectiveMaxCmds: number | null =
    settings.overrideMaxCmds === 0 ? null :
    settings.overrideMaxCmds !== null ? settings.overrideMaxCmds :
    config.maxCmds;

  const minPathLength = useMemo(() =>
    computeMinPathLength(grid, config.keyCount, settings.maxRepConsecutive, settings.disabledDirection),
  [grid, config.keyCount, settings.maxRepConsecutive, settings.disabledDirection]);

  const cellSize = grid.size === 3 ? 80 : grid.size === 5 ? 56 : 68;
  const cmdFull = effectiveMaxCmds !== null && history.length >= effectiveMaxCmds;

  function getDisplayCell(r: number, c: number): string {
    // Robot at current position (takes priority)
    if (r === robotPos[0] && c === robotPos[1]) {
      return grid.cells[r][c] === 'star' ? 'robot_star' : 'robot';
    }
    // Starting cell is now empty if robot has moved
    if (r === grid.robotPos[0] && c === grid.robotPos[1] && grid.cells[r][c] === 'robot') {
      return 'empty';
    }
    // Collected keys disappear
    for (let k = 0; k < grid.keyPositions.length; k++) {
      if (keysCollected.includes(k)) {
        const [kr, kc] = grid.keyPositions[k];
        if (r === kr && c === kc) return 'empty';
      }
    }
    // Activated modifier disappears
    if (modifierActive && grid.modifierPos && r === grid.modifierPos[0] && c === grid.modifierPos[1]) {
      return 'empty';
    }
    return grid.cells[r][c] as string;
  }

  function handleMove(rawCmd: Command) {
    if (succeeded || errorMsg) return;
    if (effectiveMaxCmds !== null && history.length >= effectiveMaxCmds) return;
    if (wouldViolateRepLimit(history, rawCmd, settings.maxRepConsecutive)) return;
    if (settings.sound) playClick();

    const cmd = applyFlip(rawCmd, modifierActive);
    const [dr, dc] = DELTAS[cmd];
    const newRow = robotPos[0] + dr;
    const newCol = robotPos[1] + dc;

    // Bounds check
    if (newRow < 0 || newRow >= grid.size || newCol < 0 || newCol >= grid.size) {
      setErrorMsg('Le robot sort de la grille ! Recommence depuis le début.');
      return;
    }

    // Obstacle check
    const cell = grid.cells[newRow][newCol];
    if (cell === 'obstacle') {
      setErrorMsg('Le robot heurte un mur 🧱 ! Recommence depuis le début.');
      return;
    }

    const newPos: [number, number] = [newRow, newCol];
    const newMod = modifierActive || cell === 'modifier';

    // Collect keys in order
    const newKeys = [...keysCollected];
    for (let k = 0; k < grid.keyPositions.length; k++) {
      const [kr, kc] = grid.keyPositions[k];
      if (newRow === kr && newCol === kc && !newKeys.includes(k)) {
        if (k === 0 || newKeys.includes(k - 1)) {
          newKeys.push(k);
        }
      }
    }

    const newHistory = [...history, rawCmd];
    const newStep: SimStep = { pos: newPos, keysCollected: newKeys, modifierActive: newMod };
    const newSimSteps = [...simSteps, newStep];

    setRobotPos(newPos);
    setModifierActive(newMod);
    setKeysCollected(newKeys);
    setHistory(newHistory);
    setSimSteps(newSimSteps);

    // Check success: star reached + all keys collected
    const [sr, sc] = grid.starPos;
    if (newRow === sr && newCol === sc && newKeys.length >= config.keyCount) {
      setSucceeded(true);
      const isOptimal = minPathLength !== null && newHistory.length === minPathLength;
      const newScore = score + 5 + (isOptimal ? 2 : 0);
      setScore(newScore);
      const newTries = tries + 1;
      setTries(newTries);
      setTimeout(() => {
        onValidate(newHistory, newSimSteps, newScore, newTries, isOptimal, 0);
      }, 900);
    }
  }

  function reset() {
    setRobotPos([grid.robotPos[0], grid.robotPos[1]]);
    setKeysCollected([]);
    setModifierActive(false);
    setHistory([]);
    setSimSteps([]);
    setErrorMsg(null);
    setSucceeded(false);
    setTries(prev => prev + 1);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
            Niveau {level} / 6
          </span>
          <h2 className="text-base font-bold text-gray-800">{config.label}</h2>
          <span className="inline-block text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
            ⚡ Exécution directe
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-700">{score} pts</div>
            <div className="text-xs text-gray-400">Tentatives : {tries}</div>
          </div>
          <button onClick={onQuit} className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded border border-gray-200">
            ✕
          </button>
        </div>
      </div>

      {/* Contraintes */}
      <div className="flex flex-wrap gap-2 text-xs">
        {effectiveMaxCmds !== null && (
          <span className={`px-2 py-1 rounded-full font-semibold ${cmdFull ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
            Max {effectiveMaxCmds} pas ({history.length}/{effectiveMaxCmds})
          </span>
        )}
        {config.keyCount === 1 && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">🔑 Ramasse la clé avant l'étoile</span>}
        {config.keyCount === 2 && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">🔑🗝️ Ramasse les clés dans l'ordre</span>}
        {config.hasModifier && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">🔀 Modificateur inverse G/D</span>}
        {settings.maxRepConsecutive > 0 && (
          <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
            Max {settings.maxRepConsecutive}× même direction
          </span>
        )}
        {settings.disabledDirection !== null && (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
            🚫 {CMD_ARROW[settings.disabledDirection]} désactivé
          </span>
        )}
        {minPathLength !== null && (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            ⭐ Optimal : {minPathLength} pas (+2 pts)
          </span>
        )}
      </div>

      {/* Grille */}
      <div className="flex justify-center">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid.size}, ${cellSize}px)`,
            gap: 3,
          }}
        >
          {grid.cells.map((row, r) =>
            row.map((_cell, c) => {
              const shown = getDisplayCell(r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  style={{ width: cellSize, height: cellSize }}
                  className={`flex items-center justify-center rounded-lg border-2 border-gray-200 text-2xl ${CELL_BG[shown] ?? 'bg-gray-50'} ${succeeded && shown === 'robot_star' ? 'animate-bounce' : ''}`}
                >
                  {CELL_EMOJI[shown] ?? ''}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Feedback */}
      {errorMsg && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 text-center">
          ❌ {errorMsg}
        </div>
      )}
      {succeeded && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 text-center font-semibold">
          🎉 Bravo ! Le robot a atteint l'étoile en {history.length} pas !
          {minPathLength !== null && history.length === minPathLength && (
            <span className="block text-green-600">⭐ Chemin optimal ! +2 pts bonus</span>
          )}
        </div>
      )}

      {/* Verbalisation */}
      {settings.verbalization && history.length > 0 && !succeeded && !errorMsg && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-800 font-semibold text-center">
          🗣️ Dis à voix haute ce que tu vas faire !
        </div>
      )}

      {/* Boutons directionnels */}
      {!succeeded && (
        <div className="grid grid-cols-3 gap-2" style={{ maxWidth: 280, margin: '0 auto' }}>
          <div />
          <DirBtn cmd="U" onMove={handleMove} cmdFull={cmdFull} history={history} settings={settings} locked={!!errorMsg} />
          <div />
          <DirBtn cmd="L" onMove={handleMove} cmdFull={cmdFull} history={history} settings={settings} locked={!!errorMsg} />
          <DirBtn cmd="D" onMove={handleMove} cmdFull={cmdFull} history={history} settings={settings} locked={!!errorMsg} />
          <DirBtn cmd="R" onMove={handleMove} cmdFull={cmdFull} history={history} settings={settings} locked={!!errorMsg} />
        </div>
      )}

      {/* Recommencer */}
      {(errorMsg || cmdFull) && (
        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition"
        >
          🔄 Recommencer depuis le début
        </button>
      )}
    </div>
  );
}

function DirBtn({ cmd, onMove, cmdFull, history, settings, locked }: {
  cmd: Command;
  onMove: (c: Command) => void;
  cmdFull: boolean;
  history: Command[];
  settings: PlayerSettings;
  locked: boolean;
}) {
  if (cmd === settings.disabledDirection) {
    return <div className="w-full aspect-square" />;
  }
  const disabled = cmdFull || locked || wouldViolateRepLimit(history, cmd, settings.maxRepConsecutive);
  return (
    <button
      onClick={() => onMove(cmd)}
      disabled={disabled}
      className="w-full aspect-square flex items-center justify-center text-2xl font-bold rounded-xl border-2 border-indigo-300 bg-white hover:bg-indigo-50 active:bg-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {CMD_ARROW[cmd]}
    </button>
  );
}
