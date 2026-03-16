const DEFAULT_GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v21.0';

class WhatsAppService {
  isConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  getConfigurationStatus() {
    return {
      hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      hasVerifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      graphApiVersion: DEFAULT_GRAPH_API_VERSION,
      webhookPath: '/api/whatsapp/webhook',
      ready: Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN
        && process.env.WHATSAPP_PHONE_NUMBER_ID
        && process.env.WHATSAPP_VERIFY_TOKEN
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