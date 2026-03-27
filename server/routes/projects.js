const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readProjects, writeProjects } = require('../lib/dataStore');

const router = express.Router();

function buildInitialStatus(project) {
  return {
    server: 'green',
    schedule: project.hasSchedule ? 'green' : 'na',
    db: project.hasDb ? 'green' : 'na',
    lastUpdated: new Date().toISOString()
  };
}

router.get('/', (req, res) => {
  res.json(readProjects());
});

router.post('/', (req, res) => {
  const projects = readProjects();
  const now = new Date().toISOString();
  const project = {
    id: uuidv4(),
    no: projects.length + 1,
    name: req.body.name || '',
    description: req.body.description || '',
    outputFormat: req.body.outputFormat || '',
    serverLocation: req.body.serverLocation || '',
    url: req.body.url || '',
    healthEndpoint: req.body.healthEndpoint || '',
    hasSchedule: Boolean(req.body.hasSchedule),
    scheduleIntervalHours: Number(req.body.scheduleIntervalHours || 24),
    hasDb: Boolean(req.body.hasDb),
    techStack: Array.isArray(req.body.techStack) ? req.body.techStack : [],
    status: buildInitialStatus(req.body),
    createdAt: now
  };

  projects.push(project);
  writeProjects(projects);
  res.status(201).json(project);
});

router.put('/:id', (req, res) => {
  const projects = readProjects();
  const index = projects.findIndex((project) => project.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const currentProject = projects[index];
  const updatedProject = {
    ...currentProject,
    name: req.body.name || '',
    description: req.body.description || '',
    outputFormat: req.body.outputFormat || '',
    serverLocation: req.body.serverLocation || '',
    url: req.body.url || '',
    healthEndpoint: req.body.healthEndpoint || '',
    hasSchedule: Boolean(req.body.hasSchedule),
    scheduleIntervalHours: Number(req.body.scheduleIntervalHours || 24),
    hasDb: Boolean(req.body.hasDb),
    techStack: Array.isArray(req.body.techStack) ? req.body.techStack : [],
    status: {
      ...currentProject.status,
      schedule: req.body.hasSchedule
        ? currentProject.status.schedule === 'na'
          ? 'green'
          : currentProject.status.schedule
        : 'na',
      db: req.body.hasDb
        ? currentProject.status.db === 'na'
          ? 'green'
          : currentProject.status.db
        : 'na'
    }
  };

  projects[index] = updatedProject;
  writeProjects(projects);
  return res.json(updatedProject);
});

router.delete('/:id', (req, res) => {
  const projects = readProjects();
  const filteredProjects = projects
    .filter((project) => project.id !== req.params.id)
    .map((project, index) => ({
      ...project,
      no: index + 1
    }));

  if (filteredProjects.length === projects.length) {
    return res.status(404).json({ error: 'Project not found' });
  }

  writeProjects(filteredProjects);
  return res.status(204).send();
});

module.exports = router;
