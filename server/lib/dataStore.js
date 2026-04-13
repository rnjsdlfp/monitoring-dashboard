const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const files = {
  projects: path.join(dataDir, 'projects.json'),
  settings: path.join(dataDir, 'settings.json')
};

const defaultSettings = {
  telegram: { botToken: '', chatId: '' },
  reporting: {
    immediateAlert: { enabled: false },
    dailyReport: { enabled: false, sendHourKST: 9 }
  }
};

function sanitizeProject(project = {}, index = 0) {
  return {
    id: project.id || '',
    no: Number(project.no) || index + 1,
    name: project.name || '',
    description: project.description || '',
    outputFormat: project.outputFormat || '',
    serverLocation: project.serverLocation || '',
    url: project.url || '',
    adminUrl: project.adminUrl || '',
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    createdAt: project.createdAt || ''
  };
}

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
    .sort((left, right) => (left.no || 0) - (right.no || 0))
    .map((project, index) => sanitizeProject(project, index));
}

function writeProjects(projects) {
  const normalizedProjects = Array.isArray(projects)
    ? projects.map((project, index) => sanitizeProject(project, index))
    : [];
  writeJson(files.projects, normalizedProjects);
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

module.exports = {
  files,
  defaultSettings,
  readProjects,
  writeProjects,
  readSettings,
  writeSettings
};
