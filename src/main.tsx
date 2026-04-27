import React, { useEffect, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QUIZ_TRAINS, type QuizTrain } from './data/quizTrains';
import './styles.css';

type Tab = 'home' | 'practice' | 'reward' | 'settings';
type Mode = 'level1' | 'level2' | 'level3' | 'practice';
type Pattern = 'trainCount';
type TilePattern = 'fixed' | 'shuffle' | 'mixed';
type QuestionRange = 'level' | '1-3' | '4-6' | '7-10' | '1-10';

type Settings = {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  effectsEnabled: boolean;
  tilePattern: TilePattern;
  questionRange: QuestionRange;
};

type Progress = {
  totalStars: number;
  levelStats: Record<'1' | '2' | '3', { playCount: number; maxStars: number; hasThreeStar: boolean }>;
  practiceStats: { playCount: number; totalCorrect: number };
  unlockedTrainIds: string[];
  settings: Settings;
  firstLaunchedAt: string;
  lastPlayedAt: string;
};

type Question = {
  id: string;
  pattern: Pattern;
  correctNum: number;
  choices: number[];
  prompt: string;
  hint: string;
  trains: QuizTrain[];
};

type QuizState = {
  mode: Mode;
  questions: Question[];
  index: number;
  missed: boolean[];
  selected: number | null;
  status: 'answering' | 'correct' | 'incorrect' | 'done';
};

const STORAGE_KEY = 'ressha_kazu_progress';
const HOME_BACKGROUND = `${import.meta.env.BASE_URL}images/ui/home-background.png`;
const CONDUCTOR_BOY = `${import.meta.env.BASE_URL}images/ui/conductor-boy-home.png`;
const REWARD_GIFT = `${import.meta.env.BASE_URL}images/ui/reward-train-gift.png`;
const trainImageUrl = (filename: string) => `${import.meta.env.BASE_URL}images/trains/${filename}`;
const TRAIN_NAMES = QUIZ_TRAINS.map((train) => train.displayName);

const TRAIN_TONES = ['yellow', 'green', 'blue', 'red', 'teal', 'orange', 'silver', 'purple'];
const REWARD_CARD_SIZE = 10;
const REWARD_CARDS = [
  { title: 'かがやき', image: `${import.meta.env.BASE_URL}images/ui/reward-card-kagayaki.png` },
  { title: 'さいきょうせん', image: `${import.meta.env.BASE_URL}images/ui/reward-card-saikyo.png` },
  { title: 'よこすかせん', image: `${import.meta.env.BASE_URL}images/ui/reward-card-yokosuka.png` },
  { title: 'しょうなんしんじゅく', image: `${import.meta.env.BASE_URL}images/ui/reward-card-shonan-shinjuku.png` },
];

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  voiceEnabled: true,
  effectsEnabled: true,
  tilePattern: 'fixed',
  questionRange: 'level',
};

function defaultProgress(): Progress {
  const now = new Date().toISOString();
  return {
    totalStars: 0,
    levelStats: {
      '1': { playCount: 0, maxStars: 0, hasThreeStar: false },
      '2': { playCount: 0, maxStars: 0, hasThreeStar: false },
      '3': { playCount: 0, maxStars: 0, hasThreeStar: false },
    },
    practiceStats: { playCount: 0, totalCorrect: 0 },
    unlockedTrainIds: ['train-1', 'train-2', 'train-3'],
    settings: DEFAULT_SETTINGS,
    firstLaunchedAt: now,
    lastPlayedAt: now,
  };
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const fallback = defaultProgress();
    const legacySound = parsed.settings?.soundEnabled ?? true;
    return {
      ...fallback,
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        soundEnabled: legacySound,
        voiceEnabled: parsed.settings?.voiceEnabled ?? legacySound,
        effectsEnabled: parsed.settings?.effectsEnabled ?? legacySound,
        tilePattern: parsed.settings?.tilePattern ?? DEFAULT_SETTINGS.tilePattern,
        questionRange: parsed.settings?.questionRange ?? DEFAULT_SETTINGS.questionRange,
      },
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Local storage is optional for this child-facing app.
  }
}

function speak(text: string, enabled: boolean) {
  if (!enabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  utter.rate = 0.9;
  utter.pitch = 1.1;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

function ping(kind: 'tap' | 'correct' | 'incorrect' | 'star', enabled: boolean) {
  if (!enabled) return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = { tap: 520, correct: 880, incorrect: 220, star: 1100 }[kind];
  osc.frequency.value = freq;
  osc.type = kind === 'incorrect' ? 'triangle' : 'sine';
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === 'incorrect' ? 0.22 : 0.16));
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

function rangeForMode(mode: Mode) {
  if (mode === 'level1') return [1, 2, 3];
  if (mode === 'level2') return [4, 5, 6];
  if (mode === 'level3') return [7, 8, 9, 10];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

function rangeForSetting(mode: Mode, questionRange: QuestionRange) {
  if (questionRange === '1-3') return [1, 2, 3];
  if (questionRange === '4-6') return [4, 5, 6];
  if (questionRange === '7-10') return [7, 8, 9, 10];
  if (questionRange === '1-10') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return rangeForMode(mode);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickN<T>(items: T[], count: number) {
  return shuffle(items).slice(0, count);
}

function questionText() {
  return 'でんしゃは なんほん いる?';
}

function generateQuestions(mode: Mode, settings: Settings): Question[] {
  const range = rangeForSetting(mode, settings.questionRange);
  let previousNum: number | null = null;
  return Array.from({ length: 3 }, (_, index) => {
    const pattern: Pattern = 'trainCount';
    const candidates = previousNum === null ? range : range.filter((n) => n !== previousNum);
    const correctNum = pick(candidates);
    previousNum = correctNum;
    const wrongPool = range.filter((n) => n !== correctNum);
    const choices = shuffle([correctNum, ...shuffle(wrongPool).slice(0, 2)]);
    return {
      id: `${mode}-${index}-${pattern}-${correctNum}`,
      pattern,
      correctNum,
      choices,
      prompt: questionText(),
      hint: '1だいずつ みて かぞえよう',
      trains: pickN(QUIZ_TRAINS, correctNum),
    };
  });
}

function unlockedIds(totalStars: number) {
  const thresholds = QUIZ_TRAINS.map((_, index) => (index < 3 ? 0 : Math.ceil((index - 2) / 3) * 5));
  return thresholds.map((threshold, i) => (totalStars >= threshold ? `train-${i + 1}` : '')).filter(Boolean);
}

function completeSession(progress: Progress, quiz: QuizState): Progress {
  const missed = quiz.missed.filter(Boolean).length;
  const resultStars = missed === 0 ? 3 : missed <= 2 ? 2 : 1;
  const earnedRewardStars = missed === 0 ? 1 : 0;
  const correctCount = quiz.questions.length - missed;
  const nextStars = progress.totalStars + earnedRewardStars;
  const next: Progress = {
    ...progress,
    totalStars: nextStars,
    unlockedTrainIds: unlockedIds(nextStars),
    lastPlayedAt: new Date().toISOString(),
  };
  if (quiz.mode === 'practice') {
    next.practiceStats = {
      playCount: progress.practiceStats.playCount + 1,
      totalCorrect: progress.practiceStats.totalCorrect + correctCount,
    };
  } else {
    const level = quiz.mode.replace('level', '') as '1' | '2' | '3';
    const stat = progress.levelStats[level];
    next.levelStats = {
      ...progress.levelStats,
      [level]: {
        playCount: stat.playCount + 1,
        maxStars: Math.max(stat.maxStars, resultStars),
        hasThreeStar: stat.hasThreeStar || resultStars === 3,
      },
    };
  }
  return next;
}

function progressReducer(progress: Progress, action: { type: 'toggleVoice' } | { type: 'updateSettings'; settings: Partial<Settings> } | { type: 'resetStamps' } | { type: 'finish'; quiz: QuizState }) {
  if (action.type === 'toggleVoice') {
    const nextVoice = !progress.settings.voiceEnabled;
    return { ...progress, settings: { ...progress.settings, voiceEnabled: nextVoice, soundEnabled: nextVoice } };
  }
  if (action.type === 'updateSettings') {
    const nextSettings = { ...progress.settings, ...action.settings };
    return { ...progress, settings: { ...nextSettings, soundEnabled: nextSettings.voiceEnabled || nextSettings.effectsEnabled } };
  }
  if (action.type === 'resetStamps') {
    return { ...progress, totalStars: 0, unlockedTrainIds: unlockedIds(0), lastPlayedAt: new Date().toISOString() };
  }
  return completeSession(progress, action.quiz);
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [progress, dispatch] = useReducer(progressReducer, undefined, loadProgress);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const voice = progress.settings.voiceEnabled;
  const effects = progress.settings.effectsEnabled;

  useEffect(() => saveProgress(progress), [progress]);

  const startQuiz = (mode: Mode) => {
    ping('tap', effects);
    const nextQuiz = { mode, questions: generateQuestions(mode, progress.settings), index: 0, missed: [false, false, false], selected: null, status: 'answering' as const };
    setQuiz(nextQuiz);
    setTab(mode === 'practice' ? 'practice' : 'home');
    setTimeout(() => speak(nextQuiz.questions[0].prompt, voice), 150);
  };

  const answer = (choice: number) => {
    if (!quiz || quiz.status !== 'answering') return;
    const current = quiz.questions[quiz.index];
    if (choice === current.correctNum) {
      ping('correct', effects);
      speak(pick(['せいかい! すごいね!', 'じょうず! やったー!']), voice);
      setQuiz({ ...quiz, selected: choice, status: 'correct' });
      setTimeout(() => {
        setQuiz((latest) => {
          if (!latest) return latest;
          if (latest.index === latest.questions.length - 1) {
            const done = { ...latest, status: 'done' as const };
            dispatch({ type: 'finish', quiz: done });
            if (!done.missed.some(Boolean)) ping('star', effects);
            return done;
          }
          const moved = { ...latest, index: latest.index + 1, selected: null, status: 'answering' as const };
          setTimeout(() => speak(moved.questions[moved.index].prompt, voice), 100);
          return moved;
        });
      }, 850);
    } else {
      ping('incorrect', effects);
      speak('おしい! もういちど ちょうせん!', voice);
      const missed = [...quiz.missed];
      missed[quiz.index] = true;
      setQuiz({ ...quiz, missed, selected: choice, status: 'incorrect' });
    }
  };

  const retry = () => {
    if (!quiz) return;
    ping('tap', effects);
    setQuiz({ ...quiz, selected: null, status: 'answering' });
    speak(quiz.questions[quiz.index].prompt, voice);
  };

  const goTab = (next: Tab) => {
    ping('tap', effects);
    setQuiz(null);
    setTab(next);
  };

  return (
    <main className="shell">
      <section className={`phone ${quiz ? 'is-quiz' : tab === 'home' ? 'is-home' : ''}`} style={{ '--home-bg': `url(${HOME_BACKGROUND})` } as React.CSSProperties} aria-label="れっしゃで かずあそび">
        <Header onSpeak={() => quiz && speak(quiz.questions[quiz.index]?.prompt ?? 'れっしゃで かずあそび', voice)} />
        <div className={`screen ${quiz ? 'quiz-screen' : `${tab}-screen`}`}>
          {quiz ? (
            quiz.status === 'done' ? (
              <ResultScreen quiz={quiz} totalStars={progress.totalStars} sound={voice} onReplay={() => startQuiz(quiz.mode)} onHome={() => goTab('home')} />
            ) : (
              <QuizScreen quiz={quiz} onAnswer={answer} onRetry={retry} sound={voice} tilePattern={progress.settings.tilePattern} />
            )
          ) : tab === 'home' ? (
            <Home progress={progress} onStart={startQuiz} />
          ) : tab === 'practice' ? (
            <Practice progress={progress} onStart={() => startQuiz('practice')} />
          ) : tab === 'settings' ? (
            <SettingsPanel settings={progress.settings} onChange={(settings) => dispatch({ type: 'updateSettings', settings })} onResetStamps={() => dispatch({ type: 'resetStamps' })} />
          ) : (
            <RewardPanel progress={progress} sound={effects} />
          )}
        </div>
        <BottomTabs active={tab} onTab={goTab} />
      </section>
    </main>
  );
}

function Header({ onSpeak }: { onSpeak: () => void }) {
  return (
    <header className="topbar">
      <button className="logo" onClick={onSpeak} aria-label="よみあげ">
        <small>れっしゃで</small>
        <strong><span>か</span><span>ず</span><span>あ</span><span>そ</span><span>び</span></strong>
      </button>
    </header>
  );
}

function Home({ onStart }: { progress: Progress; onStart: (mode: Mode) => void }) {
  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-logo" aria-hidden="true">
          <small>れっしゃで</small>
          <strong><span>か</span><span>ず</span><span>あ</span><span>そ</span><span>び</span></strong>
        </div>
        <img className="home-conductor" src={CONDUCTOR_BOY} alt="" aria-hidden="true" />
      </div>
      <LevelCard tone="yellow" title="1〜3" subtitle="はじめての かず" nums={[1, 2, 3]} image="komachi.png" onClick={() => onStart('level1')} />
      <LevelCard tone="green" title="4〜6" subtitle="すこしずつ チャレンジ" nums={[4, 5, 6]} image="yokosuka_e235_1000.png" onClick={() => onStart('level2')} />
      <LevelCard tone="blue" title="7〜10" subtitle="しっかり かぞえよう" nums={[7, 8, 9, 10]} image="kagayaki_e7_w7.png" onClick={() => onStart('level3')} />
      <FutureLevelCard />
    </div>
  );
}

function LevelCard({ tone, title, subtitle, nums, image, onClick }: { tone: string; title: string; subtitle: string; nums: number[]; image: string; onClick: () => void }) {
  return (
    <button className={`level-card ${tone}`} onClick={onClick}>
      <img className="level-thumb" src={trainImageUrl(image)} alt="" />
      <span className="level-text">
        <strong>{title}</strong>
        <small>{subtitle}</small>
        <span>{nums.map((n) => <b key={n}>{n}</b>)}</span>
      </span>
      <i>→</i>
    </button>
  );
}

function ConductorBubble({ text }: { text: string }) {
  return (
    <div className="bubble">
      <img className="conductor" src={CONDUCTOR_BOY} alt="" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function QuizScreen({ quiz, onAnswer, onRetry, sound, tilePattern }: { quiz: QuizState; onAnswer: (choice: number) => void; onRetry: () => void; sound: boolean; tilePattern: TilePattern }) {
  const q = quiz.questions[quiz.index];
  useEffect(() => speak(q.prompt, sound), [q.id, q.prompt, sound]);
  return (
    <div className="quiz">
      <div className="progress-stars">
        {[0, 1, 2].map((i) => <span key={i} className={i < quiz.index ? 'filled' : i === quiz.index && !quiz.missed[i] ? 'filled' : ''}>★</span>)}
      </div>
      <ConductorBubble text={q.hint} />
      <button className="question-card" onClick={() => speak(q.prompt, sound)}>
        <span>{modeLabel(quiz.mode)}</span>
        <strong>{q.prompt}</strong>
      </button>
      <VisualQuestion question={q} tilePattern={tilePattern} />
      <div className="choice-grid">
        {q.choices.map((choice) => (
          <button key={choice} className={choiceClass(quiz, choice)} onClick={() => onAnswer(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {quiz.status === 'incorrect' && <button className="retry" onClick={onRetry}>もういちど</button>}
      <div className="question-count">🚩 もんだい {quiz.index + 1} / 3</div>
    </div>
  );
}

function VisualQuestion({ question, tilePattern }: { question: Question; tilePattern: TilePattern }) {
  const layoutClass = tilePattern === 'fixed' ? 'layout-fixed' : tilePattern === 'shuffle' ? 'layout-shuffle' : `layout-mixed layout-${(question.correctNum + question.id.length) % 3}`;
  return (
    <div className="visual photo-visual">
      <div className={`train-card-grid count-${question.correctNum} ${layoutClass}`} aria-label={`${question.correctNum}だいの でんしゃ`}>
        {question.trains.map((train) => (
          <img key={`${question.id}-${train.id}`} src={trainImageUrl(train.image)} alt={`${train.displayName} ${train.model}`} title={`${train.displayName} ${train.model}`} />
        ))}
      </div>
    </div>
  );
}

function TrainLine({ count, tone, compact = false }: { count: number; tone: string; compact?: boolean }) {
  return (
    <div className={`train-line ${compact ? 'compact' : ''}`} aria-label={`${count}りょう`}>
      {Array.from({ length: count }, (_, i) => <div className={`car ${tone}`} key={i}><span /></div>)}
    </div>
  );
}

function TrainGroup({ count, tone, tiny = false }: { count: number; tone: string; tiny?: boolean }) {
  return (
    <div className={`train-group ${tiny ? 'tiny' : ''}`} aria-label={`${count}ほん`}>
      {Array.from({ length: count }, (_, i) => <TrainLine key={i} count={tiny ? 1 : Math.min(4, Math.max(2, Math.ceil(count / 2)))} tone={tone} compact />)}
    </div>
  );
}

function ResultScreen({ quiz, totalStars, sound, onReplay, onHome }: { quiz: QuizState; totalStars: number; sound: boolean; onReplay: () => void; onHome: () => void }) {
  const missed = quiz.missed.filter(Boolean).length;
  const earnedStamp = missed === 0;
  const cardStars = totalStars === 0 ? 0 : totalStars % REWARD_CARD_SIZE || REWARD_CARD_SIZE;
  const activeCard = Math.max(1, Math.ceil(Math.max(totalStars, 1) / REWARD_CARD_SIZE));
  const newStampIndex = earnedStamp ? Math.max(0, cardStars - 1) : -1;
  const line = earnedStamp ? 'ぜんもん せいかい! スタンプ ゲット!' : 'よく できました! つぎは スタンプを めざそう!';
  useEffect(() => speak(line, sound), [line, sound]);
  return (
    <div className="result">
      <ConductorBubble text={line} />
      <h2>ごほうび</h2>
      <div className={`stamp-result ${earnedStamp ? 'earned' : 'missed'}`} aria-label={earnedStamp ? `ごほうびカード${activeCard}まいめにスタンプを1こゲット` : '今回はスタンプなし'}>
        <p className="stamp-card-status">カード {activeCard}まいめ</p>
        <div className="stamp-card-mini" aria-hidden="true">
          {Array.from({ length: REWARD_CARD_SIZE }, (_, i) => (
            <span key={i} className={`${i < cardStars ? 'filled' : ''} ${i === newStampIndex ? 'new-stamp' : ''}`.trim()}>
              {i === newStampIndex ? (
                <>
                  <b>★</b>
                  <em>ポン!</em>
                </>
              ) : (
                '★'
              )}
            </span>
          ))}
        </div>
        <strong>{earnedStamp ? `${cardStars} / ${REWARD_CARD_SIZE}こ たまったよ!` : 'ぜんもんせいかいで スタンプ 1こ!'}</strong>
      </div>
      <button className="primary" onClick={onReplay}>もういちど あそぶ</button>
      <button className="secondary" onClick={onHome}>ホームに もどる</button>
    </div>
  );
}

function FutureLevelCard() {
  return (
    <button className="level-card future" disabled aria-label="11から20は じゅんびちゅう">
      <div className="level-thumb future-thumb" aria-hidden="true">?</div>
      <span className="level-text">
        <strong>???</strong>
        <small>11〜20 じゅんびちゅう</small>
        <span>{[11, 12, 13].map((n) => <b key={n}>?</b>)}</span>
      </span>
      <i>🔒</i>
    </button>
  );
}

function Practice({ progress, onStart }: { progress: Progress; onStart: () => void }) {
  return (
    <div className="practice">
      <h1>れんしゅう</h1>
      <ConductorBubble text="1から10まで まぜて あそぼう!" />
      <button className="start" onClick={onStart}>スタート</button>
      <p>これまでの れんしゅう</p>
      <strong>{progress.practiceStats.playCount}かい</strong>
    </div>
  );
}

function RewardPanel({ progress, sound }: { progress: Progress; sound: boolean }) {
  const earnedCards = Math.min(REWARD_CARDS.length, Math.floor(progress.totalStars / REWARD_CARD_SIZE));
  const [previewCard, setPreviewCard] = useState<number | null>(null);
  const cardStars = progress.totalStars === 0 ? 0 : progress.totalStars % REWARD_CARD_SIZE || REWARD_CARD_SIZE;
  const remainingStars = REWARD_CARD_SIZE - cardStars;
  const activeCard = Math.max(1, Math.ceil(Math.max(progress.totalStars, 1) / REWARD_CARD_SIZE));
  const previewCards = REWARD_CARDS.slice(0, earnedCards);
  const modalCard = previewCard === null ? null : REWARD_CARDS[previewCard];
  return (
    <div className="reward">
      <section className="reward-showcase" aria-label="ごほうびカード">
        <div className="reward-card">
          <div className="reward-card-title"><span>★</span>カード {activeCard}まいめ<span>★</span></div>
          <div className="reward-card-grid">
            {Array.from({ length: REWARD_CARD_SIZE }, (_, i) => (
              <span key={i} className={i < cardStars ? 'filled' : ''}>★</span>
            ))}
          </div>
        </div>
        <div className="reward-gift" aria-hidden="true">
          <img src={REWARD_GIFT} alt="" />
        </div>
      </section>
      <div className="reward-message">
        {remainingStars === 0 ? (
          <>
            <span>カード いっぱい!</span>
            <span>ごほうび ゲット!</span>
          </>
        ) : (
          <>
            <span>あと <b>{remainingStars}</b>つで</span>
            <span>ごほうび!</span>
          </>
        )}
      </div>
      <section className="reward-collection" aria-label="あつめた れっしゃ">
        <h2>🎟️ あつめた ごほうびカード</h2>
        <div className="reward-card-previews">
          {previewCards.length > 0 ? (
            previewCards.map((card, index) => (
              <button key={card.title} className="reward-card-preview" onClick={() => { ping('tap', sound); setPreviewCard(index); }} aria-label={`${card.title} のごほうびカードをおおきくみる`}>
                <img src={card.image} alt="" />
                <span>{card.title}</span>
              </button>
            ))
          ) : (
            <div className="reward-card-empty">ごほうびカードを あつめよう!</div>
          )}
        </div>
      </section>
      {modalCard && (
        <div className="reward-modal" role="dialog" aria-modal="true" aria-label={`${modalCard.title} のごほうびカード`}>
          <button className="reward-modal-backdrop" onClick={() => setPreviewCard(null)} aria-label="閉じる" />
          <div className="reward-modal-card">
            <button className="reward-modal-close" onClick={() => setPreviewCard(null)} aria-label="閉じる">×</button>
            <img className="reward-modal-image" src={modalCard.image} alt={`${modalCard.title} のごほうびカード`} />
            <p>{modalCard.title} のごほうびカード!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ settings, onChange, onResetStamps }: { settings: Settings; onChange: (settings: Partial<Settings>) => void; onResetStamps: () => void }) {
  const tileOptions: { value: TilePattern; label: string; hint: string }[] = [
    { value: 'fixed', label: 'いつも同じ', hint: '見やすくならべる' },
    { value: 'shuffle', label: 'まぜる', hint: '写真の大きさを少し変える' },
    { value: 'mixed', label: 'ランダム', hint: '毎回ちがう形にする' },
  ];
  const rangeOptions: { value: QuestionRange; label: string }[] = [
    { value: 'level', label: 'レベルどおり' },
    { value: '1-3', label: '1〜3' },
    { value: '4-6', label: '4〜6' },
    { value: '7-10', label: '7〜10' },
    { value: '1-10', label: '1〜10' },
  ];
  const confirmResetStamps = () => {
    if (window.confirm('ごほうびカードのスタンプを ぜんぶ けします。よろしいですか?')) {
      onResetStamps();
    }
  };
  return (
    <div className="settings">
      <h1>⚙️ せってい</h1>
      <section className="setting-group">
        <h2>タイルの ならべかた</h2>
        <div className="setting-options three">
          {tileOptions.map((option) => (
            <button key={option.value} className={settings.tilePattern === option.value ? 'selected' : ''} onClick={() => onChange({ tilePattern: option.value })}>
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="setting-group">
        <h2>もんだいの はんい</h2>
        <div className="setting-options ranges">
          {rangeOptions.map((option) => (
            <button key={option.value} className={settings.questionRange === option.value ? 'selected' : ''} onClick={() => onChange({ questionRange: option.value })}>
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <section className="setting-group switches">
        <button className={settings.voiceEnabled ? 'selected' : ''} onClick={() => onChange({ voiceEnabled: !settings.voiceEnabled })}>
          <span>🔊</span>
          <strong>よみあげ</strong>
          <small>{settings.voiceEnabled ? 'オン' : 'オフ'}</small>
        </button>
        <button className={settings.effectsEnabled ? 'selected' : ''} onClick={() => onChange({ effectsEnabled: !settings.effectsEnabled })}>
          <span>🎵</span>
          <strong>こうかおん</strong>
          <small>{settings.effectsEnabled ? 'オン' : 'オフ'}</small>
        </button>
      </section>
      <section className="setting-group danger">
        <h2>ごほうびカード</h2>
        <button className="reset-stamps" onClick={confirmResetStamps}>
          <span>🧹</span>
          <strong>スタンプを けす</strong>
          <small>カードのスタンプだけを 0こにする</small>
        </button>
      </section>
    </div>
  );
}

function BottomTabs({ active, onTab }: { active: Tab; onTab: (tab: Tab) => void }) {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: 'ホーム' },
    { id: 'practice', icon: '✏️', label: 'れんしゅう' },
    { id: 'reward', icon: '🏆', label: 'ごほうび' },
    { id: 'settings', icon: '⚙️', label: 'せってい' },
  ];
  return (
    <nav className="tabs">
      {tabs.map((tab) => <button key={tab.id} className={active === tab.id ? 'active' : ''} onClick={() => onTab(tab.id)}><span>{tab.icon}</span>{tab.label}</button>)}
    </nav>
  );
}

function modeLabel(mode: Mode) {
  if (mode === 'level1') return '1〜3 はじめての かず';
  if (mode === 'level2') return '4〜6 すこしずつ チャレンジ';
  if (mode === 'level3') return '7〜10 しっかり かぞえよう';
  return 'れんしゅう';
}

function choiceClass(quiz: QuizState, choice: number) {
  const q = quiz.questions[quiz.index];
  const base = 'choice';
  if (quiz.selected !== choice) return base;
  return `${base} ${choice === q.correctNum ? 'right' : 'wrong'}`;
}

createRoot(document.getElementById('root')!).render(<App />);
