const express = require('express');
const { readSettings, writeSettings } = require('../lib/dataStore');
const { toKST } = require('../lib/time');
const { sendMessage } = require('../services/telegramService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(readSettings());
});

router.put('/', (req, res) => {
  writeSettings(req.body || {});
  res.json(readSettings());
});

router.post('/test-telegram', async (req, res) => {
  const { botToken = '', chatId = '' } = req.body || {};
  const text = `✅ Jireh's Dashboard 연결 테스트 성공!\n⏰ ${toKST(new Date())}`;

  try {
    const sent = await sendMessage(text, { botToken, chatId });

    if (!sent) {
      return res.status(400).json({
        success: false,
        error: 'Bot Token 또는 Chat ID가 비어 있습니다.'
      });
    }

    res.json({ success: true, message: '테스트 메시지가 발송되었습니다.' });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Telegram test failed'
    });
  }
});

module.exports = router;
