import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Props = {
  onAuth: () => void;
};

export default function AuthStep({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError('Email ou mot de passe incorrect.');
      } else {
        onAuth();
      }
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else {
        setInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.');
        setMode('login');
      }
    }
    setLoading(false);
  }

  const inputCls = 'w-full border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white';

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-indigo-700 mb-1">🤖 PlanBot</h2>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? 'Connexion intervenant' : 'Créer un compte intervenant'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              autoFocus
              className={inputCls}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@ecole.be"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              className={inputCls}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          {info && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition disabled:opacity-50"
          >
            {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
}
