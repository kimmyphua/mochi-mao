import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import badCatchUrl from './sounds/bad_catch.mp3';
import easyBgmUrl from './sounds/bgm_level_easy.mp3';
import hardBgmUrl from './sounds/bgm_level_hard.mp3';
import mediumBgmUrl from './sounds/bgm_level_medium.mp3';
import gainLifeUrl from './sounds/gain_live.mp3';
import gameOverUrl from './sounds/game_over.mp3';
import gameStartUrl from './sounds/game_start.mp3';
import goodCatchUrl from './sounds/good_catch.mp3';
import { GameHud } from './components/GameHud';
import { GameOverScreen } from './components/GameOverScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { StartScreen } from './components/StartScreen';
import {
  DIFFICULTY_SETTINGS,
  GAME_DURATION_SECONDS,
  ITEM_SIZE,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  STARTING_LIVES,
} from './game/constants';
import { addLeaderboardEntry, loadLeaderboard } from './game/storage';
import type {
  Difficulty,
  FallingItem,
  GameScreen,
  LeaderboardEntry,
} from './game/types';
import { clamp, createItem, isColliding } from './game/utils';
import { createHeartItem } from './game/utils';

const ARENA_WIDTH = 360;
const ARENA_HEIGHT = 640;
const PLAYER_Y = ARENA_HEIGHT - PLAYER_HEIGHT - 20;
const PLAYER_SPEED = 330;

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState((ARENA_WIDTH - PLAYER_WIDTH) / 2);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('Mochi');
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [isCatHurt, setIsCatHurt] = useState(false);
  const [arenaScale, setArenaScale] = useState(1);

  const animationFrameRef = useRef<number>();
  const countdownTimeoutRef = useRef<number>();
  const hurtTimeoutRef = useRef<number>();
  const gameStartAudioRef = useRef<HTMLAudioElement>();
  const goodCatchAudioRef = useRef<HTMLAudioElement>();
  const badCatchAudioRef = useRef<HTMLAudioElement>();
  const gainLifeAudioRef = useRef<HTMLAudioElement>();
  const gameOverAudioRef = useRef<HTMLAudioElement>();
  const bgmAudioRefs = useRef<Record<Difficulty, HTMLAudioElement>>();
  const lastFrameRef = useRef(0);
  const spawnAccumulatorRef = useRef(0);
  const heartSpawnTimerRef = useRef(0);
  const heartSpawnArmedRef = useRef(false);
  const itemIdRef = useRef(0);
  const movementRef = useRef(0);
  const gameStateRef = useRef({
    score: 0,
    lives: STARTING_LIVES,
    timeLeft: GAME_DURATION_SECONDS,
    playerX: (ARENA_WIDTH - PLAYER_WIDTH) / 2,
    difficulty: 'normal' as Difficulty,
  });
  const screenRef = useRef<GameScreen>('start');
  const touchStartXRef = useRef<number | null>(null);
  const gameLayoutRef = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const touchControlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gameStartAudioRef.current = new Audio(gameStartUrl);
    goodCatchAudioRef.current = new Audio(goodCatchUrl);
    badCatchAudioRef.current = new Audio(badCatchUrl);
    gainLifeAudioRef.current = new Audio(gainLifeUrl);
    gameOverAudioRef.current = new Audio(gameOverUrl);
    bgmAudioRefs.current = {
      easy: new Audio(easyBgmUrl),
      normal: new Audio(mediumBgmUrl),
      hard: new Audio(hardBgmUrl),
    };

    Object.values(bgmAudioRefs.current).forEach((audio) => {
      audio.loop = true;
      audio.volume = 0.35;
    });

    setLeaderboard(loadLeaderboard());
  }, []);

  useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) {
        window.clearTimeout(countdownTimeoutRef.current);
      }
      if (hurtTimeoutRef.current) {
        window.clearTimeout(hurtTimeoutRef.current);
      }
      stopBgm();
    };
  }, []);

  useEffect(() => {
    gameStateRef.current.score = score;
    gameStateRef.current.lives = lives;
    gameStateRef.current.timeLeft = timeLeft;
    gameStateRef.current.playerX = playerX;
    gameStateRef.current.difficulty = difficulty;
  }, [difficulty, lives, playerX, score, timeLeft]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    const isScreenLocked = true;
    const isPlayingLikeScreen = screen === 'playing';
    document.body.classList.toggle('screen-locked', isScreenLocked);
    document.documentElement.classList.toggle('screen-locked', isScreenLocked);
    document.body.classList.toggle('playing-mode', isPlayingLikeScreen);
    document.documentElement.classList.toggle('playing-mode', isPlayingLikeScreen);

    return () => {
      document.body.classList.remove('screen-locked');
      document.documentElement.classList.remove('screen-locked');
      document.body.classList.remove('playing-mode');
      document.documentElement.classList.remove('playing-mode');
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'playing') {
      setArenaScale(1);
      return;
    }

    const updateArenaScale = () => {
      const layout = gameLayoutRef.current;
      const hud = hudRef.current;
      const touchControls = touchControlsRef.current;
      if (!layout || !hud) {
        return;
      }

      const layoutStyles = window.getComputedStyle(layout);
      const rowGap = Number.parseFloat(layoutStyles.rowGap || layoutStyles.gap || '0');
      const touchControlsVisible =
        touchControls && window.getComputedStyle(touchControls).display !== 'none';
      const controlsHeight = touchControlsVisible ? touchControls.offsetHeight : 0;
      const verticalGaps = rowGap * (touchControlsVisible ? 2 : 1);
      const availableHeight = Math.max(
        240,
        layout.clientHeight - hud.offsetHeight - controlsHeight - verticalGaps,
      );
      const availableWidth = Math.max(260, layout.clientWidth);
      const nextScale = Math.min(
        1,
        availableWidth / ARENA_WIDTH,
        availableHeight / ARENA_HEIGHT,
      );

      setArenaScale((current) => (Math.abs(current - nextScale) > 0.01 ? nextScale : current));
    };

    const animationFrame = window.requestAnimationFrame(updateArenaScale);
    const resizeObserver = new ResizeObserver(updateArenaScale);

    if (gameLayoutRef.current) {
      resizeObserver.observe(gameLayoutRef.current);
    }
    if (hudRef.current) {
      resizeObserver.observe(hudRef.current);
    }
    if (touchControlsRef.current) {
      resizeObserver.observe(touchControlsRef.current);
    }

    window.addEventListener('resize', updateArenaScale);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateArenaScale);
    };
  }, [screen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (screenRef.current !== 'playing') {
        return;
      }
      if (event.key === 'ArrowLeft') {
        movementRef.current = -1;
      }
      if (event.key === 'ArrowRight') {
        movementRef.current = 1;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && movementRef.current < 0) {
        movementRef.current = 0;
      }
      if (event.key === 'ArrowRight' && movementRef.current > 0) {
        movementRef.current = 0;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (screen !== 'playing') {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    lastFrameRef.current = performance.now();
    spawnAccumulatorRef.current = 0;

    const loop = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;

      const settings = DIFFICULTY_SETTINGS[gameStateRef.current.difficulty];
      const nextTimeLeft = Math.max(
        0,
        gameStateRef.current.timeLeft - deltaSeconds,
      );
      if (Math.ceil(nextTimeLeft) !== Math.ceil(gameStateRef.current.timeLeft)) {
        setTimeLeft(Math.ceil(nextTimeLeft));
      }
      gameStateRef.current.timeLeft = nextTimeLeft;

      setPlayerX((current) => {
        const moved = current + movementRef.current * PLAYER_SPEED * deltaSeconds;
        const clamped = clamp(moved, 0, ARENA_WIDTH - PLAYER_WIDTH);
        gameStateRef.current.playerX = clamped;
        return clamped;
      });

      spawnAccumulatorRef.current += deltaSeconds * 1000;
      const nextItems: FallingItem[] = [];

      if (spawnAccumulatorRef.current >= settings.spawnIntervalMs) {
        spawnAccumulatorRef.current -= settings.spawnIntervalMs;
        nextItems.push(createItem(++itemIdRef.current, difficulty, ARENA_WIDTH));
      }

      if (gameStateRef.current.lives < STARTING_LIVES) {
        if (!heartSpawnArmedRef.current) {
          heartSpawnArmedRef.current = true;
          heartSpawnTimerRef.current = randomHeartDelaySeconds();
        }

        heartSpawnTimerRef.current -= deltaSeconds;
        if (heartSpawnTimerRef.current <= 0) {
          nextItems.push(createHeartItem(++itemIdRef.current, ARENA_WIDTH));
          heartSpawnTimerRef.current = randomHeartDelaySeconds();
        }
      } else {
        heartSpawnArmedRef.current = false;
      }

      setItems((currentItems) => {
        const merged = [...currentItems, ...nextItems];
        const remaining: FallingItem[] = [];
        let pointsGained = 0;
        let livesLost = 0;
        let livesGained = 0;

        merged.forEach((item) => {
          const nextY = item.y + item.speed * settings.speedMultiplier * deltaSeconds;
          const movedItem = { ...item, y: nextY };

          if (isColliding(movedItem, gameStateRef.current.playerX, PLAYER_Y)) {
            if (movedItem.type === 'heart') {
              livesGained += movedItem.heal ?? 1;
            } else if (movedItem.kind === 'good') {
              pointsGained += movedItem.points ?? 0;
            } else {
              livesLost += movedItem.damage ?? 1;
            }
            return;
          }

          if (nextY <= ARENA_HEIGHT) {
            remaining.push(movedItem);
          }
        });

        if (pointsGained > 0) {
          playSound(goodCatchAudioRef.current);
          setScore((currentScore) => {
            const nextScore = currentScore + pointsGained;
            gameStateRef.current.score = nextScore;
            return nextScore;
          });
        }

        if (livesLost > 0) {
          playSound(badCatchAudioRef.current);
          triggerCatHurt();
          setLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - livesLost);
            gameStateRef.current.lives = nextLives;
            return nextLives;
          });
        }

        if (livesGained > 0) {
          playSound(gainLifeAudioRef.current);
          setLives((currentLives) => {
            const nextLives = Math.min(STARTING_LIVES, currentLives + livesGained);
            gameStateRef.current.lives = nextLives;
            return nextLives;
          });
        }

        return remaining;
      });

      if (gameStateRef.current.timeLeft <= 0 || gameStateRef.current.lives <= 0) {
        finishGame();
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(loop);
    };

    animationFrameRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [difficulty, screen]);

  function resetGameState() {
    const initialX = (ARENA_WIDTH - PLAYER_WIDTH) / 2;
    movementRef.current = 0;
    itemIdRef.current = 0;
    spawnAccumulatorRef.current = 0;
    heartSpawnTimerRef.current = 0;
    heartSpawnArmedRef.current = false;
    if (countdownTimeoutRef.current) {
      window.clearTimeout(countdownTimeoutRef.current);
    }
    gameStateRef.current = {
      score: 0,
      lives: STARTING_LIVES,
      timeLeft: GAME_DURATION_SECONDS,
      playerX: initialX,
      difficulty,
    };
    setScore(0);
    setLives(STARTING_LIVES);
    setTimeLeft(GAME_DURATION_SECONDS);
    setItems([]);
    setPlayerX(initialX);
    setIsScoreSaved(false);
    setIsCatHurt(false);
  }

  function startGame() {
    resetGameState();
    playSound(gameStartAudioRef.current);
    setScreen('countdown');
    countdownTimeoutRef.current = window.setTimeout(() => {
      setScreen('playing');
      startBgm();
    }, 2000);
  }

  function triggerCatHurt() {
    setIsCatHurt(true);
    if (hurtTimeoutRef.current) {
      window.clearTimeout(hurtTimeoutRef.current);
    }
    hurtTimeoutRef.current = window.setTimeout(() => {
      setIsCatHurt(false);
    }, 320);
  }

  function randomHeartDelaySeconds() {
    return 20 + Math.random() * 10;
  }

  function finishGame() {
    stopBgm();
    playSound(gameOverAudioRef.current);
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    setScreen('gameOver');
    setItems([]);
    movementRef.current = 0;
    setIsCatHurt(false);
  }

  function saveScore() {
    const trimmedName = playerName.trim();
    if (!trimmedName || isScoreSaved) {
      return;
    }

    const nextLeaderboard = addLeaderboardEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      score,
      difficulty,
      createdAt: Date.now(),
    });
    setLeaderboard(nextLeaderboard);
    setIsScoreSaved(true);
  }

  function handleSwipeStart(clientX: number) {
    touchStartXRef.current = clientX;
  }

  function playSound(audio?: HTMLAudioElement) {
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }

  function startBgm() {
    const bgm = bgmAudioRefs.current?.[difficulty];
    if (!bgm) {
      return;
    }
    stopBgm();
    bgm.currentTime = 0;
    void bgm.play().catch(() => {});
  }

  function stopBgm() {
    if (!bgmAudioRefs.current) {
      return;
    }
    Object.values(bgmAudioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function handleSwipeEnd(clientX: number) {
    if (touchStartXRef.current === null || screen !== 'playing') {
      touchStartXRef.current = null;
      return;
    }

    const deltaX = clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 24) {
      setPlayerX((current) => {
        const nextX = clamp(
          current + Math.sign(deltaX) * 56,
          0,
          ARENA_WIDTH - PLAYER_WIDTH,
        );
        gameStateRef.current.playerX = nextX;
        return nextX;
      });
    }
    touchStartXRef.current = null;
  }

  const difficultyLabel = useMemo(
    () => DIFFICULTY_SETTINGS[difficulty].label,
    [difficulty],
  );
  const arenaViewportStyle = useMemo(
    () =>
      ({
        ['--arena-scale' as string]: arenaScale.toString(),
        ['--arena-width' as string]: `${ARENA_WIDTH}px`,
        ['--arena-height' as string]: `${ARENA_HEIGHT}px`,
      }) satisfies CSSProperties,
    [arenaScale],
  );

  return (
    <main
      className={`app-shell fixed-shell${
        screen === 'playing' ? ' playing-shell' : ''
      }`}
    >
      <div
        className={`app-frame fixed-frame${
          screen === 'playing' ? ' playing-frame' : ''
        }`}
        style={screen === 'playing' ? arenaViewportStyle : undefined}
      >
        <div
          className={`brand-panel${screen === 'playing' ? ' compact-brand' : ''}${
            screen === 'gameOver' ||
            screen === 'start' ||
            screen === 'countdown' ||
            screen === 'leaderboard'
              ? ' app-screen-brand'
              : ''
          }`}
        >
          <p className="pixel-badge">Mochi Mao</p>
          <p className="brand-copy">
            Catch the treats. Dodge the trouble.
          </p>
        </div>

        {screen === 'start' && (
          <StartScreen
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onLeaderboard={() => setScreen('leaderboard')}
            onStart={startGame}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            entries={leaderboard}
            onBack={() => setScreen(score > 0 || lives < STARTING_LIVES ? 'gameOver' : 'start')}
          />
        )}

        {screen === 'countdown' && (
          <section className="panel screen-card countdown-screen app-screen-card">
            <p className="eyebrow">Get Ready</p>
            <h2>MOCHI MAO</h2>
            <p className="screen-copy">Catch the treats. Dodge the trouble.</p>
            <div className="showcase-wrap">
              <div className="cat-sprite intro-cat floating-cat">
                <span className="cat-ear cat-ear-left" />
                <span className="cat-ear cat-ear-right" />
                <span className="cat-face">
                  <span className="cat-eye left" />
                  <span className="cat-eye right" />
                  <span className="cat-nose" />
                  <span className="cat-mouth" />
                </span>
                <span className="cat-paw cat-paw-left" />
                <span className="cat-paw cat-paw-right" />
              </div>
            </div>
            <div className="instruction-card">
              <p className="section-label">Instructions</p>
              <p>Catch the treats and dodge the trouble.</p>
              <p>Desktop: arrow keys. Mobile: swipe or use touch buttons.</p>
              <p>Mode: {difficultyLabel}</p>
            </div>
          </section>
        )}

        {screen === 'gameOver' && (
          <GameOverScreen
            difficulty={difficulty}
            isScoreSaved={isScoreSaved}
            leaderboard={leaderboard}
            onHome={() => {
              resetGameState();
              setScreen('start');
            }}
            onNameChange={setPlayerName}
            onReplay={startGame}
            onSaveScore={saveScore}
            onShowLeaderboard={() => setScreen('leaderboard')}
            playerName={playerName}
            score={score}
          />
        )}

        {screen === 'playing' && (
          <section ref={gameLayoutRef} className="game-layout">
            <div ref={hudRef}>
              <GameHud
                difficultyLabel={difficultyLabel}
                lives={lives}
                score={score}
                timeLeft={Math.max(0, Math.ceil(timeLeft))}
              />
            </div>

            <div className="game-viewport" style={arenaViewportStyle}>
              <div
                className="game-arena panel"
                onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
                onTouchMove={(event) => {
                  event.preventDefault();
                }}
                onTouchStart={(event) => handleSwipeStart(event.touches[0]?.clientX ?? 0)}
              >
                <div className="pixel-cloud pixel-cloud-left" />
                <div className="pixel-cloud pixel-cloud-right" />
                <div className="skyline" />
                <div className="ground-strip" />

                {items.map((item) => (
                  <div
                    key={item.id}
                    aria-label={item.label}
                    className={`falling-item ${item.kind} ${item.type}`}
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px)`,
                      ['--item-color' as string]: item.color,
                      ['--item-accent' as string]: item.accent,
                      ['--item-size' as string]: `${item.size ?? ITEM_SIZE}px`,
                    }}
                  >
                    <span aria-hidden="true" className="item-art" />
                    <span className="sr-only">{item.label}</span>
                  </div>
                ))}

                <div
                  aria-label="Pastel cat"
                  className={`cat-sprite${isCatHurt ? ' hurt' : ''}`}
                  style={{ transform: `translate(${playerX}px, ${PLAYER_Y}px)` }}
                >
                  <span className="cat-ear cat-ear-left" />
                  <span className="cat-ear cat-ear-right" />
                  <span className="cat-face">
                    <span className="cat-eye left" />
                    <span className="cat-eye right" />
                    <span className="cat-nose" />
                    <span className="cat-mouth" />
                  </span>
                  <span className="cat-paw cat-paw-left" />
                  <span className="cat-paw cat-paw-right" />
                </div>
              </div>
            </div>

            <div ref={touchControlsRef} className="touch-controls">
              <button
                className="touch-button"
                onPointerDown={() => {
                  movementRef.current = -1;
                }}
                onPointerUp={() => {
                  if (movementRef.current < 0) {
                    movementRef.current = 0;
                  }
                }}
                onPointerLeave={() => {
                  if (movementRef.current < 0) {
                    movementRef.current = 0;
                  }
                }}
                type="button"
              >
                ◀
              </button>
              <button
                className="touch-button"
                onPointerDown={() => {
                  movementRef.current = 1;
                }}
                onPointerUp={() => {
                  if (movementRef.current > 0) {
                    movementRef.current = 0;
                  }
                }}
                onPointerLeave={() => {
                  if (movementRef.current > 0) {
                    movementRef.current = 0;
                  }
                }}
                type="button"
              >
                ▶
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
