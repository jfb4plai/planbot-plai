import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { SavedSession } from './types';

type Props = {
  initialPlayer?: string;
  onBack: () => void;
};

export default function Dashboard({ initialPlayer, onBack }: Props) {
  const [players, setPlayers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>(initialPlayer ?? '');
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editNote, setEditNote] = useState<{ id: string; note: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la liste des joueurs
  useEffect(() => {
    supabase
      .from('planbot_sessions')
      .select('player_name')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError('Impossible de charger les données.'); return; }
        const unique = [...new Set((data ?? []).map((r: { player_name: string }) => r.player_name))];
        setPlayers(unique);
        if (!selected && unique.length > 0) setSelected(unique[0]);
      });
  }, []);

  // Charger les séances du joueur sélectionné
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    supabase
      .from('planbot_sessions')
      .select('*')
      .eq('player_name', selected)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) { setError('Erreur lors du chargement des séances.'); return; }
        setSessions((data ?? []) as SavedSession[]);
      });
  }, [selected]);

  async function saveNote(id: string, note: string) {
    setSaving(true);
    const { error: err } = await supabase
      .from('planbot_sessions')
      .update({ note })
      .eq('id', id);
    setSaving(false);
    if (err) { setError('Impossible de sauvegarder la note.'); return; }
    setSessions(prev => prev.map(s => s.id === id ? { ...s, note } : s));
    setEditNote(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-BE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function tlAccuracy(s: SavedSession) {
    if (s.tl_total === 0) return '—';
    return `${Math.round((s.tl_good / s.tl_total) * 100)} %`;
  }

  const chartMax = sessions.length > 0 ? Math.max(...sessions.map(s => s.score), 1) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">
          ← Retour
        </button>
        <h2 className="text-xl font-bold text-gray-800">📊 Tableau de bord PlanBot</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Sélecteur de joueur */}
      {players.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune séance enregistrée pour l'instant.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map(p => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition ${
                selected === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {selected && !loading && sessions.length > 0 && (
        <>
          {/* Mini graphe score */}
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Score par séance — {selected}</h3>
            <div className="flex items-end gap-1 h-24">
              {[...sessions].reverse().map((s, i) => {
                const h = Math.round((s.score / chartMax) * 88);
                return (
                  <div key={s.id} className="flex flex-col items-center flex-1 min-w-0 gap-1">
                    <div
                      className="w-full rounded-t-md bg-indigo-400 transition-all"
                      style={{ height: Math.max(h, 4) }}
                      title={`${s.score} pts`}
                    />
                    <span className="text-xs text-gray-400 rotate-0 truncate w-full text-center">
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">({sessions.length} séance{sessions.length > 1 ? 's' : ''})</p>
          </div>

          {/* Mini graphe planning_tries */}
          <div className="bg-white border-2 border-amber-100 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Essais planification par séance</h3>
            <div className="flex items-end gap-1 h-16">
              {[...sessions].reverse().map((s, i) => {
                const maxTries = Math.max(...sessions.map(x => x.planning_tries), 1);
                const h = Math.round((s.planning_tries / maxTries) * 56);
                return (
                  <div key={s.id} className="flex flex-col items-center flex-1 min-w-0 gap-1">
                    <div
                      className="w-full rounded-t-md bg-amber-400 transition-all"
                      style={{ height: Math.max(h, 4) }}
                      title={`${s.planning_tries} essais`}
                    />
                    <span className="text-xs text-gray-400 truncate w-full text-center">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau des séances */}
          <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 text-gray-600 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-center font-semibold">Niv.</th>
                  <th className="px-3 py-2 text-center font-semibold">Score</th>
                  <th className="px-3 py-2 text-center font-semibold">Essais plan.</th>
                  <th className="px-3 py-2 text-center font-semibold">Précision feu</th>
                  <th className="px-3 py-2 text-center font-semibold">Durée</th>
                  <th className="px-3 py-2 text-left font-semibold">Note clinique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatDate(s.created_at)}</td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-600">{s.level}</td>
                    <td className="px-3 py-2 text-center font-bold">{s.score}</td>
                    <td className="px-3 py-2 text-center">{s.planning_tries}</td>
                    <td className="px-3 py-2 text-center">{tlAccuracy(s)}</td>
                    <td className="px-3 py-2 text-center">{s.duration_s} s</td>
                    <td className="px-3 py-2 max-w-xs">
                      {editNote?.id === s.id ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            value={editNote.note}
                            onChange={e => setEditNote({ id: s.id, note: e.target.value })}
                            className="flex-1 border border-indigo-300 rounded px-2 py-1 text-xs"
                            placeholder="Note clinique…"
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveNote(s.id, editNote.note);
                              if (e.key === 'Escape') setEditNote(null);
                            }}
                          />
                          <button
                            onClick={() => saveNote(s.id, editNote.note)}
                            disabled={saving}
                            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
                          >
                            ✓
                          </button>
                          <button onClick={() => setEditNote(null)} className="text-xs px-2 py-1 border rounded">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditNote({ id: s.id, note: s.note ?? '' })}
                          className="text-left text-gray-600 hover:text-indigo-600 transition w-full truncate"
                          title={s.note ?? 'Ajouter une note'}
                        >
                          {s.note ? s.note : <span className="text-gray-300 italic">+ note</span>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && loading && (
        <div className="text-center text-sm text-gray-400 py-8">Chargement…</div>
      )}

      {selected && !loading && sessions.length === 0 && (
        <p className="text-sm text-gray-400">Aucune séance pour {selected}.</p>
      )}
    </div>
  );
}
