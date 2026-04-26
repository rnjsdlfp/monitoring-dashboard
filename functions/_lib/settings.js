const defaultSettings = {
  telegram: { botToken: '', chatId: '' },
  reporting: {
    immediateAlert: { enabled: false },
    dailyReport: { enabled: false, sendHourKST: 9 }
  }
};

function normalizeHour(value) {
  const hour = Number(value);

  if (Number.isNaN(hour)) {
    return 9;
  }

  if (hour < 0) {
    return 0;
  }

  if (hour > 23) {
    return 23;
  }

  return Math.floor(hour);
}

export function normalizeSettings(settings) {
  return {
    telegram: {
      botToken: settings?.telegram?.botToken || '',
      chatId: settings?.telegram?.chatId || ''
    },
    reporting: {
      immediateAlert: {
        enabled: Boolean(settings?.reporting?.immediateAlert?.enabled)
      },
      dailyReport: {
        enabled: Boolean(settings?.reporting?.dailyReport?.enabled),
        sendHourKST: normalizeHour(settings?.reporting?.dailyReport?.sendHourKST)
      }
    }
  };
}

export async function readSettings(env) {
  const row = await env.DB.prepare('SELECT value FROM app_kv WHERE key = ?')
    .bind('settings')
    .first();

  if (!row?.value) {
    return defaultSettings;
  }

  try {
    return normalizeSettings(JSON.parse(row.value));
  } catch (error) {
    return defaultSettings;
  }
}

export async function writeSettings(env, settings) {
  const normalized = normalizeSettings(settings);

  await env.DB.prepare(
    `INSERT INTO app_kv (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )
    .bind('settings', JSON.stringify(normalized))
    .run();

  return normalized;
}

export function toKST(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

export async function sendTelegramMessage(text, { botToken = '', chatId = '' }) {
  if (!botToken || !chatId) {
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
