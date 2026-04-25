const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readProjects, writeProjects } = require('../lib/dataStore');

const router = express.Router();

function normalizeProjectInput(body = {}) {
  return {
    name: body.name || '',
    description: body.description || '',
    outputFormat: body.outputFormat || '',
    serverLocation: body.serverLocation || '',
    url: body.url || '',
    adminUrl: body.adminUrl || '',
    techStack: Array.isArray(body.techStack) ? body.techStack : []
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
    ...normalizeProjectInput(req.body),
    createdAt: now
  };

  projects.push(project);
  writeProjects(projects);
  res.status(201).json(project);
});

router.put('/reorder', (req, res) => {
  const projects = readProjects();
  const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : null;

  if (!orderedIds) {
    return res.status(400).json({ error: 'orderedIds must be an array' });
  }

  if (orderedIds.length !== projects.length) {
    return res.status(400).json({ error: 'orderedIds length mismatch' });
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    return res.status(400).json({ error: 'orderedIds must be unique' });
  }

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const reorderedProjects = orderedIds.map((id) => projectMap.get(id)).filter(Boolean);

  if (reorderedProjects.length !== projects.length) {
    return res.status(400).json({ error: 'orderedIds contains unknown project id' });
  }

  writeProjects(reorderedProjects);
  return res.json(readProjects());
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
    ...normalizeProjectInput(req.body)
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
