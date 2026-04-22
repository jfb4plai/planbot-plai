// ===== PlanBot — Estimation de confiance (métacognition) =====

type Props = {
  onRate: (rating: number) => void;
};

const RATINGS = [
  { value: 1, emoji: '😟', label: 'Pas sûr du tout' },
  { value: 2, emoji: '😐', label: 'Pas vraiment sûr' },
  { value: 3, emoji: '🙂', label: 'Assez sûr' },
  { value: 4, emoji: '💪', label: 'Très sûr !' },
];

export default function ConfidenceStep({ onRate }: Props) {
  return (
    <div className="max-w-sm mx-auto px-4 py-12 text-center space-y-6">
      <div className="text-4xl">🤔</div>
      <h2 className="text-lg font-bold text-gray-800">
        À ton avis, est-ce que le robot va réussir ?
      </h2>
      <p className="text-sm text-gray-500">Choisis ce qui correspond le mieux à ce que tu ressens.</p>
      <div className="grid grid-cols-2 gap-3">
        {RATINGS.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => onRate(value)}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-indigo-200 bg-white hover:bg-indigo-50 active:bg-indigo-100 transition"
          >
            <span className="text-4xl">{emoji}</span>
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
