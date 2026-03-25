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
  const groupedEntries = {
    easy: entries.filter((entry) => entry.difficulty === 'easy').slice(0, 5),
    normal: entries.filter((entry) => entry.difficulty === 'normal').slice(0, 5),
    hard: entries.filter((entry) => entry.difficulty === 'hard').slice(0, 5),
  };

  return (
    <section className="panel screen-card app-screen-card leaderboard-screen">
      <div className="section-head">
        <div>
          <p className="eyebrow">Hall of Fame</p>
          <h2>Leaderboard</h2>
        </div>
        <button className="secondary-button" onClick={onBack} type="button">
          Back
        </button>
      </div>

      <div className="leaderboard-list leaderboard-sections">
        {(['hard', 'normal', 'easy'] as const).map((difficulty) => (
          <section key={difficulty} className="leaderboard-group">
            <p className="section-label">{DIFFICULTY_SETTINGS[difficulty].label}</p>
            <ol>
              {groupedEntries[difficulty].map((entry, index) => (
                <li key={entry.id}>
                  <span className="leaderboard-rank">#{index + 1}</span>
                  <div>
                    <strong>{entry.name}</strong>
                  </div>
                  <strong>{entry.score}</strong>
                </li>
              ))}
              {groupedEntries[difficulty].length === 0 && (
                <li className="empty-state">No scores yet.</li>
              )}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
