'use client';

export interface VoiceConfig {
  provider: 'elevenlabs' | 'openai' | 'browser';
  apiKey?: string;
  voiceId?: string;
  model?: string;
}

export interface CharacterVoice {
  elevenlabsVoice: {
    voiceId: string;
    model: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5';
    voiceSettings: {
      stability: number;
      similarity_boost: number;
      style: number;
      use_speaker_boost: boolean;
    };
  };
  openaiVoice?: string;
  browserVoice?: {
    gender: 'male' | 'female';
    language: string;
    rate: number;
    pitch: number;
  };
}

export const characterVoiceMap: Record<string, CharacterVoice> = {
  luna: {
    elevenlabsVoice: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      model: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.75,
        similarity_boost: 0.8,
        style: 0.6,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'alloy',
    browserVoice: { gender: 'female', language: 'en-GB', rate: 0.85, pitch: 1.1 },
  },
  shadow: {
    elevenlabsVoice: {
      voiceId: 'L0Dsvb3SLTyegXwtm47J',
      model: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.8,
        similarity_boost: 0.85,
        style: 0.7,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'onyx',
    browserVoice: { gender: 'male', language: 'en-GB', rate: 0.8, pitch: 0.9 },
  },
  oak: {
    elevenlabsVoice: {
      voiceId: 'HDA9tsk27wYi3uq0fPcK',
      model: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.85,
        similarity_boost: 0.9,
        style: 0.5,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'echo',
    browserVoice: { gender: 'male', language: 'en-GB', rate: 0.9, pitch: 0.95 },
  },
  spark: {
    elevenlabsVoice: {
      voiceId: '56AoDkrOh6qfVPDXZ7Pt',
      model: 'eleven_turbo_v2_5',
      voiceSettings: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.8,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'shimmer',
    browserVoice: { gender: 'female', language: 'en-GB', rate: 1.1, pitch: 1.2 },
  },
  coral: {
    elevenlabsVoice: {
      voiceId: 'g6xIsTj2HwM6VR4iXFCw',
      model: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.6,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'nova',
    browserVoice: { gender: 'female', language: 'en-GB', rate: 0.95, pitch: 1.0 },
  },
  ember: {
    elevenlabsVoice: {
      voiceId: 'OYTbf65OHHFELVut7v2H',
      model: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.55,
        use_speaker_boost: true,
      },
    },
    openaiVoice: 'alloy',
    browserVoice: { gender: 'female', language: 'en-GB', rate: 0.9, pitch: 1.05 },
  },
};

function getElevenLabsApiKey(): string | null {
  try {
    return localStorage.getItem('elevenlabs_api_key');
  } catch {
    return null;
  }
}

function getOpenAIApiKey(): string | null {
  try {
    return localStorage.getItem('openai_api_key');
  } catch {
    return null;
  }
}

export class VoiceService {
  constructor(_config: Partial<VoiceConfig> = {}) {
    void _config;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined';
  }

  async generateSpeech(text: string, characterName: string): Promise<string> {
    const base = characterVoiceMap[characterName.toLowerCase()];
    const character = base ?? {
      elevenlabsVoice: {
        voiceId: '',
        model: 'eleven_multilingual_v2' as const,
        voiceSettings: {
          stability: 0.75,
          similarity_boost: 0.8,
          style: 0.6,
          use_speaker_boost: true,
        },
      },
      openaiVoice: 'alloy',
      browserVoice: { gender: 'female', language: 'en-GB', rate: 0.95, pitch: 1.05 },
    };

    const preferBrowser = !base;

    if (preferBrowser) {
      try {
        return await this.generateBrowserSpeech(text, character);
      } catch (error) {
        console.warn('Browser speech failed; falling back to OpenAI', error);
      }
    }

    try {
      return await this.generateOpenAISpeech(text, character);
    } catch (openAiError) {
      console.warn('OpenAI TTS failed, trying ElevenLabs…', openAiError);
      try {
        return await this.generateElevenLabsSpeech(text, character);
      } catch (elevenError) {
        console.warn('ElevenLabs TTS failed, falling back to browser speech…', elevenError);
        return await this.generateBrowserSpeech(text, character);
      }
    }
  }

  private async generateElevenLabsSpeech(text: string, character: CharacterVoice): Promise<string> {
    const apiKey = getElevenLabsApiKey();
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }
    const { voiceId, model, voiceSettings } = character.elevenlabsVoice;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: voiceSettings,
      }),
    });
    if (!response.ok) {
      throw new Error('ElevenLabs request failed');
    }
    const buffer = await response.arrayBuffer();
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
  }

  private async generateOpenAISpeech(text: string, character: CharacterVoice): Promise<string> {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: character.openaiVoice ?? 'alloy',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI TTS request failed');
    }

    const buffer = await response.arrayBuffer();
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/mp3' }));
  }

  private async generateBrowserSpeech(text: string, character: CharacterVoice): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No browser context'));
      const synth = window.speechSynthesis;
      if (!synth) return reject(new Error('Speech synthesis not supported'));

      const utterance = new SpeechSynthesisUtterance(text);
      const config = character.browserVoice ?? {
        gender: 'female',
        language: 'en-GB',
        rate: 1,
        pitch: 1,
      };

      const voices = synth.getVoices();
      const match = voices.find((voice) => voice.lang === config.language);
      if (match) {
        utterance.voice = match;
      }
      utterance.lang = config.language;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;

      utterance.onend = () => resolve('browser-speech-complete');
      utterance.onerror = (error) => reject(error.error ?? new Error('Speech synthesis error'));
      synth.cancel();
      synth.speak(utterance);
    });
  }

  static setElevenLabsApiKey(key: string) {
    localStorage.setItem('elevenlabs_api_key', key);
  }

  static setOpenAIApiKey(key: string) {
    localStorage.setItem('openai_api_key', key);
  }

  static clearApiKeys() {
    localStorage.removeItem('elevenlabs_api_key');
    localStorage.removeItem('openai_api_key');
  }
}

export const defaultVoiceService = new VoiceService();

