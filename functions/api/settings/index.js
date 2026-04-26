import { json } from '../../_lib/response.js';
import { readSettings, writeSettings } from '../../_lib/settings.js';

export async function onRequestGet(context) {
  return json(await readSettings(context.env));
}

export async function onRequestPut(context) {
  const body = await context.request.json();
  const settings = await writeSettings(context.env, body || {});
  return json(settings);
}
