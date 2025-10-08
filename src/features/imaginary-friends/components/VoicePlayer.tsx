'use client';

import { useEffect, useState } from 'react';
import { VoiceService, defaultVoiceService } from '../services/voiceService';

interface VoicePlayerProps {
  text: string;
  characterName: string;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export default function VoicePlayer({ text, characterName, onPlayStart, onPlayEnd }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);

  useEffect(() => {
    setIsSupported(defaultVoiceService.isSupported());
    const storedEleven = localStorage.getItem('elevenlabs_api_key');
    const storedOpenAi = localStorage.getItem('openai_api_key');
    setHasElevenLabsKey(Boolean(storedEleven));
    setHasOpenAiKey(Boolean(storedOpenAi));
  }, []);

  const playText = async () => {
    if (!isSupported || !text.trim() || isPlaying) return;
    setIsPlaying(true);
    onPlayStart?.();
    try {
      const audioUrl = await defaultVoiceService.generateSpeech(text, characterName);
      if (audioUrl === 'browser-speech-complete') {
        setIsPlaying(false);
        onPlayEnd?.();
        return;
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        onPlayEnd?.();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlaying(false);
        onPlayEnd?.();
      };
      await audio.play();
    } catch (error) {
      console.error('Voice playback failed', error);
      setIsPlaying(false);
      onPlayEnd?.();
      if (error instanceof Error && /api key|not found/i.test(error.message)) {
        setShowApiKeyInput(true);
      }
    }
  };

  const handleSaveApiKeys = () => {
    if (elevenLabsApiKey.trim()) {
      VoiceService.setElevenLabsApiKey(elevenLabsApiKey.trim());
      setHasElevenLabsKey(true);
    }
    if (openaiApiKey.trim()) {
      VoiceService.setOpenAIApiKey(openaiApiKey.trim());
      setHasOpenAiKey(true);
    }
    setElevenLabsApiKey('');
    setOpenaiApiKey('');
    setShowApiKeyInput(false);
  };

  const handleClearKeys = () => {
    VoiceService.clearApiKeys();
    setHasElevenLabsKey(false);
    setHasOpenAiKey(false);
    setShowApiKeyInput(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="voice-player">
      <button
        type="button"
        onClick={playText}
        disabled={isPlaying || !text.trim()}
        className={`voice-button ${isPlaying ? 'voice-button--playing' : ''}`}
        title={`Play with ${hasElevenLabsKey ? 'ElevenLabs British' : hasOpenAiKey ? 'OpenAI' : 'browser'} voice`}
      >
        {isPlaying ? '⏹' : '▶️'}
      </button>

      {!hasElevenLabsKey && !hasOpenAiKey && (
        <button
          type="button"
          onClick={() => setShowApiKeyInput(true)}
          className="voice-settings-button"
          title="Add API keys for premium British voices"
        >
          ⚙️
        </button>
      )}

      {showApiKeyInput && (
        <div className="api-key-modal">
          <div className="api-key-content">
            <h3>🇬🇧 Premium British Voices</h3>
            <p>Add API keys for authentic British character voices!</p>
            <div className="api-key-section">
              <label>
                <strong>ElevenLabs API Key</strong>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(event) => setElevenLabsApiKey(event.target.value)}
                  placeholder="sk-..."
                />
              </label>
              <small>
                Get your free key at{' '}
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">
                  elevenlabs.io
                </a>
              </small>
            </div>
            <div className="api-key-section">
              <label>
                <strong>OpenAI API Key</strong>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(event) => setOpenaiApiKey(event.target.value)}
                  placeholder="sk-..."
                />
              </label>
              <small>
                Get your key at{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  platform.openai.com
                </a>
              </small>
            </div>
            <div className="api-key-actions">
              <button type="button" className="cc-secondary" onClick={handleClearKeys}>
                Clear keys
              </button>
              <button type="button" className="cc-primary" onClick={handleSaveApiKeys}>
                Save keys
              </button>
            </div>
            <button type="button" className="api-key-close" onClick={() => setShowApiKeyInput(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

