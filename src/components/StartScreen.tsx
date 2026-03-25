import { DIFFICULTY_SETTINGS } from '../game/constants';
import type { Difficulty } from '../game/types';

interface StartScreenProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
  onLeaderboard: () => void;
}

export function StartScreen({
  difficulty,
  onDifficultyChange,
  onStart,
  onLeaderboard,
}: StartScreenProps) {
  return (
    <section className="panel screen-card start-screen app-screen-card">
      <p className="eyebrow">Cozy Arcade</p>
      <h1>Mochi Mao's Treats</h1>
      <p className="screen-copy">Catch treats, dodge trouble, and beat the clock.</p>

      <div className="difficulty-group">
        <div className="difficulty-grid">
          {(Object.entries(DIFFICULTY_SETTINGS) as [Difficulty, (typeof DIFFICULTY_SETTINGS)[Difficulty]][]).map(
            ([value, config]) => (
              <button
                key={value}
                className={`difficulty-card${difficulty === value ? ' active' : ''}`}
                onClick={() => onDifficultyChange(value)}
                type="button"
              >
                <span>{config.label}</span>
                <small>
                  {value === 'easy' && 'Slow treats, fewer hazards'}
                  {value === 'normal' && 'Balanced pace and risk'}
                  {value === 'hard' && 'Fast falls, more hazards'}
                </small>
              </button>
            ),
          )}
        </div>
      </div>

      <div className="button-row">
        <button className="primary-button" onClick={onStart} type="button">
          Start Game
        </button>
        <button className="secondary-button" onClick={onLeaderboard} type="button">
          Leaderboard
        </button>
      </div>

      <div className="control-hint">
        <span>Desktop: arrow keys</span>
        <span>Mobile: swipe or hold touch buttons</span>
      </div>
    </section>
  );
}
