import { useEffect, useMemo, useRef, useState } from 'react';
import type { Command, GridDef, LevelConfig, PlayerSettings, SimStep } from './types';
import { CMD_ARROW } from './types';
import { computeMinPathLength, validatePath, VALIDATION_MESSAGES, wouldViolateRepLimit } from './pathValidator';
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
  onValidate: (commands: Command[], simSteps: SimStep[], newScore: number, newTries: number, isOptimal: boolean, perseverations: number) => void;
  onQuit: () => void;
};

export default function Phase1({
  grid, level, config, settings, initialScore, planningTries, onValidate, onQuit,
}: Props) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [tries, setTries] = useState(planningTries);
  const [score, setScore] = useState(initialScore);
  const [failedSequences, setFailedSequences] = useState<string[]>([]);
  const [perseverationCount, setPerseverationCount] = useState(0);

  // ── Timer de planification ─────────────────────────────────────────────────
  function pickTimerDuration(): number | null {
    if (settings.planningTimerMode === 'off') return null;
    if (settings.planningTimerMode === 'fixed') return settings.planningTimerS;
    const range = settings.planningTimerMaxS - settings.planningTimerMinS;
    return settings.planningTimerMinS + Math.floor(Math.random() * (range + 1));
  }

  const [timeLeft, setTimeLeft] = useState<number | null>(() => pickTimerDuration());
  const [timerExpired, setTimerExpired] = useState(false);
  const timerExpiredRef = useRef(false);

  function resetTimer() {
    timerExpiredRef.current = false;
    setTimerExpired(false);
    setTimeLeft(pickTimerDuration());
  }

  useEffect(() => {
    if (timeLeft === null || timerExpiredRef.current) return;
    if (timeLeft <= 0) {
      timerExpiredRef.current = true;
      setTimerExpired(true);
      setTries(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 1));
      setMessage('⏱ Temps écoulé ! Recommence.');
      const t = setTimeout(() => {
        setCommands([]);
        setMessage(null);
        resetTimer();
      }, 2000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTimeLeft(prev => prev !== null ? prev - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerExpired]); // eslint-disable-line react-hooks/exhaustive-deps
  // ── Masquage temporel (mémoire de travail) ────────────────────────────────
  const [memorizeCountdown, setMemorizeCountdown] = useState<number | null>(settings.memorizeS);
  const [gridRevealed, setGridRevealed] = useState(true);

  useEffect(() => {
    if (memorizeCountdown === null || !gridRevealed) return;
    if (memorizeCountdown <= 0) {
      setGridRevealed(false);
      return;
    }
    const t = setTimeout(() => setMemorizeCountdown(prev => prev !== null ? prev - 1 : null), 1000);
    return () => clearTimeout(t);
  }, [memorizeCountdown, gridRevealed]);

  // Cellule affichée : masque obstacles/objets quand grille cachée (robot toujours visible)
  function displayCell(cell: string): string {
    if (gridRevealed) return cell;
    return cell === 'empty' || cell === 'robot' ? cell : 'empty';
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Longueur minimale du chemin optimal (pour le bonus +2 pts)
  const minPathLength = useMemo(() =>
    computeMinPathLength(grid, config.keyCount, settings.maxRepConsecutive, settings.disabledDirection),
  [grid, config.keyCount, settings.maxRepConsecutive, settings.disabledDirection]);

  // 0 = sentinelle "Libre" (aucune limite), null = défaut niveau
  const effectiveMaxCmds: number | null =
    settings.overrideMaxCmds === 0 ? null :
    settings.overrideMaxCmds !== null ? settings.overrideMaxCmds :
    config.maxCmds;

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
      const isOptimal = minPathLength !== null && commands.length === minPathLength;
      const newScore = score + 5 + (isOptimal ? 2 : 0);
      setScore(newScore);
      onValidate(commands, result.simSteps, newScore, newTries, isOptimal, perseverationCount);
    } else {
      const seqKey = commands.join(',');
      const isPerseveration = failedSequences.includes(seqKey);
      if (isPerseveration) {
        const newCount = perseverationCount + 1;
        setPerseverationCount(newCount);
        setMessage('🔁 Tu as déjà essayé exactement cette séquence ! Essaie quelque chose de différent.');
      } else {
        setFailedSequences(prev => [...prev, seqKey]);
        setMessage(VALIDATION_MESSAGES[result.reason] ?? 'Essaie encore !');
      }
      if (settings.planningTimerMode !== 'off') resetTimer();
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
          {timeLeft !== null && (
            <div className={`text-center px-2 py-1 rounded-lg font-mono font-bold text-sm ${
              timerExpired ? 'bg-red-100 text-red-700' :
              timeLeft <= 10 ? 'bg-orange-100 text-orange-700 animate-pulse' :
              'bg-indigo-50 text-indigo-600'
            }`}>
              ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          )}
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
        {settings.disabledDirection !== null && (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
            🚫 {CMD_ARROW[settings.disabledDirection]} désactivé
          </span>
        )}
        {minPathLength !== null && (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            ⭐ Optimal : {minPathLength} cmds (+2 pts)
          </span>
        )}
        {perseverationCount > 0 && (
          <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">
            🔁 {perseverationCount} persévération{perseverationCount > 1 ? 's' : ''}
          </span>
        )}
        {settings.memorizeS !== null && (
          gridRevealed
            ? <span className={`px-2 py-1 rounded-full font-semibold ${
                memorizeCountdown !== null && memorizeCountdown <= 3
                  ? 'bg-orange-100 text-orange-700 animate-pulse'
                  : 'bg-teal-100 text-teal-700'
              }`}>
                👁 Mémorise : {memorizeCountdown}s
              </span>
            : <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-600 font-semibold">
                🙈 Grille masquée
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
            row.map((cell, c) => {
              const shown = displayCell(cell);
              return (
                <div
                  key={`${r}-${c}`}
                  style={{ width: cellSize, height: cellSize }}
                  className={`flex items-center justify-center rounded-lg border-2 border-gray-200 text-2xl ${CELL_BG[shown] ?? 'bg-gray-50'}`}
                >
                  {CELL_EMOJI[shown] ?? ''}
                </div>
              );
            }),
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
          disabled={commands.length === 0 || timerExpired}
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
  if (cmd === settings.disabledDirection) {
    return <div className="w-full aspect-square" />;
  }
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
