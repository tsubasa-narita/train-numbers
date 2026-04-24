import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Tab = 'home' | 'practice' | 'reward';
type Mode = 'level1' | 'level2' | 'level3' | 'practice';
type Pattern = 'carCount' | 'trainCount' | 'numberMatch';

type Progress = {
  totalStars: number;
  levelStats: Record<'1' | '2' | '3', { playCount: number; maxStars: number; hasThreeStar: boolean }>;
  practiceStats: { playCount: number; totalCorrect: number };
  unlockedTrainIds: string[];
  settings: { soundEnabled: boolean };
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
  trainTone: string;
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
const ASSET_SHEET = '/images/ui/train-assets.png';

const TRAIN_NAMES = [
  'きいろい しんかんせん',
  'まるい しんかんせん',
  'しろい しんかんせん',
  'はやい しんかんせん',
  'あかい しんかんせん',
  'みどりの でんしゃ',
  'オレンジの でんしゃ',
  'あおい でんしゃ',
  'ぎんいろ ちかてつ',
  'まるのうちせん',
  'ぎんざせん',
  'とっきゅう',
  'スペーシア',
  'おどりこ',
  'サンライズ',
  'きかんしゃ',
  'あかい けいきゅう',
  'おだきゅう',
  'はんきゅう',
  'モノレール',
];

const TRAIN_TONES = ['yellow', 'green', 'blue', 'red', 'teal', 'orange', 'silver', 'purple'];

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
    settings: { soundEnabled: true },
    firstLaunchedAt: now,
    lastPlayedAt: now,
  };
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
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

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function questionText(pattern: Pattern, n: number) {
  if (pattern === 'carCount') return 'この でんしゃは なんりょう?';
  if (pattern === 'trainCount') return 'でんしゃは なんほん いる?';
  return `${n}と おなじ かずは どれ?`;
}

function generateQuestions(mode: Mode): Question[] {
  const range = rangeForMode(mode);
  const patterns: Pattern[] = shuffle(['carCount', 'trainCount', 'numberMatch']);
  return Array.from({ length: 3 }, (_, index) => {
    const pattern = patterns[index % patterns.length];
    const correctNum = pick(range);
    const wrongPool = range.filter((n) => n !== correctNum);
    const choices = shuffle([correctNum, ...shuffle(wrongPool).slice(0, 2)]);
    return {
      id: `${mode}-${index}-${pattern}-${correctNum}`,
      pattern,
      correctNum,
      choices,
      prompt: questionText(pattern, correctNum),
      hint: pattern === 'carCount' ? 'しゃりょうを 1りょうずつ かぞえよう' : pattern === 'trainCount' ? 'えの なかの でんしゃを ぜんぶ みつけよう' : 'でんしゃの かずを くらべて えらぼう',
      trainTone: pick(TRAIN_TONES),
    };
  });
}

function unlockedIds(totalStars: number) {
  const thresholds = [0, 0, 0, 5, 5, 5, 10, 10, 10, 20, 20, 20, 35, 35, 35, 50, 50, 50, 80, 80];
  return thresholds.map((threshold, i) => (totalStars >= threshold ? `train-${i + 1}` : '')).filter(Boolean);
}

function completeSession(progress: Progress, quiz: QuizState): Progress {
  const stars = quiz.missed.filter(Boolean).length === 0 ? 3 : quiz.missed.filter(Boolean).length <= 2 ? 2 : 1;
  const nextStars = progress.totalStars + stars;
  const next: Progress = {
    ...progress,
    totalStars: nextStars,
    unlockedTrainIds: unlockedIds(nextStars),
    lastPlayedAt: new Date().toISOString(),
  };
  if (quiz.mode === 'practice') {
    next.practiceStats = {
      playCount: progress.practiceStats.playCount + 1,
      totalCorrect: progress.practiceStats.totalCorrect + 3,
    };
  } else {
    const level = quiz.mode.replace('level', '') as '1' | '2' | '3';
    const stat = progress.levelStats[level];
    next.levelStats = {
      ...progress.levelStats,
      [level]: {
        playCount: stat.playCount + 1,
        maxStars: Math.max(stat.maxStars, stars),
        hasThreeStar: stat.hasThreeStar || stars === 3,
      },
    };
  }
  return next;
}

function progressReducer(progress: Progress, action: { type: 'toggleSound' } | { type: 'finish'; quiz: QuizState }) {
  if (action.type === 'toggleSound') return { ...progress, settings: { soundEnabled: !progress.settings.soundEnabled } };
  return completeSession(progress, action.quiz);
}

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [progress, dispatch] = useReducer(progressReducer, undefined, loadProgress);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const sound = progress.settings.soundEnabled;

  useEffect(() => saveProgress(progress), [progress]);

  const startQuiz = (mode: Mode) => {
    ping('tap', sound);
    const nextQuiz = { mode, questions: generateQuestions(mode), index: 0, missed: [false, false, false], selected: null, status: 'answering' as const };
    setQuiz(nextQuiz);
    setTab(mode === 'practice' ? 'practice' : 'home');
    setTimeout(() => speak(nextQuiz.questions[0].prompt, sound), 150);
  };

  const answer = (choice: number) => {
    if (!quiz || quiz.status !== 'answering') return;
    const current = quiz.questions[quiz.index];
    if (choice === current.correctNum) {
      ping('correct', sound);
      speak(pick(['せいかい! すごいね!', 'じょうず! やったー!']), sound);
      setQuiz({ ...quiz, selected: choice, status: 'correct' });
      setTimeout(() => {
        setQuiz((latest) => {
          if (!latest) return latest;
          if (latest.index === latest.questions.length - 1) {
            const done = { ...latest, status: 'done' as const };
            dispatch({ type: 'finish', quiz: done });
            ping('star', sound);
            return done;
          }
          const moved = { ...latest, index: latest.index + 1, selected: null, status: 'answering' as const };
          setTimeout(() => speak(moved.questions[moved.index].prompt, sound), 100);
          return moved;
        });
      }, 850);
    } else {
      ping('incorrect', sound);
      speak('おしい! もういちど ちょうせん!', sound);
      const missed = [...quiz.missed];
      missed[quiz.index] = true;
      setQuiz({ ...quiz, missed, selected: choice, status: 'incorrect' });
    }
  };

  const retry = () => {
    if (!quiz) return;
    ping('tap', sound);
    setQuiz({ ...quiz, selected: null, status: 'answering' });
    speak(quiz.questions[quiz.index].prompt, sound);
  };

  const goTab = (next: Tab) => {
    ping('tap', sound);
    setQuiz(null);
    setTab(next);
  };

  return (
    <main className="shell">
      <section className="phone" aria-label="れっしゃで かずあそび">
        <Header progress={progress} sound={sound} onToggle={() => dispatch({ type: 'toggleSound' })} onSpeak={() => quiz && speak(quiz.questions[quiz.index]?.prompt ?? 'れっしゃで かずあそび', sound)} />
        <div className="screen">
          {quiz ? (
            quiz.status === 'done' ? (
              <ResultScreen quiz={quiz} sound={sound} onReplay={() => startQuiz(quiz.mode)} onHome={() => goTab('home')} />
            ) : (
              <QuizScreen quiz={quiz} onAnswer={answer} onRetry={retry} sound={sound} />
            )
          ) : tab === 'home' ? (
            <Home progress={progress} onStart={startQuiz} />
          ) : tab === 'practice' ? (
            <Practice progress={progress} onStart={() => startQuiz('practice')} />
          ) : (
            <Reward progress={progress} sound={sound} />
          )}
        </div>
        <BottomTabs active={tab} onTab={goTab} />
      </section>
    </main>
  );
}

function Header({ progress, sound, onToggle, onSpeak }: { progress: Progress; sound: boolean; onToggle: () => void; onSpeak: () => void }) {
  return (
    <header className="topbar">
      <button className="sound" onClick={onToggle} aria-label="おとのオンオフ">
        <span>{sound ? '🔊' : '🔇'}</span>
        <b>おと</b>
      </button>
      <button className="logo" onClick={onSpeak} aria-label="よみあげ">
        <small>れっしゃで</small>
        <strong><span>か</span><span>ず</span><span>あ</span><span>そ</span><span>び</span></strong>
      </button>
      <div className="stars" aria-label={`ごほうび ${progress.totalStars}こ`}>
        <span>⭐</span>
        <b>ごほうび</b>
        <strong>{progress.totalStars}</strong>
      </div>
    </header>
  );
}

function Home({ progress, onStart }: { progress: Progress; onStart: (mode: Mode) => void }) {
  return (
    <div className="home">
      <div className="hero">
        <div>
          <p className="pill">3さいから</p>
          <h1>でんしゃが すきな子へ</h1>
          <p>1から10の かずを たのしく まなぼう</p>
        </div>
        <img src={ASSET_SHEET} alt="" className="asset-preview" />
      </div>
      <ConductorBubble text="どの かずで あそぶ?" />
      <LevelCard tone="yellow" title="1〜3" subtitle="はじめての かず" nums={[1, 2, 3]} onClick={() => onStart('level1')} />
      <LevelCard tone="green" title="4〜6" subtitle="すこしずつ チャレンジ" nums={[4, 5, 6]} onClick={() => onStart('level2')} />
      <LevelCard tone="blue" title="7〜10" subtitle="しっかり かぞえよう" nums={[7, 8, 9, 10]} onClick={() => onStart('level3')} />
      <p className="mini">これまでの ごほうび: ⭐ {progress.totalStars}こ</p>
    </div>
  );
}

function LevelCard({ tone, title, subtitle, nums, onClick }: { tone: string; title: string; subtitle: string; nums: number[]; onClick: () => void }) {
  return (
    <button className={`level-card ${tone}`} onClick={onClick}>
      <TrainLine count={Math.min(nums.length + 1, 5)} tone={tone} compact />
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
      <div className="conductor" aria-hidden="true">👨‍✈️</div>
      <p>{text}</p>
    </div>
  );
}

function QuizScreen({ quiz, onAnswer, onRetry, sound }: { quiz: QuizState; onAnswer: (choice: number) => void; onRetry: () => void; sound: boolean }) {
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
      <VisualQuestion question={q} />
      <div className={q.pattern === 'numberMatch' ? 'choice-grid image-choices' : 'choice-grid'}>
        {q.choices.map((choice) => (
          <button key={choice} className={choiceClass(quiz, choice)} onClick={() => onAnswer(choice)}>
            {q.pattern === 'numberMatch' ? <TrainGroup count={choice} tone={q.trainTone} tiny /> : choice}
          </button>
        ))}
      </div>
      {quiz.status === 'incorrect' && <button className="retry" onClick={onRetry}>もういちど</button>}
      <div className="question-count">🚩 もんだい {quiz.index + 1} / 3</div>
    </div>
  );
}

function VisualQuestion({ question }: { question: Question }) {
  if (question.pattern === 'carCount') {
    return <div className="visual"><TrainLine count={question.correctNum} tone={question.trainTone} /></div>;
  }
  return <div className="visual"><TrainGroup count={question.correctNum} tone={question.trainTone} /></div>;
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

function ResultScreen({ quiz, sound, onReplay, onHome }: { quiz: QuizState; sound: boolean; onReplay: () => void; onHome: () => void }) {
  const missed = quiz.missed.filter(Boolean).length;
  const stars = missed === 0 ? 3 : missed <= 2 ? 2 : 1;
  const line = stars === 3 ? 'ぜんもん せいかい! すごい!' : stars === 2 ? 'よく できました!' : 'さいごまで がんばったね!';
  useEffect(() => speak(line, sound), [line, sound]);
  return (
    <div className="result">
      <ConductorBubble text={line} />
      <h2>ごほうび</h2>
      <div className="big-stars">{Array.from({ length: 3 }, (_, i) => <span key={i} className={i < stars ? 'on' : ''}>★</span>)}</div>
      <p>⭐ {stars}こ あつめたよ</p>
      <button className="primary" onClick={onReplay}>もういちど あそぶ</button>
      <button className="secondary" onClick={onHome}>ホームに もどる</button>
    </div>
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

function Reward({ progress, sound }: { progress: Progress; sound: boolean }) {
  const unlocked = new Set(progress.unlockedTrainIds);
  return (
    <div className="reward">
      <h1>ごほうび</h1>
      <div className="reward-stars">⭐ <strong>{progress.totalStars}</strong>こ</div>
      <div className="boards">
        {(['1', '2', '3'] as const).map((level) => (
          <div className="board" key={level}>
            <b>Lv{level}</b>
            <span>{progress.levelStats[level].playCount}かい</span>
            <span>{'★'.repeat(progress.levelStats[level].maxStars)}{'☆'.repeat(3 - progress.levelStats[level].maxStars)}</span>
          </div>
        ))}
      </div>
      <h2>でんしゃ ずかん</h2>
      <div className="collection">
        {TRAIN_NAMES.map((name, i) => {
          const id = `train-${i + 1}`;
          const open = unlocked.has(id);
          return (
            <button key={id} className={`train-tile ${open ? '' : 'locked'}`} onClick={() => open && speak(name, sound)} aria-label={open ? name : 'まだ ひみつ'}>
              <TrainLine count={1} tone={TRAIN_TONES[i % TRAIN_TONES.length]} compact />
              <small>{open ? name : '🔒'}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BottomTabs({ active, onTab }: { active: Tab; onTab: (tab: Tab) => void }) {
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: 'ホーム' },
    { id: 'practice', icon: '✏️', label: 'れんしゅう' },
    { id: 'reward', icon: '🏆', label: 'ごほうび' },
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
