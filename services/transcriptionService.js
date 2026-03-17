const DEFAULT_TRANSCRIPTION_MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe';

class TranscriptionService {
  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async transcribeAudio({ buffer, mimeType, filename }) {
    if (!this.isConfigured()) {
      throw new Error('Audio transcription is not configured. Set OPENAI_API_KEY.');
    }

    const formData = new FormData();
    formData.append('model', DEFAULT_TRANSCRIPTION_MODEL);
    formData.append('file', new Blob([buffer], { type: mimeType }), filename);

    if (process.env.OPENAI_TRANSCRIPTION_LANGUAGE) {
      formData.append('language', process.env.OPENAI_TRANSCRIPTION_LANGUAGE);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Audio transcription failed: ${response.status} ${errorBody}`);
    }

    const result = await response.json();
    return String(result.text || '').trim();
  }
}

module.exports = new TranscriptionService();