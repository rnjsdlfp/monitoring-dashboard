import { deleteProject, updateProject } from '../../_lib/projects.js';
import { json } from '../../_lib/response.js';

export async function onRequestPut(context) {
  const body = await context.request.json();
  const project = await updateProject(context.env, context.params.id, body);

  if (!project) {
    return json({ error: 'Project not found' }, { status: 404 });
  }

  return json(project);
}

export async function onRequestDelete(context) {
  const deleted = await deleteProject(context.env, context.params.id);

  if (!deleted) {
    return json({ error: 'Project not found' }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
