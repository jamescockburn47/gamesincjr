'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, Sparkles } from 'lucide-react';

const CHARACTERS = [
    { id: 'luna', name: 'Luna (Owl)', emoji: '🦉' },
    { id: 'shadow', name: 'Shadow (Cat)', emoji: '🐱' },
    { id: 'oak', name: 'Oak (Deer)', emoji: '🦌' },
    { id: 'spark', name: 'Spark (Hummingbird)', emoji: '🐦' },
    { id: 'coral', name: 'Coral (Dolphin)', emoji: '🐬' },
    { id: 'ember', name: 'Ember (Fox)', emoji: '🦊' },
];

export default function AdminConsolePage() {
    const [prompts, setPrompts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            fetch('/api/admin/prompts')
                .then((res) => res.json())
                .then((data) => {
                    setPrompts(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Failed to load prompts', err);
                    setLoading(false);
                });
        }
    }, [isAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                setAuthError('Invalid password');
            }
        } catch {
            setAuthError('Login failed');
        }
    };

    const handleSave = async (id: string) => {
        setSaving(id);
        try {
            const res = await fetch('/api/admin/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: id, prompt: prompts[id] }),
            });
            if (!res.ok) throw new Error('Failed to save');
            // Show success feedback
            setTimeout(() => setSaving(null), 1000);
        } catch (error) {
            console.error('Failed to save prompt', error);
            alert('Failed to save prompt');
            setSaving(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-20 px-4">
                <div className="container mx-auto max-w-md">
                    <Card className="shadow-2xl border-0">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg">
                                <Settings className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-black">Admin Console</CardTitle>
                            <p className="text-slate-600 mt-2">Manage Magic AI Friends</p>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                        placeholder="Enter admin password"
                                    />
                                </div>

                                {authError && (
                                    <div className="text-red-600 text-sm font-medium text-center bg-red-50 py-2 px-4 rounded-lg">
                                        {authError}
                                    </div>
                                )}

                                <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl">
                                    Sign In
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-20 px-4">
                <div className="container mx-auto max-w-6xl text-center">
                    <div className="text-xl font-bold text-slate-600">Loading prompts...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-20 px-4">
            <div className="container mx-auto max-w-6xl">
                <header className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg">
                            <Settings className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900">Admin Console</h1>
                    </div>
                    <p className="text-lg text-slate-600 font-medium">Manage Magic AI Friends Character Prompts</p>
                </header>

                <div className="grid gap-8">
                    {CHARACTERS.map((char) => (
                        <Card key={char.id} className="shadow-xl border-0 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b-2 border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{char.emoji}</span>
                                        <CardTitle className="text-2xl font-black">{char.name}</CardTitle>
                                    </div>
                                    <Button
                                        onClick={() => handleSave(char.id)}
                                        disabled={saving === char.id}
                                        className="h-12 px-6 rounded-xl font-bold"
                                    >
                                        {saving === char.id ? (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Prompt'
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <textarea
                                    className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    value={prompts[char.id] || ''}
                                    onChange={(e) => setPrompts({ ...prompts, [char.id]: e.target.value })}
                                    placeholder={`Enter system prompt for ${char.name}...`}
                                />
                                <p className="text-xs text-slate-500 mt-3 font-medium">
                                    This prompt defines the character&apos;s personality, voice, and safety guidelines.
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    );
}
