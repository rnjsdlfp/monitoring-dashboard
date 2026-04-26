import { json } from '../../_lib/response.js';
import { reorderProjects } from '../../_lib/projects.js';

export async function onRequestPut(context) {
  const body = await context.request.json();
  const result = await reorderProjects(context.env, body?.orderedIds);

  if (result.error) {
    return json({ error: result.error }, { status: result.status || 400 });
  }

  return json(result.projects);
}
