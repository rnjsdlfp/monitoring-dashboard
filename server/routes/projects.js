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
