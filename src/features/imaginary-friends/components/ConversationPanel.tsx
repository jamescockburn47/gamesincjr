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
  onClearChat?: () => void;
  onNewThread?: () => void;
  onDeleteHistory?: () => void;
  isLoading: boolean;
  showImageButton?: boolean;
  sessionInfo?: SessionInfo | null;
  gameStatus?: GameStatus | null;
  isDeletingHistory?: boolean;
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
  onDeleteHistory,
  isLoading,
  showImageButton = false,
  sessionInfo,
  gameStatus,
  isDeletingHistory = false,
}: ConversationPanelProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showTopics, setShowTopics] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [renderedMessages, setRenderedMessages] = useState(messages);

  useEffect(() => {
    setRenderedMessages(messages);
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
  const budgetLeft = sessionInfo?.budgetCentsRemaining;
  const progressPercent = gameStatus
    ? Math.min(100, Math.round((gameStatus.experience / Math.max(1, gameStatus.nextLevelThreshold)) * 100))
    : 0;

  return (
    <div className="conversation-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <div />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRenderedMessages([]);
              onClearChat?.();
            }}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Clear chat (keeps history saved)"
            disabled={isLoading}
          >
            Clear chat
          </button>
          <button
            type="button"
            onClick={() => onNewThread?.()}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            title="Start a new thread (history retained, context cleared)"
            disabled={isLoading}
          >
            New thread
          </button>
          <button
            type="button"
            onClick={() => onDeleteHistory?.()}
            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            title="Delete all saved history for this friend"
            disabled={isLoading || isDeletingHistory}
          >
            {isDeletingHistory ? 'Deleting…' : 'Delete history'}
          </button>
        </div>
      </div>
      {gameStatus && (
        <div className="friendship-status">
          <div className="status-header">
            <span className="status-level">Lvl {gameStatus.friendshipLevel}</span>
            <span className="status-xp">
              {gameStatus.experience}/{gameStatus.nextLevelThreshold} XP
            </span>
          </div>
          <div className="status-progress">
            <div className="status-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="status-meta">
            <span className="status-stardust">⭐ {gameStatus.stardustEarned} stardust</span>
            <span className="status-sentiment">Mood: {gameStatus.sentiment}</span>
          </div>
          {gameStatus.badgesUnlocked.length > 0 && (
            <div className="status-badges">
              Badges: {gameStatus.badgesUnlocked.join(', ')}
            </div>
          )}
          {gameStatus.keywords.length > 0 && (
            <div className="status-keywords">
              Adventure sparks: {gameStatus.keywords.slice(0, 4).join(', ')}
            </div>
          )}
          <div className="status-summary">{gameStatus.summary}</div>
          <div className="status-suggestion">{gameStatus.suggestedActivity}</div>
        </div>
      )}
      <div className="messages-container">
        {renderedMessages.map((message) => (
          <div
            key={`${message.id}-${messages.length}`}
            className={`message ${message.speaker === 'player' ? 'player-message' : 'character-message'}`}
          >
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatMessageTime(message.timestamp)}</div>
            </div>
            {resolveImageUrl(message.imageUrl) && (
              <div className="message-image">
                <Image
                  src={resolveImageUrl(message.imageUrl) ?? ''}
                  alt="Generated"
                  width={360}
                  height={240}
                  sizes="(min-width: 1024px) 360px, 80vw"
                  style={{ width: '100%', height: 'auto' }}
                  unoptimized
                />
              </div>
            )}
            {message.speaker === 'character' && (
              <div className="voice-controls">
                <VoicePlayer text={message.text} characterName={character.id} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message character-message typing-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span className="character-name">{character.name} is thinking</span>
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="message character-message">
            <div className="message-content">
              <div className="message-text">Say hi to start the conversation!</div>
              <div className="message-time">&nbsp;</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        {countdown > 0 && (
          <div className="countdown-timer">
            <span className="timer-icon">⏰</span>
            <span className="timer-text">
              {`${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`} left today
            </span>
          </div>
        )}

        {messagesLeft !== undefined && (
          <div className="session-hint">
            <span>Chats remaining today: {messagesLeft}</span>
          </div>
        )}

        {budgetLeft !== undefined && (
          <div className="session-hint budget">
            <span>Budget left today: {'$'}{(budgetLeft / 100).toFixed(2)}</span>
          </div>
        )}

        {showImageButton && sessionInfo && imagesLeft > 0 && (
          <div className="image-generation">
            <button
              type="button"
              className="image-button"
              onClick={handleRequestImage}
              disabled={isLoading}
              title={`Create an image based on our conversation (${sessionInfo.imagesRemaining} remaining)`}
            >
              🎨 Create Image
            </button>
            <span className="image-count">{imagesLeft} images left</span>
          </div>
        )}

        {showTopics && (
          <div className="topics-panel">
            <h4>Conversation Topics</h4>
            <div className="topics-grid">
              {topics.slice(0, 6).map((topic) => (
                <button
                  type="button"
                  key={topic.id}
                  className="topic-button"
                  onClick={() => {
                    onSelectTopic(topic);
                    setShowTopics(false);
                  }}
                >
                  <span className="topic-name">{topic.name}</span>
                  <span className="topic-description">{topic.description}</span>
                </button>
              ))}
            </div>
            <button type="button" className="topics-close" onClick={() => setShowTopics(false)}>
              Close topics
            </button>
          </div>
        )}

        <div className="input-controls">
          <textarea
            className="message-input"
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Talk with ${character.name}...`}
            disabled={isLoading}
            rows={3}
          />
          <div className="input-buttons">
            <button type="button" className="topics-button" onClick={() => setShowTopics((prev) => !prev)}>
              Topics
            </button>
            <button type="button" className="send-button" onClick={handleSendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
