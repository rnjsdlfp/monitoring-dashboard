import { json } from '../../_lib/response.js';
import { sendTelegramMessage, toKST } from '../../_lib/settings.js';

export async function onRequestPost(context) {
  const body = await context.request.json();
  const botToken = body?.botToken || '';
  const chatId = body?.chatId || '';
  const text = `✅ Jireh's Dashboard 연결 테스트 성공!\n🕒 ${toKST(new Date())}`;

  try {
    const sent = await sendTelegramMessage(text, { botToken, chatId });

    if (!sent) {
      return json(
        {
          success: false,
          error: 'Bot Token 또는 Chat ID가 비어 있습니다.'
        },
        { status: 400 }
      );
    }

    return json({ success: true, message: '테스트 메시지가 발송되었습니다.' });
  } catch (error) {
    return json(
      {
        success: false,
        error: error.message || 'Telegram test failed'
      },
      { status: 400 }
    );
  }
}
