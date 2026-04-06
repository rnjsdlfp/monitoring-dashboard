import { useEffect, useState } from 'react';

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    }

    loadSettings();
  }, []);

  useEffect(() => {
    if (!testResult) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setTestResult(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [testResult]);

  async function handleTelegramSave() {
    setSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      setSettings(data);
    } finally {
      setSaving(false);
    }
  }

  async function handleTelegramTest() {
    const response = await fetch('/api/settings/test-telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        botToken: settings.telegram.botToken,
        chatId: settings.telegram.chatId
      })
    });

    const data = await response.json();

    if (response.ok) {
      setTestResult({ success: true, message: data.message });
      return;
    }

    setTestResult({ success: false, message: `발송 실패: ${data.error}` });
  }

  if (!settings) {
    return (
      <section className="min-h-full p-6 md:p-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white/90 p-8 text-sm text-slate-500 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted">
          설정을 불러오는 중입니다...
        </div>
      </section>
    );
  }

  const inputClassName =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-dark-border dark:bg-slate-900 dark:text-dark-text';

  return (
    <section className="min-h-full p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-text">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-dark-muted">
            현재는 Telegram 연결 설정만 관리합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text">
            Telegram 알림 설정
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Bot Token</span>
              <input
                type="password"
                placeholder="123456789:ABCdef..."
                className={inputClassName}
                value={settings.telegram.botToken}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    telegram: { ...current.telegram, botToken: event.target.value }
                  }))
                }
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-dark-text">Chat ID</span>
              <input
                type="text"
                placeholder="-1001234567890"
                className={inputClassName}
                value={settings.telegram.chatId}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    telegram: { ...current.telegram, chatId: event.target.value }
                  }))
                }
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTelegramSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={handleTelegramTest}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-dark-border dark:text-dark-text dark:hover:bg-slate-900"
            >
              테스트 발송
            </button>
            {testResult ? (
              <span
                className={`text-sm font-medium ${
                  testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {testResult.message}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
