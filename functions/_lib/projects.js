function normalizeTechStack(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProjectInput(body = {}) {
  return {
    name: body.name || '',
    description: body.description || '',
    outputFormat: body.outputFormat || '',
    serverLocation: body.serverLocation || '',
    url: body.url || '',
    adminUrl: body.adminUrl || '',
    techStack: normalizeTechStack(body.techStack)
  };
}

function mapProjectRow(row, index) {
  let techStack = [];

  try {
    techStack = JSON.parse(row.tech_stack || '[]');
  } catch (error) {
    techStack = [];
  }

  return {
    id: row.id || '',
    no: index + 1,
    name: row.name || '',
    description: row.description || '',
    outputFormat: row.output_format || '',
    serverLocation: row.server_location || '',
    url: row.url || '',
    adminUrl: row.admin_url || '',
    techStack: normalizeTechStack(techStack),
    createdAt: row.created_at || ''
  };
}

async function queryProjectRows(env) {
  const result = await env.DB.prepare(
    `SELECT id, order_index, name, description, output_format, server_location, url, admin_url, tech_stack, created_at
     FROM projects
     ORDER BY order_index ASC, created_at ASC`
  ).all();

  return Array.isArray(result.results) ? result.results : [];
}

export async function readProjects(env) {
  const rows = await queryProjectRows(env);
  return rows.map((row, index) => mapProjectRow(row, index));
}

export async function createProject(env, body) {
  const project = normalizeProjectInput(body);
  const currentProjects = await readProjects(env);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO projects (
      id, order_index, name, description, output_format, server_location, url, admin_url, tech_stack, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      currentProjects.length + 1,
      project.name,
      project.description,
      project.outputFormat,
      project.serverLocation,
      project.url,
      project.adminUrl,
      JSON.stringify(project.techStack),
      createdAt
    )
    .run();

  return {
    id,
    no: currentProjects.length + 1,
    ...project,
    createdAt
  };
}

export async function updateProject(env, id, body) {
  const existing = await env.DB.prepare(
    `SELECT id, order_index, created_at
     FROM projects
     WHERE id = ?`
  )
    .bind(id)
    .first();

  if (!existing) {
    return null;
  }

  const project = normalizeProjectInput(body);

  await env.DB.prepare(
    `UPDATE projects
     SET name = ?, description = ?, output_format = ?, server_location = ?, url = ?, admin_url = ?, tech_stack = ?
     WHERE id = ?`
  )
    .bind(
      project.name,
      project.description,
      project.outputFormat,
      project.serverLocation,
      project.url,
      project.adminUrl,
      JSON.stringify(project.techStack),
      id
    )
    .run();

  return {
    id,
    no: Number(existing.order_index) || 1,
    ...project,
    createdAt: existing.created_at || ''
  };
}

export async function deleteProject(env, id) {
  const existing = await env.DB.prepare('SELECT id FROM projects WHERE id = ?').bind(id).first();

  if (!existing) {
    return false;
  }

  await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  await renumberProjects(env);
  return true;
}

async function renumberProjects(env) {
  const rows = await env.DB.prepare(
    `SELECT id
     FROM projects
     ORDER BY order_index ASC, created_at ASC`
  ).all();

  const orderedRows = Array.isArray(rows.results) ? rows.results : [];

  if (!orderedRows.length) {
    return;
  }

  await env.DB.batch(
    orderedRows.map((row, index) =>
      env.DB.prepare('UPDATE projects SET order_index = ? WHERE id = ?').bind(index + 1, row.id)
    )
  );
}

export async function reorderProjects(env, orderedIds) {
  const currentProjects = await readProjects(env);

  if (!Array.isArray(orderedIds)) {
    return { error: 'orderedIds must be an array', status: 400 };
  }

  if (orderedIds.length !== currentProjects.length) {
    return { error: 'orderedIds length mismatch', status: 400 };
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    return { error: 'orderedIds must be unique', status: 400 };
  }

  const currentIds = new Set(currentProjects.map((project) => project.id));
  const hasUnknownId = orderedIds.some((id) => !currentIds.has(id));

  if (hasUnknownId) {
    return { error: 'orderedIds contains unknown project id', status: 400 };
  }

  await env.DB.batch(
    orderedIds.map((id, index) =>
      env.DB.prepare('UPDATE projects SET order_index = ? WHERE id = ?').bind(index + 1, id)
    )
  );

  return { projects: await readProjects(env) };
}
