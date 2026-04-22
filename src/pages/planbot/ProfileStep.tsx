import { useState } from 'react';
import type { AgeGroup, LevelConfig, PlayerSettings, TLMode } from './types';
import { DEFAULT_SETTINGS, GROUP_LEVEL_CONFIGS } from './types';
import { hasAnyValidVariant } from './grids';

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

// Répétitions consécutives : options fixes
const REP_OPTIONS = [
  { label: 'Libre', value: 0 },
  { label: 'Max 1 de suite', value: 1 },
  { label: 'Max 2 de suite', value: 2 },
  { label: 'Max 3 de suite', value: 3 },
];

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

  // effectiveMaxCmds : 0 = "Sans limite", null = défaut niveau, number = override
  const effectiveMaxCmds =
    s.overrideMaxCmds === 0 ? null :
    s.overrideMaxCmds !== null ? s.overrideMaxCmds :
    selectedConfig.maxCmds;

  // Convertit la valeur d'une option maxCmds en effectiveMaxCmds pour le BFS
  function toEffectiveMax(value: number | null): number | null {
    if (value === 0) return null;
    if (value === null) return selectedConfig.maxCmds;
    return value;
  }

  // Options max commandes : "Par défaut" (null) + "Sans limite" (0) + valeurs spécifiques
  const maxCmdsOptions: { label: string; value: number | null }[] =
    s.ageGroup === '6'
      ? []
      : s.ageGroup === '7-10'
        ? [
            { label: selectedConfig.maxCmds !== null ? `Par défaut (≤ ${selectedConfig.maxCmds})` : 'Par défaut', value: null },
            { label: 'Sans limite', value: 0 },
            { label: '10 max', value: 10 },
            { label: '8 max', value: 8 },
            { label: '6 max', value: 6 },
          ]
        : [
            { label: selectedConfig.maxCmds !== null ? `Par défaut (≤ ${selectedConfig.maxCmds})` : 'Par défaut', value: null },
            { label: 'Sans limite', value: 0 },
            { label: '12 max', value: 12 },
            { label: '10 max', value: 10 },
            { label: '8 max', value: 8 },
          ];

  // ── Filtrage cascade ──────────────────────────────────────────────────────
  // Pour chaque option maxCmds : compatible avec le maxRepConsecutive actuel ?
  const maxCmdsCompat = maxCmdsOptions.map(opt =>
    hasAnyValidVariant(s.ageGroup, s.startLevel, toEffectiveMax(opt.value), selectedConfig.keyCount, s.maxRepConsecutive)
  );

  // Pour chaque option répétition : compatible avec le effectiveMaxCmds actuel ?
  const repCompat = REP_OPTIONS.map(opt =>
    hasAnyValidVariant(s.ageGroup, s.startLevel, effectiveMaxCmds, selectedConfig.keyCount, opt.value)
  );

  const isCompatible = hasAnyValidVariant(s.ageGroup, s.startLevel, effectiveMaxCmds, selectedConfig.keyCount, s.maxRepConsecutive);
  // ─────────────────────────────────────────────────────────────────────────

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

            {/* Max commandes — avec filtrage cascade */}
            {maxCmdsOptions.length > 0 && (
              <div>
                <label className={labelCls}>Max commandes</label>
                <div className="flex flex-wrap gap-2">
                  {maxCmdsOptions.map((opt, i) => {
                    const isSelected = s.overrideMaxCmds === opt.value;
                    const compat = maxCmdsCompat[i];
                    return (
                      <button
                        key={String(opt.value)}
                        onClick={() => { if (compat || isSelected) set('overrideMaxCmds', opt.value); }}
                        disabled={!compat && !isSelected}
                        title={!compat ? 'Impossible avec la contrainte de répétition sélectionnée' : ''}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : !compat
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Répétitions consécutives — avec filtrage cascade — sous forme de boutons */}
            <div>
              <label className={labelCls}>Répétitions consécutives autorisées</label>
              <div className="flex flex-wrap gap-2">
                {REP_OPTIONS.map((opt, i) => {
                  const isSelected = s.maxRepConsecutive === opt.value;
                  const compat = repCompat[i];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { if (compat || isSelected) set('maxRepConsecutive', opt.value); }}
                      disabled={!compat && !isSelected}
                      title={!compat ? 'Impossible avec la limite de commandes sélectionnée' : ''}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : !compat
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
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
                <label className={labelCls}>Durée orange</label>
                <div className="flex gap-2">
                  {([200, 400, 700] as const).map(ms => (
                    <button
                      key={ms}
                      onClick={() => set('tlOrangeMs', ms)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                        s.tlOrangeMs === ms
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {ms === 200 ? 'Court (0,2 s)' : ms === 400 ? 'Normal (0,4 s)' : 'Long (0,7 s)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {s.tlMode !== 'off' && (
              <div>
                <label className={labelCls}>Tempo du feu</label>
                <div className="flex gap-2">
                  {([
                    { value: 'slow',   label: 'Lent',   sub: 'rouge 1,5–3 s / vert 3–5 s' },
                    { value: 'medium', label: 'Moyen',  sub: 'rouge 0,8–1,5 s / vert 2–3 s' },
                    { value: 'fast',   label: 'Rapide', sub: 'rouge 0,4–0,8 s / vert 1–2 s' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => set('tlTempo', opt.value)}
                      title={opt.sub}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                        s.tlTempo === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Durées tirées aléatoirement dans chaque plage</p>
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

        {!isCompatible && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 px-3 py-2 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">⚠️ Combinaison impossible</p>
            <p>
              Aucun plateau de ce niveau n'est jouable avec les contraintes actuelles.
              Modifie le niveau ou les réglages thérapeute.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleStart}
            disabled={!isCompatible}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition disabled:opacity-40 disabled:cursor-not-allowed"
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
