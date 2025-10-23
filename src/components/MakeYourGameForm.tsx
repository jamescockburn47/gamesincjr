'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function MakeYourGameForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ submissionId: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    creatorName: string;
    creatorEmail: string;
    gameTitle: string;
    gameDescription: string;
    gameType: 'space' | 'runner' | 'puzzle' | 'racing' | 'shooter' | 'flying' | 'collecting' | 'fighting' | 'strategy';
    difficulty: number;
    speed: number;
    lives: number;
    colors: 'colorful' | 'dark-neon' | 'bright' | 'retro';
    artStyle: 'geometric' | 'cartoon' | 'pixel' | 'fancy';
    background: 'space' | 'city' | 'forest' | 'ocean' | 'sky';
    movement: 'left-right' | 'four-way' | 'mouse' | 'auto-move';
    specialAction: 'none' | 'shoot' | 'jump' | 'powerup';
    collectibles: string[];
    hazards: string[];
    features: string[];
  }>({
    creatorName: '',
    creatorEmail: '',
    gameTitle: '',
    gameDescription: '',
    gameType: 'space',
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
  });

  const presetOptions = {
    collectibles: ['coins', 'stars', 'gems', 'hearts', 'power-ups', 'keys', 'shields', 'magnets'],
    hazards: ['enemies', 'asteroids', 'spikes', 'lava', 'lasers', 'bombs', 'black holes', 'obstacles'],
    features: ['combo system', 'power-ups', 'checkpoints', 'boss battles', 'time attack', 'infinite mode', 'leaderboards', 'achievements']
  };

  const toggleArrayItem = (field: 'collectibles' | 'hazards' | 'features', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/games/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-green-50 p-6 ring-1 ring-green-200">
          <h3 className="mb-2 text-lg font-semibold text-green-900">Game Submitted Successfully! 🎮</h3>
          <p className="mb-4 text-sm text-green-800">
            Your game is being generated. This usually takes 3-5 minutes.
          </p>
          <div className="rounded-xl bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Submission ID:</p>
            <code className="block rounded bg-slate-100 px-3 py-2 text-sm font-mono text-slate-900">
              {result.submissionId}
            </code>
          </div>
        </div>
        <Button onClick={() => { setResult(null); setFormData(prev => ({ ...prev, creatorEmail: prev.creatorEmail })); }}>
          Create Another Game
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Step 1: Creator Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Step 1: About You</h3>

        <div>
          <label htmlFor="creatorName" className="mb-2 block text-sm font-medium text-slate-700">Your Name</label>
          <input
            type="text"
            id="creatorName"
            value={formData.creatorName}
            onChange={(e) => setFormData({...formData, creatorName: e.target.value})}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
            maxLength={30}
            placeholder="e.g., Alex"
          />
        </div>

        <div>
          <label htmlFor="creatorEmail" className="mb-2 block text-sm font-medium text-slate-700">Parent&apos;s Email</label>
          <input
            type="email"
            id="creatorEmail"
            value={formData.creatorEmail}
            onChange={(e) => setFormData({...formData, creatorEmail: e.target.value})}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
            placeholder="parent@email.com"
          />
          <p className="mt-1 text-xs text-slate-500">We&apos;ll email updates about your game here</p>
        </div>
      </section>

      {/* Step 2: Game Identity */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Step 2: Name Your Game</h3>

        <div>
          <label htmlFor="gameTitle" className="mb-2 block text-sm font-medium text-slate-700">Game Title</label>
          <input
            type="text"
            id="gameTitle"
            value={formData.gameTitle}
            onChange={(e) => setFormData({...formData, gameTitle: e.target.value})}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
            maxLength={30}
            placeholder="e.g., Space Pizza Rescue"
          />
        </div>

        <div>
          <label htmlFor="gameDescription" className="mb-2 block text-sm font-medium text-slate-700">Game Description</label>
          <textarea
            id="gameDescription"
            value={formData.gameDescription}
            onChange={(e) => setFormData({...formData, gameDescription: e.target.value})}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            required
            maxLength={300}
            rows={3}
            placeholder="Describe what your game is about..."
          />
          <p className="mt-1 text-xs text-slate-500">{formData.gameDescription.length}/300 characters</p>
        </div>
      </section>

      {/* Step 3: Game Type & Style */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Step 3: Choose Game Type</h3>

        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">Game Type</label>
          <div className="grid grid-cols-3 gap-3">
            {(['space', 'runner', 'puzzle', 'racing', 'shooter', 'flying', 'collecting', 'fighting', 'strategy'] as Array<typeof formData.gameType>).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({...formData, gameType: type})}
                className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                  formData.gameType === type
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
              value={formData.colors}
              onChange={(e) => setFormData({...formData, colors: e.target.value as typeof formData.colors})}
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
              value={formData.artStyle}
              onChange={(e) => setFormData({...formData, artStyle: e.target.value as typeof formData.artStyle})}
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
              value={formData.background}
              onChange={(e) => setFormData({...formData, background: e.target.value as typeof formData.background})}
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
      </section>

      {/* Step 4: Difficulty & Controls */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Step 4: Difficulty & Controls</h3>

        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Difficulty Level</span>
            <span className="text-sky-600">{formData.difficulty}/5</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: parseInt(e.target.value)})}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Easy</span>
            <span>Hard</span>
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Game Speed</span>
            <span className="text-sky-600">{formData.speed}/5</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={formData.speed}
            onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value)})}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Lives</label>
            <select
              value={formData.lives}
              onChange={(e) => setFormData({...formData, lives: parseInt(e.target.value)})}
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
              value={formData.movement}
              onChange={(e) => setFormData({...formData, movement: e.target.value as typeof formData.movement})}
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
          <label className="mb-3 block text-sm font-medium text-slate-700">Special Action</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['none', 'shoot', 'jump', 'powerup'] as const).map(action => (
              <button
                key={action}
                type="button"
                onClick={() => setFormData({...formData, specialAction: action})}
                className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                  formData.specialAction === action
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

      {/* Step 5: Game Elements */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-900">Step 5: Game Elements</h3>

        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Collectibles (select up to 4) - {formData.collectibles.length}/4
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presetOptions.collectibles.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleArrayItem('collectibles', item)}
                disabled={formData.collectibles.length >= 4 && !formData.collectibles.includes(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  formData.collectibles.includes(item)
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                    : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Hazards (select up to 4) - {formData.hazards.length}/4
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presetOptions.hazards.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleArrayItem('hazards', item)}
                disabled={formData.hazards.length >= 4 && !formData.hazards.includes(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  formData.hazards.includes(item)
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                    : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-slate-700">
            Features (select up to 3) - {formData.features.length}/3
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {presetOptions.features.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => toggleArrayItem('features', item)}
                disabled={formData.features.length >= 3 && !formData.features.includes(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  formData.features.includes(item)
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                    : 'border-slate-300 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-sky-500 py-6 text-lg font-semibold hover:bg-sky-600"
      >
        {submitting ? 'Creating Your Game...' : 'Generate My Game 🎮'}
      </Button>
    </form>
  );
}
