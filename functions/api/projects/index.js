import { createProject, readProjects } from '../../_lib/projects.js';
import { json } from '../../_lib/response.js';

export async function onRequestGet(context) {
  return json(await readProjects(context.env));
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const project = await createProject(context.env, body);
  return json(project, { status: 201 });
}
