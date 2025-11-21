"use client";
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Character, ConversationMessage, GameStatus, SessionInfo, Topic } from '../types';
import VoicePlayer from './VoicePlayer';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  character: Character;
  topics: Topic[];
  onSendMessage: (message: string, requestImage?: boolean) => void;
  onSelectTopic: (topic: Topic) => void;
  onClearChat?: () => Promise<void> | void;
  onNewThread?: () => void;
  isLoading: boolean;
  showImageButton?: boolean;
  sessionInfo?: SessionInfo | null;
  gameStatus?: GameStatus | null;
  isClearingChat?: boolean;
}

/**
 * Renders the active conversation view for a selected imaginary friend.
 * The component receives a filtered list of messages to display so that
 * callers can hide previous history while keeping it available for context.
 */
export default function ConversationPanel({
  messages,
  character,
  topics,
  onSendMessage,
  onSelectTopic,
  onClearChat,
  onNewThread,
  isLoading,
  showImageButton = false,
  sessionInfo,
  gameStatus,
  isClearingChat = false,
}: ConversationPanelProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showTopics, setShowTopics] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages]);

  useEffect(() => {
    if (!sessionInfo?.remainingTime) {
      setCountdown(0);
      return;
    }
    setCountdown(sessionInfo.remainingTime);
    const timerId = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [sessionInfo?.remainingTime]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim(), false);
      setInputMessage('');
    }
  };

  const handleRequestImage = () => {
    if (!isLoading) {
      onSendMessage('', true);
    }
  };

  const handleKeyPress: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const resolveImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return url.startsWith('/') ? url : `/imaginary-friends/generated/${url}`;
  };

  const imagesLeft = sessionInfo
    ? Math.min(
      sessionInfo.imagesRemaining,
      sessionInfo.imageAllowanceRemaining ?? sessionInfo.imagesRemaining,
    )
    : 0;

  const messagesLeft = sessionInfo?.messageAllowanceRemaining;

  const progressPercent = gameStatus
    ? Math.min(100, Math.round((gameStatus.experience / Math.max(1, gameStatus.nextLevelThreshold)) * 100))
    : 0;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onClearChat?.()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Clear & delete chat history"
            disabled={isLoading || isClearingChat}
          >
            {isClearingChat ? (
              <span className="flex items-center gap-2" aria-live="polite">
                <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" aria-hidden />
                Clearing…
              </span>
            ) : (
              'Clear History'
            )}
          </button>
          <button
            type="button"
            onClick={() => onNewThread?.()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Start a new thread (history retained, context cleared)"
            disabled={isLoading || isClearingChat}
          >
            New Thread
          </button>
        </div>
      </div>

      {/* Game Status Bar */}
      {gameStatus && (
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">Lvl {gameStatus.friendshipLevel}</span>
            <span>
              {gameStatus.experience}/{gameStatus.nextLevelThreshold} XP
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span>⭐</span> {gameStatus.stardustEarned} stardust
            </span>
            <span className="flex items-center gap-1">
              <span>Mood:</span> <span className="font-medium text-slate-700 capitalize">{gameStatus.sentiment}</span>
            </span>
          </div>

          {gameStatus.badgesUnlocked.length > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              <span className="font-semibold">Badges:</span> {gameStatus.badgesUnlocked.join(', ')}
            </div>
          )}

          <div className="mt-2 text-xs italic text-slate-500">
            {gameStatus.summary}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
        {messages.map((message) => (
          <div
            key={`${message.id}-${messages.length}`}
            className={`flex flex-col ${message.speaker === 'player' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`relative max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${message.speaker === 'player'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 rounded-bl-none'
                }`}
            >
              <div className="whitespace-pre-wrap">{message.text}</div>
              <div className={`mt-1 text-[10px] opacity-70 ${message.speaker === 'player' ? 'text-primary-foreground' : 'text-slate-400'}`}>
                {formatMessageTime(message.timestamp)}
              </div>
            </div>

            {resolveImageUrl(message.imageUrl) && (
              <div className="mt-2 overflow-hidden rounded-xl shadow-md ring-1 ring-slate-200 max-w-[300px]">
                <Image
                  src={resolveImageUrl(message.imageUrl) ?? ''}
                  alt="Generated"
                  width={360}
                  height={240}
                  sizes="(min-width: 1024px) 360px, 80vw"
                  className="h-auto w-full object-cover"
                  unoptimized
                />
              </div>
            )}

            {message.speaker === 'character' && (
              <div className="mt-1 ml-1">
                <VoicePlayer text={message.text} characterName={character.id} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="rounded-2xl rounded-bl-none bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{character.name} is thinking</span>
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-400">
              <p>Say hi to start the conversation!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
          {countdown > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
              <span>⏰</span>
              <span>
                {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`} left
              </span>
            </div>
          )}

          {messagesLeft !== undefined && (
            <div className="flex items-center gap-1">
              <span>💬</span>
              <span>{messagesLeft} chats left</span>
            </div>
          )}

          {showImageButton && sessionInfo && imagesLeft > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:inline">{imagesLeft} images left</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 font-bold text-purple-700 transition-colors hover:bg-purple-200 disabled:opacity-50"
                onClick={handleRequestImage}
                disabled={isLoading}
                title={`Create an image based on our conversation (${sessionInfo.imagesRemaining} remaining)`}
              >
                🎨 Create Image
              </button>
            </div>
          )}
        </div>

        {showTopics && (
          <div className="mb-4 rounded-xl bg-slate-50 p-4 shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Conversation Topics</h4>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-900"
                onClick={() => setShowTopics(false)}
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {topics.slice(0, 6).map((topic) => (
                <button
                  type="button"
                  key={topic.id}
                  className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-2 text-left text-xs transition-all hover:border-primary hover:shadow-sm"
                  onClick={() => {
                    onSelectTopic(topic);
                    setShowTopics(false);
                  }}
                >
                  <span className="font-bold text-slate-900">{topic.name}</span>
                  <span className="mt-1 line-clamp-2 text-slate-500">{topic.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            className="block w-full resize-none rounded-2xl border-0 bg-slate-50 py-3 pl-4 pr-20 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:leading-6"
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Talk with ${character.name}...`}
            disabled={isLoading}
            rows={1}
            style={{ minHeight: '3rem' }}
          />
          <div className="absolute bottom-1.5 right-2 flex gap-1">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              onClick={() => setShowTopics((prev) => !prev)}
              title="Topics"
            >
              💡
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
