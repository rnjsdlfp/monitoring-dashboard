const fetch = require('node-fetch');
const {
  readProjects,
  writeProjects,
  readHeartbeats,
  readEventLog,
  writeEventLog,
  appendEventLog
} = require('../lib/dataStore');
const { sendImmediateAlert } = require('./telegramService');

let intervalId = null;

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function checkServer(url) {
  if (!url) {
    return 'red';
  }

  const startedAt = Date.now();

  try {
    const response = await fetchWithTimeout(url);
    const duration = Date.now() - startedAt;

    if (response.status >= 200 && response.status < 400) {
      return duration <= 2000 ? 'green' : 'yellow';
    }

    return 'red';
  } catch (error) {
    return 'red';
  }
}

async function checkDb(healthEndpoint) {
  if (!healthEndpoint) {
    return 'na';
  }

  try {
    const response = await fetchWithTimeout(healthEndpoint);

    if (!response.ok) {
      return 'red';
    }

    const payload = await response.json();

    if (!Object.prototype.hasOwnProperty.call(payload, 'db')) {
      return 'red';
    }

    return payload.db === 'ok' ? 'green' : 'yellow';
  } catch (error) {
    return 'red';
  }
}

function checkSchedule(project) {
  if (!project.hasSchedule) {
    return 'na';
  }

  const heartbeats = readHeartbeats();
  const heartbeat = heartbeats[project.id];

  if (!heartbeat?.lastReceived) {
    return 'yellow';
  }

  const elapsedMs = Date.now() - new Date(heartbeat.lastReceived).getTime();
  const intervalHours = Number(project.scheduleIntervalHours) || 24;
  const warningMs = intervalHours * 1.5 * 60 * 60 * 1000;
  const redMs = 24 * 60 * 60 * 1000;

  if (elapsedMs >= redMs) {
    return 'red';
  }

  if (elapsedMs >= warningMs) {
    return 'yellow';
  }

  return 'green';
}

function resolveOutstandingEvents(projectId, eventType) {
  const events = readEventLog();
  let changed = false;
  const resolvedAt = new Date().toISOString();

  const updatedEvents = events.map((event) => {
    if (event.projectId === projectId && event.type === eventType && event.resolved === false) {
      changed = true;
      return {
        ...event,
        resolved: true,
        resolvedAt
      };
    }

    return event;
  });

  if (changed) {
    writeEventLog(updatedEvents);
  }
}

function getEventMeta(key) {
  const map = {
    server: {
      errorType: 'server_error',
      recoveredType: 'server_recovered',
      label: 'Server'
    },
    schedule: {
      errorType: 'schedule_error',
      recoveredType: 'schedule_recovered',
      label: 'Schedule'
    },
    db: {
      errorType: 'db_error',
      recoveredType: 'db_recovered',
      label: 'DB'
    }
  };

  return map[key];
}

function getStatusMessage(key, status) {
  if (key === 'server') {
    if (status === 'red') return '서버 응답 없음 또는 오류';
    if (status === 'yellow') return '서버 응답이 느립니다';
  }

  if (key === 'schedule') {
    if (status === 'red') return '스케줄 heartbeat가 24시간 이상 없습니다';
    if (status === 'yellow') return '스케줄 heartbeat가 지연되고 있습니다';
  }

  if (key === 'db') {
    if (status === 'red') return 'DB 상태 확인에 실패했습니다';
    if (status === 'yellow') return 'DB 응답은 있으나 정상 상태가 아닙니다';
  }

  return '상태 변경이 감지되었습니다';
}

async function processStatusTransitions(previousProject, nextProject) {
  const keys = ['server', 'schedule', 'db'];

  for (const key of keys) {
    const previousStatus = previousProject?.status?.[key];
    const nextStatus = nextProject.status[key];
    const meta = getEventMeta(key);

    if (!meta || previousStatus === nextStatus) {
      continue;
    }

    if ((previousStatus === 'green' || previousStatus === 'yellow') && nextStatus === 'red') {
      const message = getStatusMessage(key, nextStatus);
      appendEventLog({
        timestamp: new Date().toISOString(),
        projectId: nextProject.id,
        projectName: nextProject.name,
        type: meta.errorType,
        status: nextStatus,
        message,
        resolved: false,
        resolvedAt: null
      });

      await sendImmediateAlert(nextProject.name, meta.label, nextStatus, message);
    }

    if (previousStatus === 'red' && nextStatus === 'green') {
      resolveOutstandingEvents(nextProject.id, meta.errorType);

      appendEventLog({
        timestamp: new Date().toISOString(),
        projectId: nextProject.id,
        projectName: nextProject.name,
        type: meta.recoveredType,
        status: nextStatus,
        message: `${meta.label} 상태가 복구되었습니다`,
        resolved: true,
        resolvedAt: new Date().toISOString()
      });

      await sendImmediateAlert(nextProject.name, meta.label, nextStatus, `${meta.label} 상태가 복구되었습니다`);
    }
  }
}

async function runOnce() {
  const projects = readProjects();

  const updatedProjects = await Promise.all(
    projects.map(async (project) => {
      const [serverStatus, dbStatus] = await Promise.all([
        checkServer(project.url),
        checkDb(project.healthEndpoint)
      ]);

      const scheduleStatus = checkSchedule(project);

      const nextProject = {
        ...project,
        status: {
          server: serverStatus,
          schedule: project.hasSchedule ? scheduleStatus : 'na',
          db: project.hasDb ? dbStatus : 'na',
          lastUpdated: new Date().toISOString()
        }
      };

      await processStatusTransitions(project, nextProject);

      return nextProject;
    })
  );

  writeProjects(updatedProjects);
  return updatedProjects;
}

function start() {
  if (intervalId) {
    return;
  }

  runOnce().catch((error) => {
    console.error('Initial monitor run failed:', error.message);
  });

  intervalId = setInterval(() => {
    runOnce().catch((error) => {
      console.error('Scheduled monitor run failed:', error.message);
    });
  }, 5 * 60 * 1000);
}

module.exports = {
  start,
  runOnce,
  checkServer,
  checkDb,
  checkSchedule
};
