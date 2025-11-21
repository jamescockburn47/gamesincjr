'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const CHARACTERS = [
    { id: 'luna', name: 'Luna (Owl)' },
    { id: 'shadow', name: 'Shadow (Cat)' },
    { id: 'oak', name: 'Oak (Deer)' },
    { id: 'spark', name: 'Spark (Hummingbird)' },
    { id: 'coral', name: 'Coral (Dolphin)' },
    { id: 'ember', name: 'Ember (Fox)' },
];

export default function MagicFriendsTab() {
    const [prompts, setPrompts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
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
    }, []);

    const handleSave = async (id: string) => {
        setSaving(id);
        try {
            const res = await fetch('/api/admin/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId: id, prompt: prompts[id] }),
            });
            if (!res.ok) throw new Error('Failed to save');
            // Optional: Show success toast
        } catch (error) {
            console.error('Failed to save prompt', error);
            alert('Failed to save prompt');
        } finally {
            setSaving(null);
        }
    };

    if (loading) return <div>Loading prompts...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Magic Friends Character Prompts</h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {CHARACTERS.map((char) => (
                    <div key={char.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">{char.name}</h3>
                            <Button
                                onClick={() => handleSave(char.id)}
                                disabled={saving === char.id}
                                size="sm"
                            >
                                {saving === char.id ? 'Saving...' : 'Save Prompt'}
                            </Button>
                        </div>
                        <textarea
                            className="w-full h-48 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={prompts[char.id] || ''}
                            onChange={(e) => setPrompts({ ...prompts, [char.id]: e.target.value })}
                            placeholder={`Enter system prompt for ${char.name}...`}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This prompt defines the character&apos;s personality, voice, and safety guidelines.
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
