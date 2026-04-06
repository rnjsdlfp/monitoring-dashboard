const express = require('express');
const cors = require('cors');
const path = require('path');
const projectsRouter = require('./routes/projects');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 4000;
const clientDistPath = path.join(__dirname, '../client/dist');

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/settings', settingsRouter);

app.use(express.static(clientDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
