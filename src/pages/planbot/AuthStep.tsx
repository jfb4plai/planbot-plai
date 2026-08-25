import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Props = {
  onAuth: () => void;
  passwordRecovery?: boolean;
  onPasswordUpdated?: () => void;
};

export default function AuthStep({ onAuth, passwordRecovery = false, onPasswordUpdated }: Props) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [newPassword, setNewPassword] = useState('');

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
    } else if (mode === 'reset') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (err) {
        setError(err.message);
      } else {
        setInfo('Email envoyé ! Vérifiez votre boîte mail pour créer un nouveau mot de passe.');
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

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('6 caractères minimum.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    if (err) setError(err.message);
    else onPasswordUpdated?.();
    setLoading(false);
  }

  const inputCls = 'w-full border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white';

  if (passwordRecovery) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-indigo-700 mb-1">🤖 PlanBot</h2>
            <p className="text-sm text-gray-500">Choisissez un nouveau mot de passe.</p>
          </div>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                autoFocus
                className={inputCls}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition disabled:opacity-50"
            >
              {loading ? '…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-indigo-700 mb-1">🤖 PlanBot</h2>
          <p className="text-sm text-gray-500">
            {mode === 'login' ? 'Connexion intervenant' : mode === 'reset' ? 'Mot de passe oublié' : 'Créer un compte intervenant'}
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
          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  className={`${inputCls} pr-10`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}

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
            {loading ? '…' : mode === 'login' ? 'Se connecter' : mode === 'reset' ? 'Envoyer le lien' : 'Créer le compte'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 space-y-2">
          {mode !== 'reset' && (
            <p>
              {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
                className="text-indigo-600 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
          )}
          {mode === 'login' && (
            <button
              onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
              className="text-gray-400 hover:text-indigo-600 transition"
            >
              Mot de passe oublié ?
            </button>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              className="text-gray-400 hover:text-indigo-600 transition"
            >
              ← Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
