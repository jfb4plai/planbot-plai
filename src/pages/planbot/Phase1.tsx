import { useState } from 'react';
import type { Command, GridDef, LevelConfig, PlayerSettings, SimStep } from './types';
import { CMD_ARROW } from './types';
import { validatePath, VALIDATION_MESSAGES, wouldViolateRepLimit } from './pathValidator';
import { playClick } from './sounds';

const CELL_EMOJI: Record<string, string> = {
  empty: '',
  robot: '🤖',
  obstacle: '🧱',
  star: '⭐',
  key1: '🔑',
  key2: '🗝️',
  modifier: '🔀',
};

const CELL_BG: Record<string, string> = {
  empty: 'bg-gray-50',
  robot: 'bg-indigo-100',
  obstacle: 'bg-gray-700',
  star: 'bg-yellow-100',
  key1: 'bg-amber-100',
  key2: 'bg-orange-100',
  modifier: 'bg-blue-100',
};

type Props = {
  grid: GridDef;
  level: number;
  config: LevelConfig;
  settings: PlayerSettings;
  initialScore: number;
  planningTries: number;
  onValidate: (commands: Command[], simSteps: SimStep[], newScore: number, newTries: number) => void;
  onQuit: () => void;
};

export default function Phase1({
  grid, level, config, settings, initialScore, planningTries, onValidate, onQuit,
}: Props) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [tries, setTries] = useState(planningTries);
  const [score, setScore] = useState(initialScore);

  // Apply overrideMaxCmds from therapist settings
  const effectiveMaxCmds: number | null =
    settings.overrideMaxCmds !== null ? settings.overrideMaxCmds : config.maxCmds;

  const cellSize = grid.size === 3 ? 80 : grid.size === 5 ? 56 : 68;

  function addCmd(cmd: Command) {
    if (effectiveMaxCmds !== null && commands.length >= effectiveMaxCmds) return;
    if (wouldViolateRepLimit(commands, cmd, settings.maxRepConsecutive)) return;
    if (settings.sound) playClick();
    setCommands(prev => [...prev, cmd]);
    setMessage(null);
  }

  function removeCmd() {
    setCommands(prev => prev.slice(0, -1));
    setMessage(null);
  }

  function clearCmds() {
    setCommands([]);
    setMessage(null);
  }

  function handleValidate() {
    const newTries = tries + 1;
    setTries(newTries);

    const effectiveConfig = { ...config, maxCmds: effectiveMaxCmds };
    const result = validatePath(grid, commands, effectiveConfig, settings.maxRepConsecutive);
    if (result.ok) {
      const newScore = score + 5;
      setScore(newScore);
      onValidate(commands, result.simSteps, newScore, newTries);
    } else {
      setMessage(VALIDATION_MESSAGES[result.reason] ?? 'Essaie encore !');
    }
  }

  const cmdFull = effectiveMaxCmds !== null && commands.length >= effectiveMaxCmds;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
            Niveau {level} / 6
          </span>
          <h2 className="text-base font-bold text-gray-800">{config.label}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-700">{score} pts</div>
            <div className="text-xs text-gray-400">Essais : {tries}</div>
          </div>
          <button onClick={onQuit} className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded border border-gray-200">
            ✕
          </button>
        </div>
      </div>

      {/* Contraintes du niveau */}
      <div className="flex flex-wrap gap-2 text-xs">
        {effectiveMaxCmds !== null && (
          <span className={`px-2 py-1 rounded-full font-semibold ${cmdFull ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
            Max {effectiveMaxCmds} commandes ({commands.length}/{effectiveMaxCmds})
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
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                style={{ width: cellSize, height: cellSize }}
                className={`flex items-center justify-center rounded-lg border-2 border-gray-200 text-2xl ${CELL_BG[cell]}`}
              >
                {CELL_EMOJI[cell]}
              </div>
            )),
          )}
        </div>
      </div>

      {/* Séquence construite */}
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 min-h-[48px]">
        {commands.length === 0
          ? <span className="text-sm text-indigo-300">Construis ta séquence de commandes…</span>
          : (
            <div className="flex flex-wrap gap-1.5">
              {commands.map((cmd, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-base"
                >
                  {CMD_ARROW[cmd]}
                </span>
              ))}
            </div>
          )}
      </div>

      {/* Message feedback */}
      {message && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          💡 {message}
        </div>
      )}

      {/* Boutons de commande */}
      <div className="grid grid-cols-3 gap-2" style={{ maxWidth: 280, margin: '0 auto' }}>
        <div />
        <CmdBtn cmd="U" addCmd={addCmd} cmdFull={cmdFull} commands={commands} settings={settings} />
        <div />
        <CmdBtn cmd="L" addCmd={addCmd} cmdFull={cmdFull} commands={commands} settings={settings} />
        <CmdBtn cmd="D" addCmd={addCmd} cmdFull={cmdFull} commands={commands} settings={settings} />
        <CmdBtn cmd="R" addCmd={addCmd} cmdFull={cmdFull} commands={commands} settings={settings} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={removeCmd}
          disabled={commands.length === 0}
          className="px-3 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition"
        >
          ⌫ Effacer
        </button>
        <button
          onClick={clearCmds}
          disabled={commands.length === 0}
          className="px-3 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition"
        >
          ✕ Tout effacer
        </button>
        <button
          onClick={handleValidate}
          disabled={commands.length === 0}
          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition disabled:opacity-40"
        >
          Valider ✓
        </button>
      </div>
    </div>
  );
}

function CmdBtn({
  cmd, addCmd, cmdFull, commands, settings,
}: {
  cmd: Command;
  addCmd: (c: Command) => void;
  cmdFull: boolean;
  commands: Command[];
  settings: PlayerSettings;
}) {
  const disabled = cmdFull || wouldViolateRepLimit(commands, cmd, settings.maxRepConsecutive);
  return (
    <button
      onClick={() => addCmd(cmd)}
      disabled={disabled}
      className="w-full aspect-square flex items-center justify-center text-2xl font-bold rounded-xl border-2 border-indigo-300 bg-white hover:bg-indigo-50 active:bg-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {CMD_ARROW[cmd]}
    </button>
  );
}
