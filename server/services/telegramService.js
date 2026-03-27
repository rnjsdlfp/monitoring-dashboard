const fetch = require('node-fetch');
const { readSettings } = require('../lib/dataStore');
const { toKST } = require('../lib/time');

async function sendMessage(text, overrides = {}) {
  const settings = readSettings();
  const botToken = overrides.botToken ?? settings.telegram.botToken;
  const chatId = overrides.chatId ?? settings.telegram.chatId;

  if (!botToken || !chatId) {
    console.log('Telegram settings are missing. Skipping send.');
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Telegram API request failed');
  }

  return true;
}

async function sendImmediateAlert(projectName, type, status, message) {
  const settings = readSettings();

  if (!settings.reporting.immediateAlert.enabled) {
    return false;
  }

  const isRecovery = status === 'green';
  const title = isRecovery ? '[즉시알림] 복구됨' : '[즉시알림] 오류 발생';
  const details = isRecovery
    ? [
        `🔹 프로젝트: ${projectName}`,
        `📍 항목: ${type}`,
        `⏰ 복구시간: ${toKST(new Date())}`
      ]
    : [
        `🔹 프로젝트: ${projectName}`,
        `📍 항목: ${type}`,
        `⚠️ 상태: ${message}`,
        `⏰ 시간: ${toKST(new Date())}`
      ];

  try {
    return await sendMessage(`🚨 <b>${title}</b>\n\n${details.join('\n')}`);
  } catch (error) {
    console.error('Failed to send Telegram immediate alert:', error.message);
    return false;
  }
}

module.exports = {
  sendMessage,
  sendImmediateAlert
};
