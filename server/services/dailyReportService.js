const { readProjects, readEventLog, writeEventLog, readSettings } = require('../lib/dataStore');
const { getKSTParts, subtractHours } = require('../lib/time');
const { sendMessage } = require('./telegramService');

let intervalId = null;
let lastSentDate = null;

function getProjectCounters(projectId, events) {
  return events.reduce(
    (summary, event) => {
      if (event.projectId !== projectId) {
        return summary;
      }

      if (['server_error', 'db_error', 'schedule_error'].includes(event.type)) {
        summary.errors += 1;
      }

      if (['server_recovered', 'db_recovered', 'schedule_recovered'].includes(event.type)) {
        summary.recoveries += 1;
      }

      if (event.type === 'schedule_success') {
        summary.scheduleSuccess += 1;
      }

      return summary;
    },
    { errors: 0, recoveries: 0, scheduleSuccess: 0 }
  );
}

function statusIcon(status) {
  if (status === 'green') return '🟢';
  if (status === 'yellow') return '🟡';
  if (status === 'red') return '🔴';
  return '⚪';
}

async function sendDailyReport(now = new Date()) {
  const projects = readProjects();
  const allEvents = readEventLog();
  const since = subtractHours(now, 24);
  const recentEvents = allEvents.filter((event) => new Date(event.timestamp) >= since);

  const projectLines = projects.map((project) => {
    const counters = getProjectCounters(project.id, recentEvents);
    const status = project.status || {};

    return [
      `• ${project.name}: Server ${statusIcon(status.server)} / Schedule ${statusIcon(project.hasSchedule ? status.schedule : 'na')} / DB ${statusIcon(project.hasDb ? status.db : 'na')}`,
      `  오류: ${counters.errors}건 | 복구: ${counters.recoveries}건 | 스케줄 성공: ${counters.scheduleSuccess}회`
    ].join('\n');
  });

  const total = recentEvents.reduce(
    (summary, event) => {
      if (['server_error', 'db_error', 'schedule_error'].includes(event.type)) summary.errors += 1;
      if (['server_recovered', 'db_recovered', 'schedule_recovered'].includes(event.type)) summary.recoveries += 1;
      if (event.type === 'schedule_success') summary.scheduleSuccess += 1;
      return summary;
    },
    { errors: 0, recoveries: 0, scheduleSuccess: 0 }
  );

  const currentErrorProjects = projects.filter((project) => {
    const status = project.status || {};
    return status.server === 'red' || status.schedule === 'red' || status.db === 'red';
  }).length;

  const kstNow = getKSTParts(now);
  const message = [
    '📤 <b>Daily Report</b>',
    `🗓 ${kstNow.date} ${String(kstNow.hour).padStart(2, '0')}:00 KST 기준`,
    '',
    '📌 <b>프로젝트 현황</b>',
    projectLines.length ? projectLines.join('\n') : '등록된 프로젝트가 없습니다.',
    '',
    '📊 <b>전체 요약</b>',
    `• 총 오류 발생: ${total.errors}건`,
    `• 총 복구: ${total.recoveries}건`,
    `• 총 스케줄 성공: ${total.scheduleSuccess}회`,
    `• 현재 오류 상태 프로젝트: ${currentErrorProjects}개`,
    '• 신호등 표시: 🟢 정상 / 🟡 경고 / 🔴 오류 / ⚪ N/A'
  ].join('\n');

  try {
    const sent = await sendMessage(message);

    if (!sent) {
      return false;
    }
  } catch (error) {
    console.error('Failed to send daily report:', error.message);
    return false;
  }

  const remainingEvents = allEvents.filter((event) => new Date(event.timestamp) > since);
  writeEventLog(remainingEvents);
  lastSentDate = kstNow.date;
  return true;
}

function start() {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(() => {
    const settings = readSettings();

    if (!settings.reporting.dailyReport.enabled) {
      return;
    }

    const now = new Date();
    const kst = getKSTParts(now);

    if (
      kst.hour === settings.reporting.dailyReport.sendHourKST &&
      kst.minute === 0 &&
      lastSentDate !== kst.date
    ) {
      sendDailyReport(now).catch((error) => {
        console.error('Daily report run failed:', error.message);
      });
    }
  }, 60 * 1000);
}

module.exports = {
  start,
  sendDailyReport
};
