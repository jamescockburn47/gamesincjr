'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { baseCharacters, conversationTopics } from './data';
import type {
  Character,
  CharacterIntroResponse,
  ConversationMessage,
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
  clearedMarkers: 'if_clearedConversations',
};

type Sentiment = 'happy' | 'sad' | 'excited' | 'thoughtful' | 'curious';

type SavedMessageEntry = {
  id: string;
  speaker: 'player' | 'character';
  text: string;
  timestamp: string;
  imageUrl?: string | null;
};



type StreamEvent =
  | { type: 'start'; sessionInfo?: SessionInfo }
  | { type: 'delta'; text: string }
  | { type: 'final'; response: string; imageUrl?: string | null; gameStatus?: GameStatus; sessionInfo?: SessionInfo }
  | { type: 'error'; error: string };

const conversationMarkerKey = (characterId: string, userId: string) => `${userId}::${characterId}`;

function analyseSentiment(text: string): Sentiment {
  const value = text.toLowerCase();
  if (/amazing|wonderful|awesome|excited|yay|fantastic|incredible/.test(value)) return 'excited';
  if (/happy|joy|smile|laugh|fun|great|good|nice|love/.test(value)) return 'happy';
  if (/sad|sorry|upset|disappointed|worried|trouble|difficult/.test(value)) return 'sad';
  if (/what|how|why|tell me|explain|curious|wonder|interesting/.test(value)) return 'curious';
  return 'thoughtful';
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
  const [hiddenBefore, setHiddenBefore] = useState<number>(0);
  const [userId, setUserId] = useState<string>('default');
  const [username, setUsername] = useState<string>('');
  const messagesRef = useRef<ConversationMessage[]>([]);
  const [characters, setCharacters] = useState<Character[]>(baseCharacters);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showImageButton, setShowImageButton] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [lastApi, setLastApi] = useState<{ req?: unknown; res?: unknown; error?: string } | null>(null);
  const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null);
  const [avatarsLoaded, setAvatarsLoaded] = useState(false);
  const effectiveUserId = useMemo(() => userId.trim() || 'default', [userId]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const imagesAvailable = useCallback((info: SessionInfo | null | undefined) => {
    if (!info) return 0;
    const allowance = info.imageAllowanceRemaining ?? info.imagesRemaining;
    return Math.max(0, Math.min(info.imagesRemaining, allowance));
  }, []);

  const pushSystemMessage = useCallback((message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        speaker: 'character',
        text: message,
        timestamp: new Date(),
      },
    ]);
  }, []);

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

  const markConversationCleared = useCallback((characterId: string, targetUserId: string) => {
    if (!characterId || !targetUserId) return;
    try {
      const key = conversationMarkerKey(characterId, targetUserId);
      const raw = sessionStorage.getItem(STORAGE_KEYS.clearedMarkers);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      const markers: Record<string, number> = {};
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([entryKey, value]) => {
          if (typeof value === 'number') {
            markers[entryKey] = value;
          }
        });
      }
      markers[key] = Date.now();
      sessionStorage.setItem(STORAGE_KEYS.clearedMarkers, JSON.stringify(markers));
    } catch {
      // ignore storage issues
    }
  }, []);

  const clearConversationClearedMarker = useCallback((characterId: string, targetUserId: string) => {
    if (!characterId || !targetUserId) return;
    try {
      const key = conversationMarkerKey(characterId, targetUserId);
      const raw = sessionStorage.getItem(STORAGE_KEYS.clearedMarkers);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') {
        sessionStorage.removeItem(STORAGE_KEYS.clearedMarkers);
        return;
      }
      const markers: Record<string, number> = {};
      Object.entries(parsed).forEach(([entryKey, value]) => {
        if (entryKey !== key && typeof value === 'number') {
          markers[entryKey] = value;
        }
      });
      if (Object.keys(markers).length === 0) {
        sessionStorage.removeItem(STORAGE_KEYS.clearedMarkers);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.clearedMarkers, JSON.stringify(markers));
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  const wasConversationClearedThisSession = useCallback((characterId: string, targetUserId: string) => {
    if (!characterId || !targetUserId) return false;
    try {
      const key = conversationMarkerKey(characterId, targetUserId);
      const raw = sessionStorage.getItem(STORAGE_KEYS.clearedMarkers);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') return false;
      return typeof parsed[key] === 'number';
    } catch {
      return false;
    }
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
  }, [imagesAvailable]);

  useEffect(() => {
    loadSessionStatus();
  }, [loadSessionStatus]);

  // Identify user and persist cookie-backed userId
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/session/identify`, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { userId: string };
          if (data?.userId) {
            setUserId(data.userId);
            setUsername(data.userId);
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    setShowImageButton(imagesAvailable(sessionInfo) > 0);
  }, [imagesAvailable, sessionInfo]);

  useEffect(() => {
    try {
      const savedCharId = localStorage.getItem(STORAGE_KEYS.selectedCharacter);
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

        setHiddenBefore(0);
        setMessages([
          {
            id: String(Date.now()),
            speaker: 'character',
            text: data.introduction,
            timestamp: new Date(),
            imageUrl: data.imageUrl ?? null,
          },
        ]);

        updateCharacterMood(characterId, 'happy');
        const character = characters.find((entry) => entry.id === characterId);
        if (character) {
          setGameStatus(data.gameStatus ?? createFallbackGameStatus(character));
        }
      } catch (error) {
        console.warn('Failed to initialise conversation', error);
        setHiddenBefore(0);
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
        }
      }
    },
    [characters, createFallbackGameStatus, updateCharacterMood],
  );

  const restoreConversationHistory = useCallback(
    async (characterId: string, targetUserId: string): Promise<boolean> => {
      if (wasConversationClearedThisSession(characterId, targetUserId)) {
        return false;
      }
      try {
        const params = new URLSearchParams({
          characterId,
          userId: targetUserId,
        });
        params.set('skipCache', '1');
        const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) {
          return false;
        }
        const data = (await res.json()) as {
          turns?: Array<{ speaker: 'player' | 'character'; text: string }>;
        };
        const turns = Array.isArray(data.turns) ? data.turns : [];
        if (!turns.length) {
          return false;
        }
        const seeded: ConversationMessage[] = turns.map((turn, index) => ({
          id: `${Date.now()}-${index}`,
          speaker: turn.speaker,
          text: turn.text,
          timestamp: new Date(),
        }));
        setHiddenBefore(0);
        messagesRef.current = seeded;
        setMessages(seeded);
        return true;
      } catch (error) {
        console.warn('Failed to restore conversation history', error);
        return false;
      }
    },
    [wasConversationClearedThisSession],
  );

  // Combined useEffect to handle initialization/restore logic properly
  useEffect(() => {
    if (!selectedCharacter) return;

    localStorage.setItem(STORAGE_KEYS.selectedCharacter, selectedCharacter.id);

    const load = async () => {
      // If we already have messages for this character (e.g. from memory), don't reload
      if (messagesRef.current.length > 0) return;

      const resolvedUserId = effectiveUserId;
      if (!resolvedUserId) return;

      const restored = await restoreConversationHistory(selectedCharacter.id, resolvedUserId);

      // If we couldn't restore history, and we have no messages, initialize a new conversation
      if (!restored && messagesRef.current.length === 0) {
        await initialiseConversation(selectedCharacter.id);
      }
    };

    void load();
  }, [selectedCharacter, effectiveUserId, initialiseConversation, restoreConversationHistory]);


  useEffect(() => {
    try {
      if (!messages.length && hiddenBefore <= 0) {
        sessionStorage.removeItem(STORAGE_KEYS.messages);
        return;
      }
      const serialised = JSON.stringify({
        entries: messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
        hiddenBefore,
      });
      sessionStorage.setItem(STORAGE_KEYS.messages, serialised);
    } catch {
      // ignore storage issues
    }
  }, [messages, hiddenBefore]);

  /**
   * Reset the in-memory chat state and purge the persisted session cache.
   * Used when starting a fresh thread or after permanently deleting history.
   */
  const clearStoredMessages = useCallback(() => {
    messagesRef.current = [];
    setMessages([]);
    setHiddenBefore(0);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.messages);
    } catch {
      // ignore storage issues
    }
  }, []);

  const handleClearChat = useCallback(async () => {
    if (!selectedCharacter || isClearingHistory) {
      return;
    }
    setIsClearingHistory(true);
    try {
      // 1. Mark locally as cleared immediately to prevent restoration race
      markConversationCleared(selectedCharacter.id, effectiveUserId);

      const params = new URLSearchParams({
        characterId: selectedCharacter.id,
        userId: effectiveUserId,
      });
      const response = await fetch(`${API_BASE_URL}/history?${params.toString()}`, {
        method: 'DELETE',
        cache: 'no-store',
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete history (${response.status})`);
      }
      clearStoredMessages();
      setGameStatus(null);
      // Re-initialize to show fresh intro
      await initialiseConversation(selectedCharacter.id);
    } catch (error) {
      console.error('Failed to clear conversation history', error);
      pushSystemMessage("I couldn't clear our saved chats right now. Let's try again in a moment!");
      // If failed, maybe unmark? But safer to leave marked to force fresh start next time if needed
    } finally {
      setIsClearingHistory(false);
    }
  }, [clearStoredMessages, effectiveUserId, isClearingHistory, markConversationCleared, pushSystemMessage, selectedCharacter, initialiseConversation]);

  const handleNewThread = useCallback(() => {
    clearStoredMessages();
    if (selectedCharacter) {
      void initialiseConversation(selectedCharacter.id);
    }
  }, [clearStoredMessages, selectedCharacter, initialiseConversation]);

  const handleSendMessage = useCallback(
    async (messageText: string, requestImage = false) => {
      if (!selectedCharacter) return;

      clearConversationClearedMarker(selectedCharacter.id, effectiveUserId);

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
            text: username ? `${messageText}` : messageText,
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
          message: username ? `${username}: ${messageText}` : messageText,
          requestImage,
          conversationHistory: history.map((entry) => ({
            speaker: entry.speaker,
            text: entry.text,
          })),
          userId: effectiveUserId,
          newThread: false,
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
                      last.text = (last.text === '…' ? '' : last.text) + evt.text;
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
    [
      clearConversationClearedMarker,
      createFallbackGameStatus,
      imagesAvailable,
      messages,
      pushSystemMessage,
      selectedCharacter,
      sessionInfo,
      updateCharacterMood,
      effectiveUserId,
      username,
    ],
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

  const visibleMessages = useMemo(() => {
    if (hiddenBefore <= 0) {
      return messages;
    }
    return messages.filter((message) => {
      const timeValue =
        message.timestamp instanceof Date ? message.timestamp.getTime() : new Date(message.timestamp).getTime();
      return Number.isFinite(timeValue) && timeValue >= hiddenBefore;
    });
  }, [hiddenBefore, messages]);

  return (
    <div className="min-h-[80vh] w-full">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Magic AI Friends</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">Chat with magical companions tuned for young storytellers.</p>
      </header>

      <main className="mx-auto max-w-7xl">
        {!selectedCharacter ? (
          <section className="space-y-8">
            <header className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Choose your next conversation</h2>
              <p className="text-slate-500">Pick a friend or design a new companion (one per week).</p>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-primary hover:bg-primary/5"
                onClick={() => setShowCreator(true)}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Create New Friend</h3>
                <p className="mt-2 text-sm text-slate-500">Design a custom personality</p>
              </button>

              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isSelected={false}
                  onClick={() => {
                    // Clear everything first to ensure fresh start for the view
                    messagesRef.current = [];
                    setHiddenBefore(0);
                    setMessages([]);

                    setSelectedCharacter(character);
                    setGameStatus(createFallbackGameStatus(character));
                    // The useEffect will trigger now and handle load/restore
                  }}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[300px_1fr] lg:h-[600px]">
            <aside className="flex flex-col gap-4 lg:h-full">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                onClick={() => {
                  setSelectedCharacter(null);
                  setGameStatus(null);
                  setMessages([]);
                  setHiddenBefore(0);
                }}
              >
                ← Back to Friends
              </button>

              <div className="flex-1 overflow-y-auto rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 shadow-md ring-4 ring-white">
                    {selectedCharacter.avatarUrl?.startsWith('/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedCharacter.avatarUrl}
                        alt={selectedCharacter.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        {selectedCharacter.avatarUrl || '🙂'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCharacter.name}</h2>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${selectedCharacter.currentMood === 'happy' ? 'bg-green-500' :
                      selectedCharacter.currentMood === 'excited' ? 'bg-amber-500' :
                        selectedCharacter.currentMood === 'sad' ? 'bg-blue-500' :
                          'bg-purple-500'
                      }`} />
                    <span className="capitalize">{selectedCharacter.currentMood}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-semibold text-slate-500 uppercase">
                      <span>Friendship</span>
                      <span>{selectedCharacter.relationshipLevel}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, selectedCharacter.relationshipLevel))}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                    {selectedCharacter.personality}
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your chat history with ' + selectedCharacter.name + '? This cannot be undone.')) {
                        handleClearChat();
                      }
                    }}
                    disabled={isClearingHistory}
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {isClearingHistory ? 'Clearing...' : 'Clear Chat History'}
                  </button>
                </div>
              </div>
            </aside>

            <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100 lg:h-full">
              <ConversationPanel
                messages={visibleMessages}
                character={selectedCharacter}
                topics={topics}
                onSendMessage={handleSendMessage}
                onSelectTopic={handleTopicSelected}
                onClearChat={handleClearChat}
                onNewThread={handleNewThread}
                isLoading={isLoading}
                showImageButton={showImageButton}
                sessionInfo={sessionInfo}
                gameStatus={gameStatus}
                isClearingChat={isClearingHistory}
              />
            </div>
          </section>
        )}
      </main>

      {showCreator && (
        <CharacterCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onCreate={handleCreateCharacter}
          canCreate={canCreate}
          blockedReason={blockedReason}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      {/* Debug panel toggled via ?debug=1 */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') && (
        <pre style={{ position: 'fixed', bottom: 8, left: 8, right: 8, maxHeight: 200, overflow: 'auto', background: '#0f172a', color: '#e2e8f0', padding: 8, borderRadius: 8, fontSize: 12 }}>
          {JSON.stringify(lastApi, null, 2)}
        </pre>
      )}
    </div>
  );
}
