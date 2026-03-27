const express = require('express');
const {
  readHeartbeats,
  writeHeartbeats,
  readProjects,
  writeProjects,
  appendEventLog
} = require('../lib/dataStore');

const router = express.Router();

router.post('/heartbeat', (req, res) => {
  const { project, job, status } = req.body || {};

  if (!project) {
    return res.status(400).json({ error: 'project is required' });
  }

  const now = new Date().toISOString();
  const heartbeats = readHeartbeats();
  heartbeats[project] = {
    lastReceived: now,
    lastStatus: status || 'success',
    jobName: job || ''
  };
  writeHeartbeats(heartbeats);

  const projects = readProjects();
  const index = projects.findIndex((item) => item.id === project);

  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      status: {
        ...projects[index].status,
        schedule: status === 'failed' ? 'red' : 'green',
        lastUpdated: now
      }
    };
    writeProjects(projects);

    if (status === 'success') {
      appendEventLog({
        timestamp: now,
        projectId: projects[index].id,
        projectName: projects[index].name,
        type: 'schedule_success',
        status: 'green',
        message: `Heartbeat received from ${job || 'schedule job'}`,
        resolved: true,
        resolvedAt: now
      });
    }
  }

  return res.json({ message: 'heartbeat received' });
});

module.exports = router;
