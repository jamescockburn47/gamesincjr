'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { baseCharacters, conversationTopics } from './data';
import type {
  Character,
  CharacterIntroResponse,
  ConversationMessage,
  FriendSentiment,
  GameStatus,
  SessionInfo,
  Topic,
} from './types';
import CharacterCard from './components/CharacterCard';
import ConversationPanel from './components/ConversationPanel';
import CharacterCreator from './components/CharacterCreator';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGINARY_FRIENDS_API_BASE ?? '/api/imaginary-friends';

const STORAGE_KEYS = {
  selectedCharacter: 'if_selectedCharacterId',
  messages: 'if_messages',
  customCharacters: 'if_customCharacters',
  lastCreatedAt: 'if_lastCustomCreatedAt',
  lastAvatarRefreshAt: 'if_lastAvatarRefreshAt',
};

type Sentiment = 'happy' | 'sad' | 'excited' | 'thoughtful' | 'curious';

type StreamEvent =
  | { type: 'start'; sessionInfo?: SessionInfo }
  | { type: 'delta'; text: string }
  | { type: 'final'; response: string; imageUrl?: string | null; gameStatus?: GameStatus; sessionInfo?: SessionInfo }
  | { type: 'error'; error: string };

function analyseSentiment(text: string): Sentiment {
  const value = text.toLowerCase();
  if (/amazing|wonderful|awesome|excited|yay|fantastic|incredible/.test(value)) return 'excited';
  if (/happy|joy|smile|laugh|fun|great|good|nice|love/.test(value)) return 'happy';
  if (/sad|sorry|upset|disappointed|worried|trouble|difficult/.test(value)) return 'sad';
  if (/what|how|why|tell me|explain|curious|wonder|interesting/.test(value)) return 'curious';
  return 'thoughtful';
}

function mapFriendSentimentToMood(sentiment: FriendSentiment): Sentiment {
  switch (sentiment) {
    case 'joyful':
      return 'happy';
    case 'curious':
      return 'curious';
    case 'resilient':
      return 'excited';
    case 'encouraging':
      return 'happy';
    case 'thoughtful':
    default:
      return 'thoughtful';
  }
}

function canCreateThisWeek(lastCreated: number | null): boolean {
  if (!lastCreated) return true;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - lastCreated >= oneWeekMs;
}

function blockedMessage(lastCreated: number | null): string | undefined {
  if (!lastCreated) return undefined;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, oneWeekMs - (Date.now() - lastCreated));
  if (remaining <= 0) return undefined;
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return `You can create a new friend in ${days}d ${hours}h.`;
}

export default function ImaginaryFriendsApp() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesRef = useRef<ConversationMessage[]>([]);
const [characters, setCharacters] = useState<Character[]>(baseCharacters);
const [isLoading, setIsLoading] = useState(false);
const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
const [showImageButton, setShowImageButton] = useState(false);
const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
const [showCreator, setShowCreator] = useState(false);
  const [lastApi, setLastApi] = useState<{ req?: unknown; res?: unknown; error?: string } | null>(null);
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null);
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const imagesAvailable = (info: SessionInfo | null | undefined) => {
    if (!info) return 0;
    const allowance = info.imageAllowanceRemaining ?? info.imagesRemaining;
    return Math.max(0, Math.min(info.imagesRemaining, allowance));
  };

  const pushSystemMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        speaker: 'character',
        text: message,
        timestamp: new Date(),
      },
    ]);
  };

  const createFallbackGameStatus = useCallback(
    (character: Character): GameStatus => ({
      friendshipLevel: 1,
      experience: 0,
      nextLevelThreshold: 160,
      stardustEarned: 0,
      badgesUnlocked: [],
      sentiment: 'curious',
      keywords: [],
      suggestedActivity: `Ask ${character.name} about ${character.favoriteTopics?.[0] ?? 'a new adventure'}.`,
      summary: `${character.name} is excited to imagine with you.`,
      creativityScore: 10,
    }),
    [],
  );


  const topics = useMemo(() => conversationTopics, []);

  const updateCharacterMood = useCallback((characterId: string, mood: Sentiment) => {
    setCharacters((prev) =>
      prev.map((character) => (character.id === characterId ? { ...character, currentMood: mood } : character)),
    );
  }, []);

  const loadSessionStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/session`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as SessionInfo;
      setSessionInfo(data);
      setShowImageButton(imagesAvailable(data) > 0);
    } catch (error) {
      console.warn('Failed to load session info', error);
    }
  }, []);

  useEffect(() => {
    loadSessionStatus();
  }, [loadSessionStatus]);

  useEffect(() => {
    setShowImageButton(imagesAvailable(sessionInfo) > 0);
  }, [sessionInfo]);

  useEffect(() => {
    try {
      const savedCharId = localStorage.getItem(STORAGE_KEYS.selectedCharacter);
      const savedMessagesRaw = sessionStorage.getItem(STORAGE_KEYS.messages);
      const savedCustomRaw = localStorage.getItem(STORAGE_KEYS.customCharacters);
      const savedCreatedAt = localStorage.getItem(STORAGE_KEYS.lastCreatedAt);

      if (savedCustomRaw) {
        try {
          const parsed = JSON.parse(savedCustomRaw) as Character[];
          if (Array.isArray(parsed) && parsed.length) {
            setCharacters((prev) => {
              const map = new Map(prev.map((c) => [c.id, c]));
              parsed.forEach((character) => map.set(character.id, character));
              return Array.from(map.values());
            });
          }
        } catch {
          // ignore bad data
        }
      }

      if (savedCharId) {
        const found = characters.find((character) => character.id === savedCharId);
        if (found) {
          setSelectedCharacter(found);
          setGameStatus(createFallbackGameStatus(found));
        }
      }

      if (savedMessagesRaw) {
        try {
          const parsed = JSON.parse(savedMessagesRaw) as Array<{
            id: string;
            speaker: 'player' | 'character';
            text: string;
            timestamp: string;
            imageUrl?: string | null;
          }>;
          const restored = parsed.map<ConversationMessage>((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          }));
          if (restored.length) setMessages(restored);
        } catch {
          // ignore invalid session data
        }
      }

      if (savedCreatedAt) {
        setLastCreatedAt(Number(savedCreatedAt));
      }
    } catch {
      // ignore storage issues
    }
  }, [characters, createFallbackGameStatus]);

  // Optional: autostart via query (?autostart=luna)
  useEffect(() => {
    if (selectedCharacter) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const autostartId = params.get('autostart');
      if (autostartId) {
        const found = characters.find((c) => c.id === autostartId) ?? characters[0];
        if (found) {
          setSelectedCharacter(found);
          setGameStatus(createFallbackGameStatus(found));
        }
      }
    } catch {
      // ignore
    }
  }, [selectedCharacter, characters, createFallbackGameStatus]);

  useEffect(() => {
    if (!avatarsLoaded) {
      const loadAvatars = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/avatars`, { cache: 'no-store' });
          if (!response.ok) return;
          const data = (await response.json()) as { avatars?: Record<string, string> };
          if (data?.avatars) {
            setCharacters((prev) =>
              prev.map((character) =>
                data.avatars?.[character.id]
                  ? { ...character, avatarUrl: data.avatars[character.id] }
                  : character,
              ),
            );
            setAvatarsLoaded(true);
          } else {
            const lastRefresh = Number(localStorage.getItem(STORAGE_KEYS.lastAvatarRefreshAt) ?? 0);
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            if (!lastRefresh || Date.now() - lastRefresh >= oneWeekMs) {
              const refresh = await fetch(`${API_BASE_URL}/avatars/refresh`, { method: 'POST' });
              if (refresh.ok) {
                const refreshData = (await refresh.json()) as { avatars?: Record<string, string> };
                if (refreshData?.avatars) {
                  setCharacters((prev) =>
                    prev.map((character) =>
                      refreshData.avatars?.[character.id]
                        ? { ...character, avatarUrl: refreshData.avatars[character.id] }
                        : character,
                    ),
                  );
                  localStorage.setItem(STORAGE_KEYS.lastAvatarRefreshAt, String(Date.now()));
                  setAvatarsLoaded(true);
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load avatars', error);
        }
      };
      loadAvatars();
    }
  }, [avatarsLoaded]);

  const initialiseConversation = useCallback(
    async (characterId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/character-intro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        });
        if (!response.ok) throw new Error('Failed to fetch introduction');
        const data = (await response.json()) as CharacterIntroResponse;
        // Only seed intro if no messages have arrived in the meantime
        if (messagesRef.current.length === 0) {
          setMessages([
            {
              id: String(Date.now()),
              speaker: 'character',
              text: data.introduction,
              timestamp: new Date(),
              imageUrl: data.imageUrl ?? null,
            },
          ]);
        }
        updateCharacterMood(characterId, 'happy');
        const character = characters.find((entry) => entry.id === characterId);
        if (character) {
          setGameStatus(data.gameStatus ?? createFallbackGameStatus(character));
        } else {
          setGameStatus(null);
        }
      } catch (error) {
        console.warn('Failed to initialise conversation', error);
        setMessages([
          {
            id: String(Date.now()),
            speaker: 'character',
            text: 'Hello there! How are you today?',
            timestamp: new Date(),
          },
        ]);
        const character = characters.find((entry) => entry.id === characterId);
        if (character) {
          setGameStatus(createFallbackGameStatus(character));
        } else {
          setGameStatus(null);
        }
      }
    },
    [characters, createFallbackGameStatus, updateCharacterMood],
  );

useEffect(() => {
    if (selectedCharacter) {
      localStorage.setItem(STORAGE_KEYS.selectedCharacter, selectedCharacter.id);
      if (!messages.length) {
        void initialiseConversation(selectedCharacter.id);
      }
    }
  }, [selectedCharacter, messages.length, initialiseConversation]);

  useEffect(() => {
    try {
      const serialised = JSON.stringify(
        messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
      );
      sessionStorage.setItem(STORAGE_KEYS.messages, serialised);
    } catch {
      // ignore storage issues
    }
  }, [messages]);

  
  const handleSendMessage = useCallback(
    async (messageText: string, requestImage = false) => {
      if (!selectedCharacter) return;

      if (sessionInfo && sessionInfo.remainingTime <= 0) {
        pushSystemMessage("I've had a wonderful time today, but I need to rest. Let's talk again tomorrow!");
        return;
      }

      if (sessionInfo?.messageAllowanceRemaining !== undefined && sessionInfo.messageAllowanceRemaining <= 0) {
        pushSystemMessage("I've loved chatting today! Let's continue tomorrow once my rest is done.");
        return;
      }

      if (requestImage && imagesAvailable(sessionInfo) <= 0) {
        pushSystemMessage("I've already made as many pictures as I can today. Let's draw again later!");
        return;
      }

      if (sessionInfo?.budgetCentsRemaining !== undefined && sessionInfo.budgetCentsRemaining <= 0) {
        pushSystemMessage("My grown-up helpers say we've reached today's AI budget. We'll unlock more playtime tomorrow!");
        return;
      }

      const history = requestImage && !messageText.trim()
        ? messages
        : [
            ...messages,
            ...(messageText.trim()
              ? [
                  {
                    id: String(Date.now()),
                    speaker: 'player' as const,
                    text: messageText,
                    timestamp: new Date(),
                  },
                ]
              : []),
          ];

      if (messageText.trim()) {
        updateCharacterMood(selectedCharacter.id, analyseSentiment(messageText));
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            speaker: 'player',
            text: messageText,
            timestamp: new Date(),
          },
        ]);
      } else if (requestImage) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            speaker: 'character',
            text: '🎨 Creating a magical image for you...',
            timestamp: new Date(),
          },
        ]);
      }

      setIsLoading(true);

      try {
        const payload = {
          characterId: selectedCharacter.id,
          message: messageText,
          requestImage,
          conversationHistory: history.map((entry) => ({
            speaker: entry.speaker,
            text: entry.text,
          })),
          userId: 'default',
        };
        const response = await fetch(API_BASE_URL + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ ...payload, stream: true }),
        });
        if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
          const err = await response.json();
          throw new Error('Chat request failed: ' + (err?.error || response.status));
        }

        // Start reading NDJSON stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Seed an optimistic typing bubble
        setMessages((prev) => {
          const typing: ConversationMessage = {
            id: 'typing-' + Date.now(),
            speaker: 'character',
            text: '…',
            timestamp: new Date(),
          };
          messagesRef.current = [...prev, typing];
          return messagesRef.current;
        });

        if (reader) {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            // Process complete lines
            while ((idx = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 1);
              if (!line.trim()) continue;
              try {
                const evt = JSON.parse(line) as StreamEvent;
                if (evt.type === 'start' && evt.sessionInfo) {
                  setSessionInfo(evt.sessionInfo);
                } else if (evt.type === 'delta') {
                  // Append token to typing message
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.id.startsWith('typing-')) {
                      last.text = (last.text || '') + evt.text;
                    }
                    messagesRef.current = next;
                    return next;
                  });
                } else if (evt.type === 'final') {
                  // Replace typing with final message
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.id.startsWith('typing-')) {
                      last.text = evt.response || last.text;
                      last.timestamp = new Date();
                    }
                    messagesRef.current = next;
                    return next;
                  });
                  if (evt.sessionInfo) setSessionInfo(evt.sessionInfo);
                  if (selectedCharacter) setGameStatus(evt.gameStatus ?? createFallbackGameStatus(selectedCharacter));
                } else if (evt.type === 'error') {
                  throw new Error(evt.error || 'stream error');
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
        // Non-stream fallback block removed in stream path
      } catch (error) {
        console.error('Failed to send message', error);
        updateCharacterMood(selectedCharacter.id, 'thoughtful');
        pushSystemMessage("I'm having trouble connecting right now. Could you try again in a moment?");
        setGameStatus((prev) => (selectedCharacter ? prev ?? createFallbackGameStatus(selectedCharacter) : prev));
        setLastApi((prev) => ({ ...(prev ?? {}), error: String(error) }));
      } finally {
        setIsLoading(false);
      }
    },
    [createFallbackGameStatus, messages, selectedCharacter, sessionInfo, updateCharacterMood],
  );


  const handleTopicSelected = useCallback(
    (topic: Topic) => {
      handleSendMessage(`Let's talk about ${topic.name.toLowerCase()}. ${topic.description}`);
    },
    [handleSendMessage],
  );

  const handleCreateCharacter = useCallback(
    (character: Character) => {
      setCharacters((prev) => [...prev, character]);
      setShowCreator(false);
      setSelectedCharacter(character);
      setGameStatus(createFallbackGameStatus(character));
      const now = Date.now();
      setLastCreatedAt(now);
      try {
        localStorage.setItem(STORAGE_KEYS.customCharacters, JSON.stringify([...characters, character]));
        localStorage.setItem(STORAGE_KEYS.lastCreatedAt, String(now));
      } catch {
        // ignore
      }
    },
    [characters, createFallbackGameStatus],
  );

  const canCreate = canCreateThisWeek(lastCreatedAt);
  const blockedReason = blockedMessage(lastCreatedAt);

  return (
    <div className="if-app">
      <header className="if-hero">
        <h1>✨ Imaginary Friends ✨</h1>
        <p>Chat with magical companions tuned for young storytellers.</p>
      </header>

      <main className="if-main">
        {!selectedCharacter ? (
          <section className="if-selection">
            <header className="if-selection__header">
              <h2>Choose your next conversation</h2>
              <p>Pick a friend or design a new companion (one per week).</p>
            </header>
            <div className="character-grid">
              <button type="button" className="character-card creator-card" onClick={() => setShowCreator(true)}>
                <div className="character-avatar">✨</div>
                <div className="character-info">
                  <h3 className="character-name">Create New Friend</h3>
                  <p className="character-type">Design a custom personality</p>
                </div>
              </button>
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isSelected={false}
                  onClick={() => {
                    setMessages([]);
                    // Seed from server history for context continuity (guard so we don't overwrite live chat)
                    fetch(`${API_BASE_URL}/history?characterId=${character.id}&userId=default`)
                      .then(async (res) => (res.ok ? ((await res.json()) as { turns?: Array<{ speaker: 'player' | 'character'; text: string }> }) : { turns: [] }))
                      .then((data) => {
                        const turns = Array.isArray(data.turns) ? data.turns : [];
                        if (turns.length) {
                          const seeded: ConversationMessage[] = turns.map((t, idx) => ({
                            id: `${Date.now()}-${idx}`,
                            speaker: t.speaker,
                            text: t.text,
                            timestamp: new Date(),
                          }));
                          setMessages((prev) => (prev.length ? prev : seeded));
                        }
                      })
                      .catch(() => undefined);
                    setGameStatus(createFallbackGameStatus(character));
                    setSelectedCharacter(character);
                  }}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="if-conversation">
            <aside className="if-sidebar">
              <button
                type="button"
                className="if-back"
                onClick={() => {
                  setSelectedCharacter(null);
                  setGameStatus(null);
                }}
              >
                Back to friends list
              </button>
              <div className="if-summary">
                <div className="character-avatar large">{selectedCharacter.avatarUrl ?? '🙂'}</div>
                <h3>{selectedCharacter.name}</h3>
                <p>{selectedCharacter.personality}</p>
                <div className="character-mood">
                  Mood:&nbsp;
                  <span className={`character-mood-chip mood-${selectedCharacter.currentMood}`}>
                    {selectedCharacter.currentMood}
                  </span>
                </div>
                <div className="character-relationship">
                  Friendship level
                  <div className="relationship-bar">
                    <div
                      className="relationship-bar__fill"
                      style={{ width: `${Math.max(0, Math.min(100, selectedCharacter.relationshipLevel))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="if-topics-hint">
                <h4>Suggested topics</h4>
                <ul>
                  {topics.slice(0, 4).map((topic) => (
                    <li key={topic.id}>{topic.name}</li>
                  ))}
                </ul>
              </div>
            </aside>
            <ConversationPanel
              key={`conv-${messages.length}`}
              messages={messages}
              character={selectedCharacter}
              topics={topics}
              onSendMessage={handleSendMessage}
              onSelectTopic={handleTopicSelected}
              isLoading={isLoading}
              showImageButton={showImageButton}
              sessionInfo={sessionInfo}
              gameStatus={gameStatus}
            />
          </section>
        )}
      </main>

      <CharacterCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onCreate={handleCreateCharacter}
        canCreate={canCreate}
        blockedReason={blockedReason}
        apiBaseUrl={API_BASE_URL}
      />

      <style jsx global>{`
        .if-app {
          min-height: 100vh;
          background: radial-gradient(circle at top, #f8fbff 0%, #eef2ff 45%, #e0e7ff 100%);
          color: #1f2937;
          padding-bottom: 48px;
        }
        .if-hero {
          text-align: center;
          padding: 48px 16px 24px;
        }
        .if-hero h1 {
          font-size: clamp(2.25rem, 4vw, 3rem);
          font-weight: 700;
          margin-bottom: 8px;
        }
        .if-hero p {
          font-size: 1.05rem;
          color: #4b5563;
        }
        .if-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px 32px;
        }
        .if-selection {
          background: rgba(255, 255, 255, 0.82);
          border-radius: 24px;
          padding: 28px;
          border: 1px solid rgba(147, 197, 253, 0.25);
          box-shadow: 0 20px 40px rgba(148, 163, 209, 0.25);
        }
        .if-selection__header h2 {
          font-size: clamp(1.6rem, 2.5vw, 2.1rem);
          margin-bottom: 8px;
        }
        .if-selection__header p {
          color: #4b5563;
          margin-bottom: 24px;
        }
        .character-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }
        .character-card {
          border: none;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(235, 244, 255, 0.88));
          border-radius: 18px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 18px 28px rgba(148, 163, 209, 0.22);
        }
        .character-card:hover,
        .character-card:focus-visible {
          transform: translateY(-6px);
          box-shadow: 0 24px 44px rgba(118, 169, 250, 0.32);
        }
        .character-card--selected {
          border: 2px solid rgba(59, 130, 246, 0.35);
        }
        .creator-card {
          background: linear-gradient(135deg, rgba(222, 247, 236, 0.9), rgba(219, 234, 254, 0.85));
          border: 2px dashed rgba(56, 189, 248, 0.6);
        }
        .character-avatar {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          background: linear-gradient(140deg, rgba(219, 234, 254, 0.9), rgba(191, 219, 254, 0.8));
        }
        .character-avatar.large {
          width: 88px;
          height: 88px;
          font-size: 2.2rem;
          margin: 0 auto 8px;
        }
        .character-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .character-name {
          font-size: 1.2rem;
          font-weight: 700;
        }
        .character-type {
          color: #4b5563;
          font-size: 0.95rem;
        }
        .character-mood {
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .character-mood-chip {
          border-radius: 999px;
          padding: 2px 10px;
          font-weight: 600;
          text-transform: capitalize;
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }
        .mood-happy { background: rgba(34, 197, 94, 0.15); color: #166534; }
        .mood-sad { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
        .mood-excited { background: rgba(249, 115, 22, 0.15); color: #c2410c; }
        .mood-curious { background: rgba(244, 114, 182, 0.15); color: #a21caf; }
        .mood-thoughtful { background: rgba(129, 140, 248, 0.15); color: #4338ca; }
        .character-relationship {
          font-size: 0.85rem;
          color: #334155;
        }
        .relationship-bar {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.2);
          margin-top: 6px;
          overflow: hidden;
        }
        .relationship-bar__fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #6366f1);
          transition: width 0.4s ease;
        }
        .if-conversation {
          display: grid;
          grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
          gap: 18px;
          margin-top: 24px;
        }
        .if-sidebar {
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(147, 197, 253, 0.25);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 18px 36px rgba(148, 163, 209, 0.25);
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 32px;
          align-self: start;
        }
        .if-back {
          border: none;
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
        }
        .if-summary h3 {
          text-align: center;
          font-size: 1.3rem;
          margin-bottom: 4px;
        }
        .if-summary p {
          text-align: center;
          color: #4b5563;
          font-size: 0.95rem;
        }
        .if-topics-hint h4 {
          font-size: 0.95rem;
          margin-bottom: 8px;
        }
        .if-topics-hint ul {
          margin: 0;
          padding-left: 16px;
          color: #4b5563;
          font-size: 0.9rem;
        }
        .conversation-panel {
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(147, 197, 253, 0.25);
          box-shadow: 0 16px 32px rgba(148, 163, 209, 0.25);
          display: flex;
          flex-direction: column;
          min-height: 60vh;
        }
        .friendship-status {
          padding: 20px 24px 18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(56, 189, 248, 0.12));
          border-bottom: 1px solid rgba(148, 163, 209, 0.25);
          display: grid;
          gap: 8px;
        }
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #1f2937;
        }
        .status-level {
          font-size: 1.05rem;
        }
        .status-xp {
          font-size: 0.85rem;
          color: #475569;
        }
        .status-progress {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 209, 0.3);
          overflow: hidden;
        }
        .status-progress-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(135deg, #22d3ee, #6366f1);
          transition: width 0.4s ease;
        }
        .status-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.85rem;
          color: #475569;
        }
        .status-stardust {
          font-weight: 600;
          color: #1d4ed8;
        }
        .status-badges,
        .status-keywords,
        .status-summary,
        .status-suggestion {
          font-size: 0.85rem;
          color: #475569;
        }
        .status-summary {
          font-weight: 600;
        }
        .status-suggestion {
          color: #1e40af;
          font-weight: 600;
        }
        .messages-container {
          padding: 24px;
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 88%;
        }
        .player-message {
          align-self: flex-end;
          text-align: right;
        }
        .character-message {
          align-self: flex-start;
        }
        .message-content {
          padding: 14px 18px;
          border-radius: 18px;
          line-height: 1.5;
          font-size: 0.96rem;
        }
        .player-message .message-content {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #ffffff;
        }
        .character-message .message-content {
          background: rgba(148, 163, 209, 0.12);
          color: #1f2937;
          border: 1px solid rgba(148, 163, 209, 0.2);
        }
        .message-time {
          font-size: 0.75rem;
          color: rgba(71, 85, 105, 0.7);
        }
        .message-image img {
          max-width: min(380px, 80vw);
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 209, 0.3);
          box-shadow: 0 14px 26px rgba(148, 163, 209, 0.35);
        }
        .typing-message .message-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #475569;
        }
        .typing-dots span {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          margin-right: 4px;
          animation: typing-bounce 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing-bounce {
          0%,
          80%,
          100% {
            transform: scale(0.7);
            opacity: 0.6;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .input-section {
          border-top: 1px solid rgba(148, 163, 209, 0.18);
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(249, 250, 255, 0.92);
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
        }
        .countdown-timer {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(251, 191, 36, 0.12);
          color: #b45309;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.85rem;
          width: fit-content;
        }
        .session-hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #334155;
        }
        .session-hint.budget {
          color: #0f172a;
        }
        .image-generation {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .image-button {
          background: linear-gradient(135deg, #ec4899, #f97316);
          border: none;
          color: #ffffff;
          padding: 9px 18px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 600;
        }
        .image-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .image-count {
          font-size: 0.85rem;
          color: #475569;
        }
        .input-controls {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        .message-input {
          flex: 1;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 209, 0.4);
          padding: 14px 16px;
          min-height: 90px;
          font-size: 0.98rem;
          resize: vertical;
          background: rgba(255, 255, 255, 0.95);
        }
        .input-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .topics-button,
        .send-button {
          border: none;
          border-radius: 14px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .topics-button {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }
        .send-button {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #ffffff;
        }
        .topics-button:hover,
        .send-button:hover {
          transform: translateY(-2px);
        }
        .topics-panel {
          background: rgba(255, 255, 255, 0.96);
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 209, 0.3);
          padding: 16px;
          display: grid;
          gap: 12px;
        }
        .topics-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        }
        .topic-button {
          border: none;
          border-radius: 14px;
          padding: 12px 14px;
          text-align: left;
          background: rgba(148, 163, 209, 0.12);
          cursor: pointer;
        }
        .topic-name {
          font-weight: 600;
          display: block;
          margin-bottom: 4px;
        }
        .topic-description {
          font-size: 0.85rem;
          color: #4b5563;
        }
        .voice-player {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .voice-button {
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          font-size: 1.15rem;
        }
        .voice-button.voice-button--playing {
          background: linear-gradient(135deg, #f97316, #ef4444);
          animation: voice-pulse 2s infinite;
        }
        @keyframes voice-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        .voice-settings-button {
          border: none;
          background: rgba(148, 163, 209, 0.2);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
        }
        .api-key-modal {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: grid;
          place-items: center;
          padding: 16px;
          z-index: 50;
        }
        .api-key-content {
          background: #ffffff;
          border-radius: 18px;
          padding: 24px;
          width: min(420px, 100%);
          display: grid;
          gap: 16px;
        }
        .api-key-section label {
          display: grid;
          gap: 6px;
          font-size: 0.95rem;
        }
        .api-key-section input {
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 209, 0.35);
          padding: 10px 12px;
        }
        .api-key-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .cc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: grid;
          place-items: center;
          padding: 24px;
          z-index: 60;
        }
        .cc-modal {
          background: #ffffff;
          border-radius: 20px;
          padding: 28px;
          width: min(520px, 100%);
          display: grid;
          gap: 16px;
          box-shadow: 0 24px 44px rgba(15, 23, 42, 0.25);
        }
        .cc-form {
          display: grid;
          gap: 16px;
        }
        .cc-label {
          display: grid;
          gap: 8px;
          font-weight: 600;
          color: #1f2937;
        }
        .cc-input,
        .cc-textarea {
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 209, 0.35);
          padding: 12px 14px;
          font-size: 0.95rem;
          width: 100%;
        }
        .cc-textarea {
          min-height: 70px;
          resize: vertical;
        }
        .cc-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .cc-primary,
        .cc-secondary {
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 600;
          cursor: pointer;
        }
        .cc-primary {
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          color: #ffffff;
        }
        .cc-secondary {
          background: rgba(148, 163, 209, 0.2);
          color: #1f2937;
        }
        .cc-blocked {
          background: rgba(248, 113, 113, 0.15);
          color: #b91c1c;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 0.9rem;
        }
        @media (max-width: 720px) {
          .input-controls {
            flex-direction: column;
          }
          .input-buttons {
            flex-direction: row;
            align-self: flex-end;
          }
        }
        @media (max-width: 960px) {
          .if-conversation {
            grid-template-columns: 1fr;
          }
          .if-sidebar {
            position: static;
          }
        }
        @media (max-width: 720px) {
          .if-selection {
            padding: 20px;
          }
          .character-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>

      {/* Debug panel toggled via ?debug=1 */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') && (
        <pre style={{ position: 'fixed', bottom: 8, left: 8, right: 8, maxHeight: 200, overflow: 'auto', background: '#0f172a', color: '#e2e8f0', padding: 8, borderRadius: 8, fontSize: 12 }}>
{JSON.stringify(lastApi, null, 2)}
        </pre>
      )}
    </div>
  );
}
