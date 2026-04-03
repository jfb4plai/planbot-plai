import { useState } from 'react';
import type { AgeGroup, LevelConfig, PlayerSettings, TLMode } from './types';
import { DEFAULT_SETTINGS, GROUP_LEVEL_CONFIGS } from './types';

const AGE_LABELS: Record<AgeGroup, string> = {
  '6': '6 ans',
  '7-10': '7 – 10 ans',
  '11-13': '11 – 13 ans',
};

const FE_ICONS: Record<string, string> = {
  'Planification': '🗺️',
  'Inhibition': '🛑',
  'MDT': '🧠',
  'MDT +++': '🧠🧠',
  'Flexibilité': '🔀',
};

type Props = {
  onStart: (settings: PlayerSettings) => void;
  onDashboard: () => void;
};

export default function ProfileStep({ onStart, onDashboard }: Props) {
  const [s, setS] = useState<PlayerSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState('');

  const set = <K extends keyof PlayerSettings>(key: K, val: PlayerSettings[K]) =>
    setS(prev => ({ ...prev, [key]: val }));

  function handleAgeGroupChange(ag: AgeGroup) {
    setS(prev => ({ ...prev, ageGroup: ag, startLevel: 1, overrideMaxCmds: null }));
  }

  function handleStart() {
    if (!s.playerName.trim()) { setError('Entre le prénom du joueur.'); return; }
    setError('');
    onStart({ ...s, playerName: s.playerName.trim() });
  }

  const inputCls = 'w-full border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white';
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

  const configs = GROUP_LEVEL_CONFIGS[s.ageGroup];
  const selectedConfig: LevelConfig = configs[s.startLevel - 1];

  // Override options per age group
  const maxCmdsOptions: { label: string; value: number | null }[] =
    s.ageGroup === '6'
      ? []
      : s.ageGroup === '7-10'
        ? [
            { label: 'Libre', value: null },
            { label: '10 max', value: 10 },
            { label: '8 max', value: 8 },
            { label: '6 max', value: 6 },
          ]
        : [
            { label: 'Libre', value: null },
            { label: '12 max', value: 12 },
            { label: '10 max', value: 10 },
            { label: '8 max', value: 8 },
          ];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-indigo-700 mb-1">🤖 PlanBot</h2>
          <p className="text-sm text-gray-500">Rééducation des fonctions exécutives</p>
        </div>

        {/* Prénom */}
        <div>
          <label className={labelCls}>Prénom du joueur</label>
          <input
            className={inputCls}
            value={s.playerName}
            onChange={e => set('playerName', e.target.value)}
            placeholder="ex : Lucas"
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        {/* Tranche d'âge */}
        <div>
          <label className={labelCls}>Tranche d'âge</label>
          <div className="grid grid-cols-3 gap-2">
            {(['6', '7-10', '11-13'] as AgeGroup[]).map(ag => (
              <button
                key={ag}
                onClick={() => handleAgeGroupChange(ag)}
                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                  s.ageGroup === ag
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'
                }`}
              >
                {AGE_LABELS[ag]}
              </button>
            ))}
          </div>
        </div>

        {/* Niveau (1-6) */}
        <div>
          <label className={labelCls}>Niveau de départ</label>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {configs.map((_cfg, i) => (
              <button
                key={i + 1}
                onClick={() => set('startLevel', i + 1)}
                className={`py-2 rounded-lg text-sm font-bold border-2 transition ${
                  s.startLevel === i + 1
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {/* Description du niveau sélectionné */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2 text-xs text-indigo-800 space-y-1">
            <p className="font-semibold">{selectedConfig.label}</p>
            <div className="flex flex-wrap gap-1">
              {selectedConfig.feTargets.map(fe => (
                <span key={fe} className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  {FE_ICONS[fe] ?? ''} {fe}
                </span>
              ))}
              {selectedConfig.maxCmds !== null && (
                <span className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  🔢 Max {selectedConfig.maxCmds} cmds
                </span>
              )}
              {selectedConfig.keyCount > 0 && (
                <span className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  🔑 {selectedConfig.keyCount === 2 ? '2 clés' : '1 clé'}
                </span>
              )}
              {selectedConfig.hasModifier && (
                <span className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  🔀 Modificateur
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Réglages thérapeute */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-gray-500 hover:text-indigo-600 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Réglages thérapeute / enseignant
          </summary>
          <div className="mt-4 space-y-4 pl-1">

            {/* Max commandes (override, selon groupe) */}
            {maxCmdsOptions.length > 0 && (
              <div>
                <label className={labelCls}>Max commandes (remplace la limite du niveau)</label>
                <div className="flex flex-wrap gap-2">
                  {maxCmdsOptions.map(opt => (
                    <button
                      key={String(opt.value)}
                      onClick={() => set('overrideMaxCmds', opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                        s.overrideMaxCmds === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Répétitions consécutives autorisées</label>
              <select
                className={inputCls}
                value={s.maxRepConsecutive}
                onChange={e => set('maxRepConsecutive', Number(e.target.value))}
              >
                <option value={0}>Libre (pas de restriction)</option>
                <option value={1}>Max 1 identique de suite</option>
                <option value={2}>Max 2 identiques de suite</option>
                <option value={3}>Max 3 identiques de suite</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Feu tricolore</label>
              <div className="flex gap-2">
                {(['off', 'seq', 'random'] as TLMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => set('tlMode', m)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                      s.tlMode === m
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {m === 'off' ? 'Désactivé' : m === 'seq' ? 'Fixe' : 'Aléatoire'}
                  </button>
                ))}
              </div>
            </div>

            {s.tlMode !== 'off' && (
              <div>
                <label className={labelCls}>Durée fenêtre verte : {s.tlDurationS} s</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={s.tlDurationS}
                  onChange={e => set('tlDurationS', Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>1 s (difficile)</span><span>5 s (facile)</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => set('sound', !s.sound)}
                className={`w-10 h-6 rounded-full transition-colors relative ${s.sound ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${s.sound ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-700">Sons activés</span>
            </div>
          </div>
        </details>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition"
          >
            Jouer →
          </button>
          <button
            onClick={onDashboard}
            className="px-4 py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition"
            title="Tableau de bord"
          >
            📊
          </button>
        </div>
      </div>
    </div>
  );
}
