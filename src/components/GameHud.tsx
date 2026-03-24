interface GameHudProps {
  score: number;
  timeLeft: number;
  lives: number;
  difficultyLabel: string;
}

export function GameHud({ score, timeLeft, lives, difficultyLabel }: GameHudProps) {
  return (
    <header className="hud">
      <div className="hud-pill">
        <span className="hud-label">Score</span>
        <strong>{score}</strong>
      </div>
      <div className="hud-pill">
        <span className="hud-label">Time</span>
        <strong>{timeLeft}s</strong>
      </div>
      <div className="hud-pill">
        <span className="hud-label">Lives</span>
        <strong>{'❤'.repeat(lives)}</strong>
      </div>
      <div className="hud-pill difficulty-pill">
        <span className="hud-label">Mode</span>
        <strong>{difficultyLabel}</strong>
      </div>
    </header>
  );
}
