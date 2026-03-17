const DEFAULT_GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';

const MIME_TYPE_EXTENSIONS = {
  'audio/aac': 'aac',
  'audio/amr': 'amr',
  'audio/m4a': 'm4a',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/opus': 'opus',
  'audio/wav': 'wav'
};

class WhatsAppService {
  isConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  getConfigurationStatus() {
    return {
      hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      hasVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
      graphApiVersion: DEFAULT_GRAPH_API_VERSION,
      webhookPath: '/api/whatsapp/webhook',
      ready: Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN
        && process.env.WHATSAPP_PHONE_NUMBER_ID
        && process.env.WHATSAPP_VERIFY_TOKEN
      ),
      voiceReady: Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN
        && process.env.WHATSAPP_PHONE_NUMBER_ID
        && process.env.WHATSAPP_VERIFY_TOKEN
        && process.env.OPENAI_API_KEY
      )
    };
  }

  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
      return { success: true, challenge };
    }

    return { success: false };
  }

  extractMessages(payload) {
    const entries = payload?.entry || [];

    return entries.flatMap((entry) => (
      (entry.changes || []).flatMap((change) => change.value?.messages || [])
    ));
  }

  getMessageText(message) {
    if (message?.type === 'text') {
      return message.text?.body?.trim() || '';
    }

    if (message?.type === 'button') {
      return message.button?.text?.trim() || '';
    }

    if (message?.type === 'interactive') {
      return message.interactive?.button_reply?.title?.trim()
        || message.interactive?.list_reply?.title?.trim()
        || '';
    }

    return '';
  }

  isAudioMessage(message) {
    return message?.type === 'audio' && Boolean(message.audio?.id);
  }

  getUnsupportedMessageReply(message) {
    if (this.isAudioMessage(message)) {
      return 'I can process voice notes, but audio transcription is not configured right now. Please send your message as text or configure OPENAI_API_KEY on the backend.';
    }

    return 'Please send a text message or voice note. Other WhatsApp message types are not supported yet.';
  }

  async downloadAudioMedia(mediaId) {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp Cloud API is not configured.');
    }

    const metadataResponse = await fetch(
      `https://graph.facebook.com/${DEFAULT_GRAPH_API_VERSION}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );

    if (!metadataResponse.ok) {
      const errorBody = await metadataResponse.text();
      throw new Error(`WhatsApp media lookup failed: ${metadataResponse.status} ${errorBody}`);
    }

    const metadata = await metadataResponse.json();
    const mediaResponse = await fetch(metadata.url, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    });

    if (!mediaResponse.ok) {
      const errorBody = await mediaResponse.text();
      throw new Error(`WhatsApp media download failed: ${mediaResponse.status} ${errorBody}`);
    }

    const arrayBuffer = await mediaResponse.arrayBuffer();
    const mimeType = metadata.mime_type || mediaResponse.headers.get('content-type') || 'audio/ogg';
    const extension = MIME_TYPE_EXTENSIONS[mimeType] || 'ogg';

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
      filename: `voice-note.${extension}`
    };
  }

  async sendTextMessage(to, body) {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp Cloud API is not configured.');
    }

    const response = await fetch(
      `https://graph.facebook.com/${DEFAULT_GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: this.truncateMessage(body)
          }
        })
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp send failed: ${response.status} ${errorBody}`);
    }

    return response.json();
  }

  truncateMessage(message) {
    const text = String(message || '').trim();
    if (text.length <= 4096) {
      return text;
    }

    return `${text.slice(0, 4090)}...`;
  }
}

module.exports = new WhatsAppService();