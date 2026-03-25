import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import badCatchUrl from './sounds/bad_catch.mp3';
import easyBgmUrl from './sounds/bgm_level_easy.mp3';
import hardBgmUrl from './sounds/bgm_level_hard.mp3';
import mediumBgmUrl from './sounds/bgm_level_medium.mp3';
import bonusModeUrl from './sounds/bonus_mode.mp3';
import dangerModeUrl from './sounds/danger_mode.mp3';
import gainLifeUrl from './sounds/gain_live.mp3';
import gameOverUrl from './sounds/game_over.mp3';
import gameStartUrl from './sounds/game_start.mp3';
import goodCatchUrl from './sounds/good_catch.mp3';
import { GameHud } from './components/GameHud';
import { GameOverScreen } from './components/GameOverScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { StartScreen } from './components/StartScreen';
import {
  DEFAULT_BRAND_TITLE,
  DEFAULT_PLAYER_NAME,
  DIFFICULTY_SETTINGS,
  ITEM_SIZE,
  LIFE_REMAINING_BONUS,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCORE_NAME_SUGGESTIONS,
  STARTING_LIVES,
} from './game/constants';
import { addLeaderboardEntry, isLeaderboardConfigured, loadLeaderboard } from './game/storage';
import type {
  Difficulty,
  FallingItem,
  GameScreen,
  LeaderboardEntry,
  PhaseKind,
} from './game/types';
import { clamp, createItem, isColliding } from './game/utils';
import { createHeartItem } from './game/utils';

const DEFAULT_ARENA_WIDTH = 360;
const DEFAULT_ARENA_HEIGHT = 640;
const PLAYER_SPEED = 330;

function getGameDuration(difficulty: Difficulty) {
  return DIFFICULTY_SETTINGS[difficulty].durationSeconds;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [timeLeft, setTimeLeft] = useState(getGameDuration('normal'));
  const [items, setItems] = useState<FallingItem[]>([]);
  const [playerX, setPlayerX] = useState((DEFAULT_ARENA_WIDTH - PLAYER_WIDTH) / 2);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState(DEFAULT_PLAYER_NAME);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [isCatHurt, setIsCatHurt] = useState(false);
  const [currentPhaseKind, setCurrentPhaseKind] = useState<PhaseKind>('normal');
  const [arenaScale, setArenaScale] = useState(1);
  const [arenaWidth, setArenaWidth] = useState(DEFAULT_ARENA_WIDTH);
  const [arenaHeight, setArenaHeight] = useState(DEFAULT_ARENA_HEIGHT);

  const animationFrameRef = useRef<number>();
  const countdownTimeoutRef = useRef<number>();
  const hurtTimeoutRef = useRef<number>();
  const gameStartAudioRef = useRef<HTMLAudioElement>();
  const goodCatchAudioRef = useRef<HTMLAudioElement>();
  const badCatchAudioRef = useRef<HTMLAudioElement>();
  const gainLifeAudioRef = useRef<HTMLAudioElement>();
  const gameOverAudioRef = useRef<HTMLAudioElement>();
  const bonusModeAudioRef = useRef<HTMLAudioElement>();
  const dangerModeAudioRef = useRef<HTMLAudioElement>();
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
    timeLeft: getGameDuration('normal'),
    playerX: (DEFAULT_ARENA_WIDTH - PLAYER_WIDTH) / 2,
    difficulty: 'normal' as Difficulty,
    phaseKind: 'normal' as PhaseKind,
    phaseTimeLeft: 0,
  });
  const screenRef = useRef<GameScreen>('start');
  const touchStartXRef = useRef<number | null>(null);
  const touchPlayerStartXRef = useRef<number | null>(null);
  const phaseIndexRef = useRef(0);
  const gameLayoutRef = useRef<HTMLElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const touchControlsRef = useRef<HTMLDivElement>(null);

  const leaderboardConfigured = isLeaderboardConfigured();

  useEffect(() => {
    const updateArenaSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const nextArenaWidth =
        width <= 560
          ? Math.max(320, Math.min(408, width - 28))
          : DEFAULT_ARENA_WIDTH;

      setArenaWidth(nextArenaWidth);

      if (width <= 420) {
        setArenaHeight(height <= 760 ? 460 : 500);
        return;
      }

      if (width <= 560) {
        setArenaHeight(height <= 820 ? 500 : 540);
        return;
      }

      setArenaHeight(DEFAULT_ARENA_HEIGHT);
    };

    updateArenaSize();
    window.addEventListener('resize', updateArenaSize);

    return () => {
      window.removeEventListener('resize', updateArenaSize);
    };
  }, []);

  useEffect(() => {
    gameStartAudioRef.current = new Audio(gameStartUrl);
    goodCatchAudioRef.current = new Audio(goodCatchUrl);
    badCatchAudioRef.current = new Audio(badCatchUrl);
    gainLifeAudioRef.current = new Audio(gainLifeUrl);
    gameOverAudioRef.current = new Audio(gameOverUrl);
    bonusModeAudioRef.current = new Audio(bonusModeUrl);
    dangerModeAudioRef.current = new Audio(dangerModeUrl);
    bgmAudioRefs.current = {
      easy: new Audio(easyBgmUrl),
      normal: new Audio(mediumBgmUrl),
      hard: new Audio(hardBgmUrl),
    };

    Object.values(bgmAudioRefs.current).forEach((audio) => {
      audio.loop = true;
      audio.volume = 0.35;
    });

    [bonusModeAudioRef.current, dangerModeAudioRef.current].forEach((audio) => {
      if (!audio) {
        return;
      }
      audio.loop = true;
      audio.volume = 0.35;
    });

    void loadLeaderboard().then(setLeaderboard);
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
    gameStateRef.current.playerX = playerX;
    gameStateRef.current.difficulty = difficulty;
  }, [difficulty, lives, playerX, score]);

  useEffect(() => {
    const maxPlayerX = Math.max(0, arenaWidth - PLAYER_WIDTH);
    setPlayerX((current) => {
      const nextX = clamp(current, 0, maxPlayerX);
      gameStateRef.current.playerX = nextX;
      return nextX;
    });
  }, [arenaWidth]);

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
        availableWidth / arenaWidth,
        availableHeight / arenaHeight,
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
  }, [arenaHeight, arenaWidth, screen]);

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
      const previousTimeLeft = gameStateRef.current.timeLeft;
      const nextTimeLeft = Math.max(
        0,
        previousTimeLeft - deltaSeconds,
      );
      if (Math.ceil(nextTimeLeft) !== Math.ceil(gameStateRef.current.timeLeft)) {
        setTimeLeft(Math.ceil(nextTimeLeft));
      }
      gameStateRef.current.timeLeft = nextTimeLeft;

      const activePhase = gameStateRef.current.phaseKind;
      if (activePhase !== 'normal') {
        gameStateRef.current.phaseTimeLeft = Math.max(
          0,
          gameStateRef.current.phaseTimeLeft - deltaSeconds,
        );
        if (gameStateRef.current.phaseTimeLeft <= 0) {
          gameStateRef.current.phaseKind = 'normal';
          setCurrentPhaseKind('normal');
          startBgm('normal');
        }
      }

      const nextPhase = settings.phases[phaseIndexRef.current];
      if (
        nextPhase &&
        previousTimeLeft >= nextPhase.triggerTimeLeft &&
        nextTimeLeft <= nextPhase.triggerTimeLeft
      ) {
        gameStateRef.current.phaseKind = nextPhase.kind;
        gameStateRef.current.phaseTimeLeft = nextPhase.durationSeconds;
        setCurrentPhaseKind(nextPhase.kind);
        phaseIndexRef.current += 1;
        spawnAccumulatorRef.current = settings.spawnIntervalMs;
        startBgm(nextPhase.kind);
      }

      setPlayerX((current) => {
        const moved = current + movementRef.current * PLAYER_SPEED * deltaSeconds;
        const clamped = clamp(moved, 0, arenaWidth - PLAYER_WIDTH);
        gameStateRef.current.playerX = clamped;
        return clamped;
      });

      spawnAccumulatorRef.current += deltaSeconds * 1000;
      const nextItems: FallingItem[] = [];

      const currentPhaseKind = gameStateRef.current.phaseKind;
      const spawnIntervalMs =
        currentPhaseKind === 'bonus'
          ? Math.max(220, settings.spawnIntervalMs * 0.45)
          : settings.spawnIntervalMs;

      if (spawnAccumulatorRef.current >= spawnIntervalMs) {
        spawnAccumulatorRef.current -= spawnIntervalMs;
        nextItems.push(
          createItem(
            ++itemIdRef.current,
            difficulty,
            arenaWidth,
            currentPhaseKind,
          ),
        );
      }

      if (gameStateRef.current.lives < STARTING_LIVES && currentPhaseKind !== 'danger') {
        if (!heartSpawnArmedRef.current) {
          heartSpawnArmedRef.current = true;
          heartSpawnTimerRef.current = randomHeartDelaySeconds();
        }

        heartSpawnTimerRef.current -= deltaSeconds;
        if (heartSpawnTimerRef.current <= 0) {
          nextItems.push(createHeartItem(++itemIdRef.current, arenaWidth));
          heartSpawnTimerRef.current = randomHeartDelaySeconds();
        }
      } else {
        heartSpawnArmedRef.current = false;
      }

      setItems((currentItems) => {
        const merged = [...currentItems, ...nextItems];
        const remaining: FallingItem[] = [];
        let scoreDelta = 0;
        let livesLost = 0;
        let livesGained = 0;

        merged.forEach((item) => {
          const nextY = item.y + item.speed * settings.speedMultiplier * deltaSeconds;
          const movedItem = { ...item, y: nextY };

          if (isColliding(movedItem, gameStateRef.current.playerX, playerY)) {
            if (movedItem.type === 'heart') {
              livesGained += movedItem.heal ?? 1;
            } else {
              scoreDelta += movedItem.points ?? 0;
              if (movedItem.kind === 'bad') {
              livesLost += movedItem.damage ?? 1;
              }
            }
            return;
          }

          if (nextY <= arenaHeight) {
            remaining.push(movedItem);
          }
        });

        if (scoreDelta !== 0) {
          playSound(scoreDelta > 0 ? goodCatchAudioRef.current : badCatchAudioRef.current);
          setScore((currentScore) => {
            const nextScore = currentScore + scoreDelta;
            gameStateRef.current.score = nextScore;
            return nextScore;
          });
        }

        if (livesLost > 0) {
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
        finishGame(gameStateRef.current.timeLeft <= 0 ? 'timeout' : 'lives');
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
  }, [arenaHeight, arenaWidth, difficulty, screen]);

  function resetGameState() {
    const initialX = (arenaWidth - PLAYER_WIDTH) / 2;
    movementRef.current = 0;
    itemIdRef.current = 0;
    spawnAccumulatorRef.current = 0;
    heartSpawnTimerRef.current = 0;
    heartSpawnArmedRef.current = false;
    phaseIndexRef.current = 0;
    if (countdownTimeoutRef.current) {
      window.clearTimeout(countdownTimeoutRef.current);
    }
    const durationSeconds = getGameDuration(difficulty);
    gameStateRef.current = {
      score: 0,
      lives: STARTING_LIVES,
      timeLeft: durationSeconds,
      playerX: initialX,
      difficulty,
      phaseKind: 'normal',
      phaseTimeLeft: 0,
    };
    setScore(0);
    setLives(STARTING_LIVES);
    setTimeLeft(durationSeconds);
    setItems([]);
    setPlayerX(initialX);
    setIsScoreSaved(false);
    setIsCatHurt(false);
    setPlayerName(DEFAULT_PLAYER_NAME);
    setCurrentPhaseKind('normal');
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

  function finishGame(reason: 'timeout' | 'lives') {
    stopBgm();
    playSound(gameOverAudioRef.current);
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    if (reason === 'timeout' && gameStateRef.current.lives > 0) {
      const timeoutBonus = gameStateRef.current.lives * LIFE_REMAINING_BONUS;
      gameStateRef.current.score += timeoutBonus;
      setScore(gameStateRef.current.score);
    }
    setPlayerName(
      SCORE_NAME_SUGGESTIONS[
        Math.floor(Math.random() * SCORE_NAME_SUGGESTIONS.length)
      ] ?? DEFAULT_PLAYER_NAME,
    );
    setScreen('gameOver');
    setItems([]);
    movementRef.current = 0;
    setIsCatHurt(false);
  }

  async function saveScore() {
    const trimmedName = playerName.trim();
    if (!trimmedName || isScoreSaved) {
      return;
    }

    try {
      const nextLeaderboard = await addLeaderboardEntry({
        name: trimmedName,
        score,
        difficulty,
      });
      setLeaderboard(nextLeaderboard);
      setIsScoreSaved(true);
    } catch (error) {
      console.error('Failed to save score', error);
    }
  }

  function handleSwipeStart(clientX: number) {
    touchStartXRef.current = clientX;
    touchPlayerStartXRef.current = gameStateRef.current.playerX;
  }

  function handleSwipeMove(clientX: number) {
    if (
      touchStartXRef.current === null ||
      touchPlayerStartXRef.current === null ||
      screen !== 'playing'
    ) {
      return;
    }

    const deltaX = clientX - touchStartXRef.current;
    const nextX = clamp(
      touchPlayerStartXRef.current + deltaX / Math.max(arenaScale, 0.001),
      0,
      arenaWidth - PLAYER_WIDTH,
    );
    gameStateRef.current.playerX = nextX;
    setPlayerX(nextX);
  }

  function playSound(audio?: HTMLAudioElement) {
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }

  function startBgm(phaseKind: PhaseKind = 'normal') {
    const bgm =
      phaseKind === 'bonus'
        ? bonusModeAudioRef.current
        : phaseKind === 'danger'
          ? dangerModeAudioRef.current
          : bgmAudioRefs.current?.[difficulty];
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
    [bonusModeAudioRef.current, dangerModeAudioRef.current].forEach((audio) => {
      if (!audio) {
        return;
      }
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function handleSwipeEnd(clientX: number) {
    if (touchStartXRef.current === null || screen !== 'playing') {
      touchStartXRef.current = null;
      touchPlayerStartXRef.current = null;
      return;
    }

    handleSwipeMove(clientX);
    touchStartXRef.current = null;
    touchPlayerStartXRef.current = null;
  }

  const difficultyLabel = useMemo(
    () => DIFFICULTY_SETTINGS[difficulty].label,
    [difficulty],
  );
  const playerY = arenaHeight - PLAYER_HEIGHT - 20;
  const arenaViewportStyle = useMemo(
    () =>
      ({
        ['--arena-scale' as string]: arenaScale.toString(),
        ['--arena-width' as string]: `${arenaWidth}px`,
        ['--arena-height' as string]: `${arenaHeight}px`,
      }) satisfies CSSProperties,
    [arenaHeight, arenaScale, arenaWidth],
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
          <p className="pixel-badge">{DEFAULT_BRAND_TITLE}</p>
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
            canSaveScore={leaderboardConfigured}
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
                  handleSwipeMove(event.touches[0]?.clientX ?? 0);
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
                  className={`cat-sprite${
                    isCatHurt
                      ? ' hurt'
                      : currentPhaseKind === 'bonus'
                        ? ' mood-bonus'
                        : currentPhaseKind === 'danger'
                          ? ' mood-danger'
                          : ''
                  }`}
                  style={{ transform: `translate(${playerX}px, ${playerY}px)` }}
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
