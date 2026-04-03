// ===== PlanBot — types =====

export type Command = 'U' | 'D' | 'L' | 'R';
export const CMD_ARROW: Record<Command, string> = { U: '↑', D: '↓', L: '←', R: '→' };

export type CellType = 'empty' | 'robot' | 'obstacle' | 'star' | 'key1' | 'key2' | 'modifier';

export type TLMode = 'off' | 'seq' | 'random';
export type GamePhase = 'profile' | 'phase1' | 'phase2' | 'complete' | 'dashboard';
export type AgeGroup = '6' | '7-10' | '11-13';

export type GridDef = {
  size: number;
  cells: CellType[][];
  robotPos: [number, number];
  starPos: [number, number];
  keyPositions: [number, number][];  // ordered: [key1, key2]
  modifierPos?: [number, number];
};

export type LevelConfig = {
  level: number;
  size: number;
  maxCmds: number | null;
  keyCount: number;       // 0, 1 or 2
  hasModifier: boolean;
  feTargets: string[];
  label: string;
};

export const GROUP_LEVEL_CONFIGS: Record<AgeGroup, LevelConfig[]> = {
  '6': [
    { level: 1, size: 3, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Découverte' },
    { level: 2, size: 3, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Premiers obstacles' },
    { level: 3, size: 4, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Grande grille' },
    { level: 4, size: 4, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Labyrinthe' },
    { level: 5, size: 4, maxCmds: null, keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT'], label: 'La clé cachée' },
    { level: 6, size: 4, maxCmds: null, keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT'], label: 'Clé et obstacles' },
  ],
  '7-10': [
    { level: 1, size: 4, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Planification libre' },
    { level: 2, size: 4, maxCmds: 8,   keyCount: 0, hasModifier: false, feTargets: ['Planification', 'Inhibition'], label: 'Limite douce' },
    { level: 3, size: 4, maxCmds: 6,   keyCount: 0, hasModifier: false, feTargets: ['Planification', 'Inhibition'], label: 'Économie de pas' },
    { level: 4, size: 4, maxCmds: 8,   keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT'], label: 'La clé en route' },
    { level: 5, size: 4, maxCmds: 7,   keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT', 'Inhibition'], label: 'Clé + limite' },
    { level: 6, size: 4, maxCmds: 6,   keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT', 'Inhibition'], label: 'Défi total' },
  ],
  '11-13': [
    { level: 1, size: 5, maxCmds: null, keyCount: 0, hasModifier: false, feTargets: ['Planification'], label: 'Grande grille libre' },
    { level: 2, size: 5, maxCmds: 10,  keyCount: 0, hasModifier: false, feTargets: ['Planification', 'Inhibition'], label: 'Stratégie et limite' },
    { level: 3, size: 5, maxCmds: 10,  keyCount: 1, hasModifier: false, feTargets: ['Planification', 'MDT'], label: 'Une clé à ramasser' },
    { level: 4, size: 5, maxCmds: 10,  keyCount: 2, hasModifier: false, feTargets: ['Planification', 'MDT +++'], label: 'Double mémoire' },
    { level: 5, size: 5, maxCmds: 12,  keyCount: 0, hasModifier: true,  feTargets: ['Planification', 'Flexibilité'], label: 'Le monde inversé' },
    { level: 6, size: 5, maxCmds: 12,  keyCount: 1, hasModifier: true,  feTargets: ['Planification', 'Flexibilité', 'MDT', 'Inhibition'], label: 'Toutes FE combinées' },
  ],
};

export type PlayerSettings = {
  playerName: string;
  ageGroup: AgeGroup;
  startLevel: number;
  overrideMaxCmds: number | null;  // null = use level default
  maxRepConsecutive: number;  // 0 = off, 1-3 = max consecutive same command
  tlMode: TLMode;
  tlDurationS: number;        // 1-5
  sound: boolean;
};

export const DEFAULT_SETTINGS: PlayerSettings = {
  playerName: '',
  ageGroup: '7-10',
  startLevel: 1,
  overrideMaxCmds: null,
  maxRepConsecutive: 0,
  tlMode: 'seq',
  tlDurationS: 3,
  sound: true,
};

export type SimStep = {
  pos: [number, number];
  keysCollected: number[];     // indices of collected keys (0 = key1, 1 = key2)
  modifierActive: boolean;
};

export type ValidationResult =
  | { ok: true; simSteps: SimStep[] }
  | { ok: false; reason: 'out_of_bounds' | 'obstacle' | 'no_star' | 'missing_key' | 'wrong_key_order' | 'too_many_cmds' | 'rep_limit' };

export type Phase2Result = {
  score: number;
  tlGood: number;
  tlTotal: number;
  durationS: number;
};

export type SavedSession = {
  id: string;
  created_at: string;
  player_name: string;
  age_group: string;
  level: number;
  score: number;
  planning_tries: number;
  tl_good: number;
  tl_total: number;
  duration_s: number;
  note: string | null;
  cfg_rep_limit: number;
  cfg_tl_mode: string;
  cfg_tl_dur: number;
  cfg_sound: boolean;
};
