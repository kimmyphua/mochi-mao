import { DIFFICULTY_SETTINGS } from '../game/constants';
import type { LeaderboardEntry } from '../game/types';

interface LeaderboardScreenProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
}

export function LeaderboardScreen({
  entries,
  onBack,
}: LeaderboardScreenProps) {
  return (
    <section className="panel screen-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Hall of Fame</p>
          <h2>Leaderboard</h2>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Back
        </button>
      </div>

      <ol className="leaderboard-list">
        {entries.map((entry, index) => (
          <li key={entry.id}>
            <span className="leaderboard-rank">#{index + 1}</span>
            <div>
              <strong>{entry.name}</strong>
              {" --- "}
              <small>{DIFFICULTY_SETTINGS[entry.difficulty].label}</small>
            </div>
            <strong>{entry.score}</strong>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="empty-state">Catch some mochi to start the leaderboard.</li>
        )}
      </ol>
    </section>
  );
}
