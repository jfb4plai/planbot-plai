import { useCallback, useEffect, useRef, useState } from 'react';
import type { Command, GridDef, Phase2Result, PlayerSettings, SimStep } from './types';
import { CMD_ARROW } from './types';
import { playBad, playGood, playStar } from './sounds';

type LightState = 'red' | 'orange' | 'green';

const CELL_EMOJI_BASE: Record<string, string> = {
  empty: '',
  obstacle: '🧱',
  star: '⭐',
  key1: '🔑',
  key2: '🗝️',
  modifier: '🔀',
};

const CELL_BG_BASE: Record<string, string> = {
  empty: 'bg-gray-50',
  obstacle: 'bg-gray-700',
  star: 'bg-yellow-100',
  key1: 'bg-amber-100',
  key2: 'bg-orange-100',
  modifier: 'bg-blue-100',
};

type Props = {
  grid: GridDef;
  commands: Command[];
  simSteps: SimStep[];
  initialScore: number;
  settings: PlayerSettings;
  onComplete: (result: Phase2Result) => void;
  onQuit: () => void;
};

export default function Phase2({
  grid, commands, simSteps, initialScore, settings, onComplete, onQuit,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [light, setLight] = useState<LightState>('red');
  const [score, setScore] = useState(initialScore);
  const [tlGood, setTlGood] = useState(0);
  const [tlTotal, setTlTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [startTime] = useState(Date.now());

  const lightRef = useRef<LightState>('red');
  const stepRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const getRobotPos = (idx: number): [number, number] =>
    idx === 0 ? grid.robotPos : simSteps[idx - 1].pos;

  const getKeysCollected = (idx: number): number[] =>
    idx === 0 ? [] : simSteps[idx - 1].keysCollected;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const getGreenDuration = useCallback((): number => {
    if (settings.tlMode === 'random') {
      return (1 + Math.floor(Math.random() * 5)) * 1000;
    }
    return settings.tlDurationS * 1000;
  }, [settings.tlMode, settings.tlDurationS]);

  const handleExpiry = useCallback(() => {
    if (doneRef.current) return;
    if (settings.sound) playBad();
    setScore(prev => Math.max(0, prev - 1));
    setTlTotal(prev => prev + 1);
    // Restart cycle
    lightRef.current = 'red';
    setLight('red');
    timerRef.current = setTimeout(() => {
      lightRef.current = 'orange';
      setLight('orange');
      timerRef.current = setTimeout(() => {
        lightRef.current = 'green';
        setLight('green');
        timerRef.current = setTimeout(handleExpiry, getGreenDuration());
      }, 400);
    }, 700);
  }, [settings.sound, getGreenDuration]);

  const startCycle = useCallback(() => {
    if (doneRef.current) return;
    clearTimer();
    lightRef.current = 'red';
    setLight('red');
    timerRef.current = setTimeout(() => {
      lightRef.current = 'orange';
      setLight('orange');
      timerRef.current = setTimeout(() => {
        lightRef.current = 'green';
        setLight('green');
        timerRef.current = setTimeout(handleExpiry, getGreenDuration());
      }, 400);
    }, 700);
  }, [handleExpiry, getGreenDuration]);

  // Init
  useEffect(() => {
    if (settings.tlMode !== 'off') {
      startCycle();
    }
    return () => clearTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePress() {
    if (doneRef.current) return;

    if (settings.tlMode === 'off') {
      // No traffic light — just advance
      advanceStep();
      return;
    }

    const currentLight = lightRef.current;
    clearTimer();

    if (currentLight === 'green') {
      // Good press
      if (settings.sound) playGood();
      setTlGood(prev => prev + 1);
      setTlTotal(prev => prev + 1);
      advanceStep();
    } else {
      // Bad press
      if (settings.sound) playBad();
      setScore(prev => Math.max(0, prev - 1));
      setTlTotal(prev => prev + 1);
      // Restart from red
      lightRef.current = 'red';
      setLight('red');
      timerRef.current = setTimeout(() => {
        lightRef.current = 'orange';
        setLight('orange');
        timerRef.current = setTimeout(() => {
          lightRef.current = 'green';
          setLight('green');
          timerRef.current = setTimeout(handleExpiry, getGreenDuration());
        }, 400);
      }, 700);
    }
  }

  function advanceStep() {
    const next = stepRef.current + 1;
    stepRef.current = next;
    setStepIdx(next);

    if (next >= commands.length) {
      // Finished!
      doneRef.current = true;
      clearTimer();
      if (settings.sound) playStar();
      setScore(prev => {
        const finalScore = prev + 1;
        setDone(true);
        const duration = Math.round((Date.now() - startTime) / 1000);
        setTimeout(() => {
          onComplete({
            score: finalScore,
            tlGood: tlGood + (settings.tlMode !== 'off' ? 1 : 0),
            tlTotal: tlTotal + (settings.tlMode !== 'off' ? 1 : 0),
            durationS: duration,
          });
        }, 1500);
        return finalScore;
      });
    } else if (settings.tlMode !== 'off') {
      startCycle();
    }
  }

  const robotPos = getRobotPos(stepIdx);
  const keysCollected = getKeysCollected(stepIdx);
  const cellSize = grid.size === 3 ? 80 : grid.size === 5 ? 56 : 68;
  const currentCmd = commands[stepIdx];
  const isOff = settings.tlMode === 'off';

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Phase 2 — Exécution</span>
          <div className="text-base font-bold text-gray-800">
            Étape {stepIdx + 1} / {commands.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-indigo-700">{score} pts</div>
          </div>
          <button onClick={onQuit} className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1 rounded border border-gray-200">✕</button>
        </div>
      </div>

      {/* Grille avec robot */}
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
              const isRobot = robotPos[0] === r && robotPos[1] === c;
              const isKey1Collected = cell === 'key1' && keysCollected.includes(0);
              const isKey2Collected = cell === 'key2' && keysCollected.includes(1);
              const displayCell = isKey1Collected || isKey2Collected ? 'empty' : cell;
              const bg = isRobot ? 'bg-indigo-300' : CELL_BG_BASE[displayCell] ?? 'bg-gray-50';
              return (
                <div
                  key={`${r}-${c}`}
                  style={{ width: cellSize, height: cellSize }}
                  className={`flex items-center justify-center rounded-lg border-2 border-gray-200 text-2xl ${bg}`}
                >
                  {isRobot ? '🤖' : (CELL_EMOJI_BASE[displayCell] ?? '')}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Feu tricolore ou mode off */}
      {!isOff ? (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center gap-3 w-24">
            {(['red', 'orange', 'green'] as LightState[]).map(l => (
              <div
                key={l}
                className={`w-14 h-14 rounded-full transition-all duration-200 ${
                  light === l
                    ? l === 'red' ? 'bg-red-500 shadow-lg shadow-red-400'
                      : l === 'orange' ? 'bg-orange-400 shadow-lg shadow-orange-300'
                      : 'bg-green-400 shadow-lg shadow-green-300'
                    : 'bg-gray-600 opacity-30'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">
              Commande : <strong className="text-2xl">{currentCmd ? CMD_ARROW[currentCmd] : ''}</strong>
            </p>
            {light === 'green' && !done && (
              <p className="text-sm font-bold text-green-600 animate-pulse">APPUIE MAINTENANT !</p>
            )}
            {light !== 'green' && !done && (
              <p className="text-sm text-gray-400">Attends le vert…</p>
            )}
          </div>

          {!done && (
            <button
              onPointerDown={handlePress}
              className={`w-40 h-20 rounded-2xl text-white text-xl font-bold shadow-lg transition active:scale-95 select-none touch-none ${
                light === 'green'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
            >
              {light === 'green' ? '✓ APPUIE !' : '…'}
            </button>
          )}
        </div>
      ) : (
        /* Mode sans feu */
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500">
            Commande : <strong className="text-2xl">{currentCmd ? CMD_ARROW[currentCmd] : ''}</strong>
          </p>
          {!done && (
            <button
              onPointerDown={handlePress}
              className="w-40 h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold shadow-lg transition active:scale-95 select-none touch-none"
            >
              AVANCER →
            </button>
          )}
        </div>
      )}

      {done && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 text-center space-y-1">
          <div className="text-4xl">⭐</div>
          <p className="font-bold text-gray-800 text-lg">Étoile atteinte !</p>
          <p className="text-indigo-700 font-bold text-2xl">{score} pts</p>
          <p className="text-sm text-gray-400">Sauvegarde en cours…</p>
        </div>
      )}
    </div>
  );
}
