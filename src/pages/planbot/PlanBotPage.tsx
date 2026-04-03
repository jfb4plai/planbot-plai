import { useState } from 'react';
import type { Command, GamePhase, LevelConfig, Phase2Result, PlayerSettings, SimStep } from './types';
import { GROUP_LEVEL_CONFIGS } from './types';
import { pickGroupGrid } from './grids';
import type { GridDef } from './types';
import { supabase } from '../../lib/supabaseClient';
import ProfileStep from './ProfileStep';
import Phase1 from './Phase1';
import Phase2 from './Phase2';
import Dashboard from './Dashboard';

const PORTAIL_URL = 'https://portail-plai.vercel.app';

export default function PlanBotPage() {
  const [phase, setPhase] = useState<GamePhase>('profile');
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
  const [grid, setGrid] = useState<GridDef | null>(null);
  const [level, setLevel] = useState(1);
  const [config, setConfig] = useState<LevelConfig | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [simSteps, setSimSteps] = useState<SimStep[]>([]);
  const [scoreAfterP1, setScoreAfterP1] = useState(0);
  const [planningTries, setPlanningTries] = useState(0);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startGame(s: PlayerSettings) {
    const baseConfig = GROUP_LEVEL_CONFIGS[s.ageGroup][s.startLevel - 1];
    setSettings(s);
    setLevel(s.startLevel);
    setConfig(baseConfig);
    setGrid(pickGroupGrid(s.ageGroup, s.startLevel));
    setScoreAfterP1(0);
    setPlanningTries(0);
    setPhase('phase1');
  }

  function handlePhase1Done(cmds: Command[], steps: SimStep[], newScore: number, newTries: number) {
    setCommands(cmds);
    setSimSteps(steps);
    setScoreAfterP1(newScore);
    setPlanningTries(newTries);
    setPhase('phase2');
  }

  async function handlePhase2Done(result: Phase2Result) {
    if (!settings) return;

    setPhase('complete');
    setSaveError(null);

    const { data, error } = await supabase.from('planbot_sessions').insert({
      player_name: settings.playerName,
      age_group: settings.ageGroup,
      level,
      score: result.score,
      planning_tries: planningTries,
      tl_good: result.tlGood,
      tl_total: result.tlTotal,
      duration_s: result.durationS,
      note: null,
      cfg_rep_limit: settings.maxRepConsecutive,
      cfg_tl_mode: settings.tlMode,
      cfg_tl_dur: settings.tlDurationS,
      cfg_sound: settings.sound,
    }).select('id').single();

    if (error) {
      setSaveError("La séance n'a pas pu être sauvegardée. Vérifiez la connexion.");
    } else if (data) {
      setLastSessionId(data.id as string);
    }
  }

  function quit() {
    setPhase('profile');
    setGrid(null);
    setConfig(null);
    setCommands([]);
    setSimSteps([]);
    setLastSessionId(null);
    setSaveError(null);
  }

  if (phase === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Dashboard
          initialPlayer={settings?.playerName}
          onBack={() => setPhase('profile')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Breadcrumb */}
      <div className="px-4 py-3 border-b border-indigo-100 bg-white/70 backdrop-blur">
        <div className="max-w-xl mx-auto flex items-center gap-2 text-sm">
          <a href={PORTAIL_URL} className="text-indigo-500 hover:text-indigo-700 font-medium">
            Portail PLAI
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-semibold">🤖 PlanBot</span>
        </div>
      </div>

      {phase === 'profile' && (
        <ProfileStep
          onStart={startGame}
          onDashboard={() => setPhase('dashboard')}
        />
      )}

      {phase === 'phase1' && grid && settings && config && (
        <Phase1
          grid={grid}
          level={level}
          config={config}
          settings={settings}
          initialScore={0}
          planningTries={0}
          onValidate={handlePhase1Done}
          onQuit={quit}
        />
      )}

      {phase === 'phase2' && grid && settings && (
        <Phase2
          grid={grid}
          commands={commands}
          simSteps={simSteps}
          initialScore={scoreAfterP1}
          settings={settings}
          onComplete={handlePhase2Done}
          onQuit={quit}
        />
      )}

      {phase === 'complete' && settings && (
        <div className="max-w-md mx-auto px-4 py-12 text-center space-y-5">
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-8 space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-800">Séance terminée !</h2>

            {saveError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            ) : lastSessionId ? (
              <p className="text-sm text-green-600 font-semibold">✓ Séance sauvegardée</p>
            ) : (
              <p className="text-sm text-gray-400">Sauvegarde…</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPhase('dashboard')}
                className="flex-1 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition"
              >
                📊 Tableau de bord
              </button>
              <button
                onClick={quit}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition"
              >
                Rejouer →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
