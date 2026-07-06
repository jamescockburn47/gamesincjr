'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type GameType = 'space' | 'runner' | 'puzzle' | 'racing' | 'shooter' | 'flying' | 'collecting' | 'fighting' | 'strategy';
type Colors = 'colorful' | 'dark-neon' | 'bright' | 'retro';
type ArtStyle = 'geometric' | 'cartoon' | 'pixel' | 'fancy';
type Background = 'space' | 'city' | 'forest' | 'ocean' | 'sky';
type Movement = 'left-right' | 'four-way' | 'mouse' | 'auto-move';
type SpecialAction = 'none' | 'shoot' | 'jump' | 'powerup';

interface Brief {
  creatorName: string;
  creatorEmail: string;
  gameTitle: string;
  gameDescription: string;
  gameType: GameType;
  secondVerb: string;
  twist: string;
  difficulty: number;
  speed: number;
  lives: number;
  colors: Colors;
  artStyle: ArtStyle;
  background: Background;
  movement: Movement;
  specialAction: SpecialAction;
  collectibles: string[];
  hazards: string[];
  features: string[];
}

const EMPTY_BRIEF: Brief = {
  creatorName: '',
  creatorEmail: '',
  gameTitle: '',
  gameDescription: '',
  gameType: 'space',
  secondVerb: '',
  twist: '',
  difficulty: 3,
  speed: 3,
  lives: 3,
  colors: 'colorful',
  artStyle: 'cartoon',
  background: 'space',
  movement: 'four-way',
  specialAction: 'shoot',
  collectibles: [],
  hazards: [],
  features: [],
};

const PRESET_OPTIONS = {
  collectibles: ['coins', 'stars', 'gems', 'hearts', 'power-ups', 'keys', 'shields', 'magnets'],
  hazards: ['enemies', 'asteroids', 'spikes', 'lava', 'lasers', 'bombs', 'black holes', 'obstacles'],
  features: ['combo system', 'power-ups', 'checkpoints', 'boss battles', 'time attack', 'infinite mode', 'leaderboards', 'achievements'],
};

const SECOND_VERB_EXAMPLES = [
  'Catch a falling star and throw it back at an enemy',
  'Press space to dash through walls for 1 second',
  'Hold shield to block, but you move slower while holding it',
  'Grab a coin to freeze time for 2 seconds',
];

const TWIST_EXAMPLES = [
  'Gravity flips upside down every 30 seconds',
  "You play as the boss, and lots of tiny heroes attack you",
  'It gets dark at night and you can only see near your torch',
  'Everything you touch turns to ice and becomes slippery',
];

type Step = 'about' | 'brief' | 'building' | 'preview' | 'submitting' | 'success';

export default function MakeYourGameForm() {
  const [step, setStep] = useState<Step>('about');
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [code, setCode] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [reviseInstruction, setReviseInstruction] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ submissionId: string; status: string } | null>(null);

  const toggleArrayItem = (field: 'collectibles' | 'hazards' | 'features', item: string) => {
    setBrief(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item],
    }));
  };

  async function handleBuildDraft(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStep('building');
    try {
      const res = await fetch('/api/games/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not build your draft.');
      setCode(data.code);
      setDraftVersion(v => v + 1);
      setIterationCount(0);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('brief');
    } finally {
      setBusy(false);
    }
  }

  async function handleRevise() {
    if (!code || !reviseInstruction.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/games/draft/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          instruction: reviseInstruction.trim(),
          gameTitle: brief.gameTitle,
          creatorEmail: brief.creatorEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not make that change.');
      setCode(data.code);
      setDraftVersion(v => v + 1);
      setIterationCount(n => n + 1);
      setReviseInstruction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitFinal() {
    if (!code) return;
    setBusy(true);
    setError(null);
    setStep('submitting');
    try {
      const res = await fetch('/api/games/draft/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...brief, code, iterationCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('preview');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'success' && result) {
    return (
      <SuccessScreen
        submissionId={result.submissionId}
        onCreateAnother={() => {
          setBrief(prev => ({ ...EMPTY_BRIEF, creatorEmail: prev.creatorEmail }));
          setCode(null);
          setIterationCount(0);
          setResult(null);
          setStep('about');
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">{error}</div>
      )}

      {step === 'about' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep('brief');
          }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-6 border border-sky-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Own Game 🎮</h2>
            <p className="text-sm text-slate-600">
              You&apos;ll describe your idea, we&apos;ll build a first draft with AI, you&apos;ll play it and
              tell us what to change — just like real game developers do.
            </p>
          </div>
          <div>
            <label htmlFor="creatorName" className="mb-2 block text-sm font-medium text-slate-700">Your Name</label>
            <input
              type="text" id="creatorName" required maxLength={30}
              value={brief.creatorName}
              onChange={(e) => setBrief({ ...brief, creatorName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., Alex"
            />
          </div>
          <div>
            <label htmlFor="creatorEmail" className="mb-2 block text-sm font-medium text-slate-700">Parent&apos;s Email</label>
            <input
              type="email" id="creatorEmail" required
              value={brief.creatorEmail}
              onChange={(e) => setBrief({ ...brief, creatorEmail: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="parent@email.com"
            />
            <p className="mt-1 text-xs text-slate-500">We&apos;ll email updates about your game here</p>
          </div>
          <Button type="submit" className="w-full bg-sky-500 py-6 text-lg font-semibold hover:bg-sky-600">
            Next: Describe Your Game →
          </Button>
        </form>
      )}

      {(step === 'brief' || step === 'building') && (
        <form onSubmit={handleBuildDraft} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Your Game Idea</h3>
            <div>
              <label htmlFor="gameTitle" className="mb-2 block text-sm font-medium text-slate-700">Game Title</label>
              <input
                type="text" id="gameTitle" required maxLength={30}
                value={brief.gameTitle}
                onChange={(e) => setBrief({ ...brief, gameTitle: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g., Space Pizza Rescue"
              />
            </div>
            <div>
              <label htmlFor="gameDescription" className="mb-2 block text-sm font-medium text-slate-700">What&apos;s your game about?</label>
              <textarea
                id="gameDescription" required maxLength={300} rows={3}
                value={brief.gameDescription}
                onChange={(e) => setBrief({ ...brief, gameDescription: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Describe what happens in your game..."
              />
              <p className="mt-1 text-xs text-slate-500">{brief.gameDescription.length}/300 characters</p>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-amber-50/70 p-6 ring-1 ring-amber-200">
            <h3 className="text-lg font-semibold text-slate-900">The Two Things That Make a Game Good</h3>
            <p className="text-sm text-slate-600">
              Every great game needs one more thing to do besides moving, and one thing that makes
              it different from every other game like it. Write these in your own words — the AI
              will build exactly what you describe.
            </p>
            <div>
              <label htmlFor="secondVerb" className="mb-2 block text-sm font-medium text-slate-700">
                Besides moving, what&apos;s ONE more thing you can do?
              </label>
              <textarea
                id="secondVerb" required minLength={3} maxLength={200} rows={2}
                value={brief.secondVerb}
                onChange={(e) => setBrief({ ...brief, secondVerb: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder={SECOND_VERB_EXAMPLES[0]}
              />
              <p className="mt-1 text-xs text-slate-500">Examples: {SECOND_VERB_EXAMPLES.slice(1).join(' — ')}</p>
            </div>
            <div>
              <label htmlFor="twist" className="mb-2 block text-sm font-medium text-slate-700">
                What makes your game special or different?
              </label>
              <textarea
                id="twist" required minLength={3} maxLength={200} rows={2}
                value={brief.twist}
                onChange={(e) => setBrief({ ...brief, twist: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder={TWIST_EXAMPLES[0]}
              />
              <p className="mt-1 text-xs text-slate-500">Examples: {TWIST_EXAMPLES.slice(1).join(' — ')}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Visual Style & Basics</h3>
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">Game Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['space', 'runner', 'puzzle', 'racing', 'shooter', 'flying', 'collecting', 'fighting', 'strategy'] as GameType[]).map(type => (
                  <button
                    key={type} type="button"
                    onClick={() => setBrief({ ...brief, gameType: type })}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                      brief.gameType === type
                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                        : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Colors</label>
                <select
                  value={brief.colors}
                  onChange={(e) => setBrief({ ...brief, colors: e.target.value as Colors })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="colorful">Colorful</option>
                  <option value="dark-neon">Dark Neon</option>
                  <option value="bright">Bright</option>
                  <option value="retro">Retro</option>
                </select>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Art Style</label>
                <select
                  value={brief.artStyle}
                  onChange={(e) => setBrief({ ...brief, artStyle: e.target.value as ArtStyle })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="geometric">Geometric</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="pixel">Pixel</option>
                  <option value="fancy">Fancy</option>
                </select>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Background</label>
                <select
                  value={brief.background}
                  onChange={(e) => setBrief({ ...brief, background: e.target.value as Background })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="space">Space</option>
                  <option value="city">City</option>
                  <option value="forest">Forest</option>
                  <option value="ocean">Ocean</option>
                  <option value="sky">Sky</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Difficulty Level</span><span className="text-sky-600">{brief.difficulty}/5</span>
              </label>
              <input type="range" min="1" max="5" value={brief.difficulty}
                onChange={(e) => setBrief({ ...brief, difficulty: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Game Speed</span><span className="text-sky-600">{brief.speed}/5</span>
              </label>
              <input type="range" min="1" max="5" value={brief.speed}
                onChange={(e) => setBrief({ ...brief, speed: parseInt(e.target.value) })} className="w-full" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Lives</label>
                <select
                  value={brief.lives}
                  onChange={(e) => setBrief({ ...brief, lives: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="1">1 Life (Hard Mode)</option>
                  <option value="3">3 Lives</option>
                  <option value="5">5 Lives</option>
                  <option value="999">Infinite Lives</option>
                </select>
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">Movement</label>
                <select
                  value={brief.movement}
                  onChange={(e) => setBrief({ ...brief, movement: e.target.value as Movement })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="left-right">Left & Right</option>
                  <option value="four-way">Four Directions</option>
                  <option value="mouse">Mouse/Touch</option>
                  <option value="auto-move">Auto Move</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">Primary Action (your main button)</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['none', 'shoot', 'jump', 'powerup'] as SpecialAction[]).map(action => (
                  <button
                    key={action} type="button"
                    onClick={() => setBrief({ ...brief, specialAction: action })}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                      brief.specialAction === action
                        ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                        : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200 pt-8">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-slate-900">⚙️ Advanced Options</h3>
              <span className="text-2xl text-slate-400">{showAdvanced ? '−' : '+'}</span>
            </button>
            <p className="text-sm text-slate-500 mt-2">Optional: pick specific collectibles, hazards, and features.</p>
          </div>

          {showAdvanced && (
            <section className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              {(['collectibles', 'hazards', 'features'] as const).map(field => {
                const cap = field === 'features' ? 3 : 4;
                return (
                  <div key={field}>
                    <label className="mb-3 block text-sm font-medium text-slate-700 capitalize">
                      {field} (select up to {cap}) - {brief[field].length}/{cap}
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {PRESET_OPTIONS[field].map(item => (
                        <button
                          key={item} type="button"
                          onClick={() => toggleArrayItem(field, item)}
                          disabled={brief[field].length >= cap && !brief[field].includes(item)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            brief[field].includes(item)
                              ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                              : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <Button type="submit" disabled={busy} className="w-full bg-sky-500 py-6 text-lg font-semibold hover:bg-sky-600">
            {step === 'building' ? 'Building Your First Draft...' : 'Build My First Draft 🔨'}
          </Button>
        </form>
      )}

      {(step === 'preview' || step === 'submitting') && code && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
            <strong>Play your draft below.</strong> Then tell us one thing to change — most great
            games take a few tries to get right.
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 shadow-lg">
            <iframe
              key={draftVersion}
              srcDoc={code}
              sandbox="allow-scripts"
              title={brief.gameTitle || 'Your game draft'}
              className="h-[500px] w-full bg-black"
            />
          </div>

          <div className="rounded-2xl bg-white/80 p-6 shadow ring-1 ring-slate-100 space-y-4">
            <label htmlFor="reviseInstruction" className="block text-sm font-medium text-slate-700">
              What would you change? (You&apos;ve tried this draft {iterationCount + 1} time{iterationCount === 0 ? '' : 's'})
            </label>
            <textarea
              id="reviseInstruction" rows={2} maxLength={300}
              value={reviseInstruction}
              onChange={(e) => setReviseInstruction(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="e.g., The boss appears too late — bring it in sooner. Or: add a jump."
            />
            <Button
              type="button" disabled={busy || !reviseInstruction.trim()}
              onClick={handleRevise}
              className="w-full bg-amber-500 py-5 font-semibold hover:bg-amber-600"
            >
              {busy ? 'Updating Your Game...' : 'Update My Game 🔧'}
            </Button>
          </div>

          {iterationCount < 2 && (
            <div className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800 ring-1 ring-sky-200">
              You can submit whenever you&apos;re happy with it — but most great games take at least
              a couple of tries. Want to change one more thing first?
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button" variant="outline" disabled={busy}
              onClick={() => { setStep('brief'); }}
              className="sm:flex-1"
            >
              ← Start Over
            </Button>
            <Button
              type="button" disabled={busy}
              onClick={handleSubmitFinal}
              className="bg-sky-500 py-6 text-lg font-semibold hover:bg-sky-600 sm:flex-[2]"
            >
              {step === 'submitting' ? 'Sending for Review...' : 'Submit for Review 🚀'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Real-time status polling component (unchanged from the previous flow —
// once submitted, review/approve/deploy works exactly as before).
interface SuccessScreenProps {
  submissionId: string;
  onCreateAnother: () => void;
}

function SuccessScreen({ submissionId, onCreateAnother }: SuccessScreenProps) {
  const [status, setStatus] = useState<string>('review');
  const [progress, setProgress] = useState<number>(95);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const getProgressMessage = (currentStatus: string): { title: string; message: string } => {
    switch (currentStatus) {
      case 'review':
        return { title: 'Under Review 👀', message: 'You already played it — now our team checks it\'s safe to publish' };
      case 'approved':
      case 'live':
        return { title: 'Ready! 🎮', message: 'Your game is ready to play' };
      case 'rejected':
        return { title: 'Needs Another Look ❌', message: 'Please try again or ask a parent to email us' };
      default:
        return { title: 'Processing...', message: 'Your game is on its way' };
    }
  };

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/games/status/${submissionId}`);
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setStatus(data.status);
        setProgress(data.progress);
        if (data.status === 'approved' || data.status === 'live') {
          setIsComplete(true);
          setError(null);
        } else if (data.status === 'rejected') {
          setIsComplete(true);
          setError('This one needs another look. Please try again or ask a parent to email us.');
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    };

    pollInterval = setInterval(pollStatus, 5000);
    pollStatus();
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [submissionId]);

  const progressMsg = getProgressMessage(status);

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl p-6 ring-1 ${
        status === 'rejected' ? 'bg-red-50 ring-red-200' : isComplete ? 'bg-green-50 ring-green-200' : 'bg-blue-50 ring-blue-200'
      }`}>
        <h3 className={`mb-2 text-lg font-semibold ${
          status === 'rejected' ? 'text-red-900' : isComplete ? 'text-green-900' : 'text-blue-900'
        }`}>
          {progressMsg.title}
        </h3>
        <p className={`mb-4 text-sm ${
          status === 'rejected' ? 'text-red-800' : isComplete ? 'text-green-800' : 'text-blue-800'
        }`}>
          {progressMsg.message}
        </p>

        {!isComplete && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Progress</span>
              <span className="text-xs text-slate-500">{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">Submission ID</p>
            <code className="block rounded bg-slate-100 px-2 py-1 text-xs font-mono text-slate-900">{submissionId}</code>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <Button onClick={onCreateAnother} disabled={!isComplete} className="w-full" variant={isComplete ? 'default' : 'outline'}>
        {isComplete ? 'Create Another Game' : 'Reviewing...'}
      </Button>
    </div>
  );
}
