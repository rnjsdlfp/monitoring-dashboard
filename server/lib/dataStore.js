const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = {
  projects: path.join(dataDir, 'projects.json'),
  heartbeats: path.join(dataDir, 'heartbeats.json'),
  settings: path.join(dataDir, 'settings.json'),
  eventLog: path.join(dataDir, 'eventLog.json')
};

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

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJson(filePath, fallback) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function readProjects() {
  const projects = readJson(files.projects, []);
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects
    .slice()
    .sort((left, right) => (left.no || 0) - (right.no || 0));
}

function writeProjects(projects) {
  writeJson(files.projects, projects);
}

function readHeartbeats() {
  const heartbeats = readJson(files.heartbeats, {});
  return heartbeats && typeof heartbeats === 'object' && !Array.isArray(heartbeats)
    ? heartbeats
    : {};
}

function writeHeartbeats(heartbeats) {
  writeJson(files.heartbeats, heartbeats);
}

function readSettings() {
  const settings = readJson(files.settings, defaultSettings);
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

function writeSettings(settings) {
  writeJson(files.settings, {
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
  });
}

function readEventLog() {
  const events = readJson(files.eventLog, []);
  return Array.isArray(events) ? events : [];
}

function writeEventLog(events) {
  writeJson(files.eventLog, events);
}

function appendEventLog(entry) {
  const events = readEventLog();
  events.push(entry);

  while (events.length > 1000) {
    events.shift();
  }

  writeEventLog(events);
}

module.exports = {
  files,
  defaultSettings,
  readProjects,
  writeProjects,
  readHeartbeats,
  writeHeartbeats,
  readSettings,
  writeSettings,
  readEventLog,
  writeEventLog,
  appendEventLog
};
