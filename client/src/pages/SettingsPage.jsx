import { useEffect, useState } from 'react';
import { FiCheck, FiCopy, FiLoader } from 'react-icons/fi';

function ToggleButton({ checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  async function persistSettings(nextSettings, showSaving = false) {
    if (showSaving) {
      setSaving(true);
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nextSettings)
      });
      const data = await response.json();
      setSettings(data);
      return data;
    } finally {
      if (showSaving) {
        setSaving(false);
      }
    }
  }

  async function handleTelegramSave() {
    await persistSettings(settings, true);
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

  async function handleToggle(section, key) {
    const nextSettings = {
      ...settings,
      reporting: {
        ...settings.reporting,
        [section]: {
          ...settings.reporting[section],
          [key]: !settings.reporting[section][key]
        }
      }
    };

    setSettings(nextSettings);
    await persistSettings(nextSettings);
  }

  async function handleDailyHourChange(hour) {
    const nextSettings = {
      ...settings,
      reporting: {
        ...settings.reporting,
        dailyReport: {
          ...settings.reporting.dailyReport,
          sendHourKST: Number(hour)
        }
      }
    };

    setSettings(nextSettings);
    await persistSettings(nextSettings);
  }

  async function handleManualCheck() {
    setChecking(true);

    try {
      await fetch('/api/monitor/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{}'
      });
      setLastCheckTime(new Date());
      window.dispatchEvent(new Event('projects-updated'));
    } finally {
      setChecking(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}/api/heartbeat`);
    setCopied(true);
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
            Telegram 알림, 리포팅, 수동 모니터링 실행, heartbeat API 정보를 관리합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text">Telegram 알림 설정</h2>
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

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text">Reporting 설정</h2>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4 dark:border-dark-border">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-dark-text">즉시발송</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-dark-muted">
                  Server / Schedule / DB 오류와 복구를 Telegram으로 바로 보냅니다.
                </p>
              </div>
              <ToggleButton
                checked={settings.reporting.immediateAlert.enabled}
                onToggle={() => handleToggle('immediateAlert', 'enabled')}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-4 dark:border-dark-border">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-dark-text">Daily Report</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-dark-muted">
                  최근 24시간 요약을 KST 기준 정해진 시간에 보냅니다.
                </p>
              </div>
              <ToggleButton
                checked={settings.reporting.dailyReport.enabled}
                onToggle={() => handleToggle('dailyReport', 'enabled')}
              />
            </div>

            {settings.reporting.dailyReport.enabled ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-dark-text">
                  발송 시각 (KST)
                </span>
                <select
                  className={inputClassName}
                  value={settings.reporting.dailyReport.sendHourKST}
                  onChange={(event) => handleDailyHourChange(event.target.value)}
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {hour}:00
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text">모니터링</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-dark-muted">
            서버 상태는 5분마다 자동 체크되며, 아래 버튼으로 즉시 실행할 수도 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? <FiLoader className="animate-spin" /> : null}
              {checking ? '체크 중...' : '지금 즉시 체크'}
            </button>
            {lastCheckTime ? (
              <span className="text-sm text-slate-500 dark:text-dark-muted">
                마지막 수동 체크: {lastCheckTime.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-dark-text">API 정보</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-dark-muted">
            각 프로젝트의 cron job 마지막에 아래 URL로 POST 요청을 보내면 됩니다.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-slate-950/50">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <code className="break-all text-sm text-slate-700 dark:text-dark-text">
                POST {window.location.origin}/api/heartbeat
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-dark-border dark:text-dark-text dark:hover:bg-slate-900"
              >
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-slate-950/50">
            <pre className="overflow-auto text-sm text-slate-700 dark:text-dark-text">{`{
  "project": "프로젝트 UUID",
  "job": "job이름",
  "status": "success"
}`}</pre>
          </div>

          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">대시보드 버전: v1.0.0</p>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
