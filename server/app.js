const express = require('express');
const cors = require('cors');
const path = require('path');
const projectsRouter = require('./routes/projects');
const heartbeatRouter = require('./routes/heartbeat');
const settingsRouter = require('./routes/settings');
const monitorService = require('./services/monitorService');
const dailyReportService = require('./services/dailyReportService');

const app = express();
const PORT = process.env.PORT || 4000;
const clientDistPath = path.join(__dirname, '../client/dist');

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api', heartbeatRouter);
app.use('/api/settings', settingsRouter);
app.post('/api/monitor/run', async (req, res) => {
  try {
    const projects = await monitorService.runOnce();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Monitor run failed' });
  }
});

app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  monitorService.start();
  dailyReportService.start();
});

module.exports = app;
