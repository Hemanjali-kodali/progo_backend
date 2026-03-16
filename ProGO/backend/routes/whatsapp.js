const express = require('express');
const router = express.Router();

const chatbotController = require('../controllers/chatbotController');
const whatsappService = require('../services/whatsappService');

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: whatsappService.getConfigurationStatus()
  });
});

router.get('/webhook', (req, res) => {
  const result = whatsappService.verifyWebhook(
    req.query['hub.mode'],
    req.query['hub.verify_token'],
    req.query['hub.challenge']
  );

  if (!result.success) {
    return res.sendStatus(403);
  }

  return res.status(200).send(result.challenge);
});

router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const incomingMessages = whatsappService.extractMessages(req.body);

    for (const incomingMessage of incomingMessages) {
      const messageText = whatsappService.getMessageText(incomingMessage);
      if (!messageText) {
        continue;
      }

      const student = await chatbotController.getStudentFromPhoneNumber(incomingMessage.from);

      if (!student) {
        await whatsappService.sendTextMessage(
          incomingMessage.from,
          'Your WhatsApp number is not linked to any student or parent profile in ProGO. Please contact the administrator to register this number.'
        );
        continue;
      }

      const response = await chatbotController.processMessageForStudent({
        message: messageText,
        student,
        sessionId: `whatsapp:${incomingMessage.from}`
      });

      await whatsappService.sendTextMessage(incomingMessage.from, response.message);
    }
  } catch (error) {
    console.error('WhatsApp webhook processing failed:', error.message);
  }
});

module.exports = router;