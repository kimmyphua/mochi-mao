import type { Difficulty, LeaderboardEntry } from '../game/types';

interface GameOverScreenProps {
  score: number;
  difficulty: Difficulty;
  playerName: string;
  isScoreSaved: boolean;
  leaderboard: LeaderboardEntry[];
  onNameChange: (value: string) => void;
  onSaveScore: () => void;
  onReplay: () => void;
  onHome: () => void;
  onShowLeaderboard: () => void;
}

export function GameOverScreen({
  score,
  difficulty,
  playerName,
  isScoreSaved,
  leaderboard,
  onNameChange,
  onSaveScore,
  onReplay,
  onHome,
  onShowLeaderboard,
}: GameOverScreenProps) {
  return (
    <section className="panel screen-card">
      <p className="eyebrow">Round Finished</p>
      <h2>Game Over</h2>
      <p className="screen-copy">
        Final score: <strong>{score}</strong> on{' '}
        <strong>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</strong>.
      </p>
      <div className="showcase-wrap">
        <div className="cat-sprite sad-cat mood-crying">
          <span className="cat-ear cat-ear-left" />
          <span className="cat-ear cat-ear-right" />
          <span className="cat-face">
            <span className="cat-eye left" />
            <span className="cat-eye right" />
            <span className="cat-nose" />
            <span className="cat-mouth" />
            <span className="tear tear-left" />
            <span className="tear tear-right" />
          </span>
          <span className="cat-paw cat-paw-left" />
          <span className="cat-paw cat-paw-right" />
        </div>
      </div>

      <div className="save-score-card">
        <label className="section-label" htmlFor="player-name">
          Save your score
        </label>
        <div className="save-score-row">
          <input
            id="player-name"
            maxLength={14}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Cat name"
            type="text"
            value={playerName}
          />
          <button
            className="primary-button"
            disabled={isScoreSaved || playerName.trim().length === 0}
            onClick={onSaveScore}
            type="button"
          >
            {isScoreSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="mini-board">
        <div className="section-head">
          <p className="section-label">Top scores</p>
          <button className="link-button" onClick={onShowLeaderboard} type="button">
            View all
          </button>
        </div>
        <ol>
          {leaderboard.slice(0, 5).map((entry) => (
            <li key={entry.id}>
              <span>{entry.name}</span>
              <strong>{entry.score}</strong>
            </li>
          ))}
          {leaderboard.length === 0 && <li className="empty-state">No scores yet.</li>}
        </ol>
      </div>

      <div className="button-row">
        <button className="primary-button" onClick={onReplay} type="button">
          Retry
        </button>
        <button className="secondary-button" onClick={onHome} type="button">
          Back
        </button>
      </div>
    </section>
  );
}
