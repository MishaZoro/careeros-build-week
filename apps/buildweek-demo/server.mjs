import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCollection } from './lib/public-demo-validator.mjs';
import { analyzeRole } from './lib/analysis-engine.mjs';
import { aiWorkflowPilotFixture } from './data/growth-fixture.mjs';
import { transformAchievement, validateAchievement } from './lib/achievement-validator.mjs';
import { runGrowthLoop } from './lib/growth-loop.mjs';
import { nextAction } from './lib/next-action-engine.mjs';
import { careerHorizon } from './lib/career-horizon.mjs';
import { careerTrajectory } from './lib/career-trajectory.mjs';
import { detectPatterns } from './lib/pattern-detection.mjs';

const appRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const publicRoot = join(appRoot, 'public');
const curatedDataRoot = join(appRoot, 'data');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function safePublicPath(requestPath) {
  const requested = requestPath === '/' ? '/index.html' : requestPath;
  const candidate = normalize(join(publicRoot, requested));
  return candidate.startsWith(publicRoot) ? candidate : null;
}

async function jsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createAppServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ status: 'ok', mode: 'careeros-buildweek-final', data: 'local_only' }));
      return;
    }

    if (url.pathname === '/demo-data.json' && url.searchParams.get('dataset') === 'career-dna') {
      const evidencePath = join(curatedDataRoot, 'evidence.json');
      const rolesPath = join(curatedDataRoot, 'target-roles.json');
      if (!existsSync(evidencePath)) {
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ dataset: 'career-dna', label: 'Career DNA — pending individual approval', evidence: [], roles: [], rejected_count: 0, status: 'pending_approval' }));
        return;
      }
      const evidence = validateCollection(JSON.parse(await readFile(evidencePath, 'utf8')), 'evidence');
      const roles = existsSync(rolesPath) ? validateCollection(JSON.parse(await readFile(rolesPath, 'utf8')), 'role') : { accepted: [], rejected: [] };
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ dataset: 'career-dna', label: 'Approved Career DNA data', evidence: evidence.accepted, roles: roles.accepted, rejected_count: evidence.rejected.length + roles.rejected.length }));
      return;
    }

    if (url.pathname === '/analysis.json') {
      const evidencePath = join(curatedDataRoot, 'evidence.json');
      const rolesPath = join(curatedDataRoot, 'target-roles.json');
      if (!existsSync(evidencePath) || !existsSync(rolesPath)) {
        response.writeHead(409, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'Approved Career DNA data is unavailable.' }));
        return;
      }
      const evidence = validateCollection(JSON.parse(await readFile(evidencePath, 'utf8')), 'evidence').accepted;
      const roles = validateCollection(JSON.parse(await readFile(rolesPath, 'utf8')), 'role').accepted;
      const role = roles.find((item) => item.id === url.searchParams.get('role'));
      if (!role) {
        response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'Approved target role not found.' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(analyzeRole(role, evidence)));
      return;
    }
    if (url.pathname === '/forward-intelligence.json') {
      const roleId = url.searchParams.get('role');
      if (!roleId) {
        response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'A target role is required.' }));
        return;
      }

      const evidencePath = join(curatedDataRoot, 'evidence.json');
      const rolesPath = join(curatedDataRoot, 'target-roles.json');
      if (!existsSync(evidencePath) || !existsSync(rolesPath)) {
        response.writeHead(409, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'Approved Career DNA data is unavailable.' }));
        return;
      }

      try {
        const evidence = validateCollection(JSON.parse(await readFile(evidencePath, 'utf8')), 'evidence').accepted;
        const roles = validateCollection(JSON.parse(await readFile(rolesPath, 'utf8')), 'role').accepted;
        const role = roles.find((item) => item.id === roleId);
        if (!role) {
          response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ error: 'Prepared role not found.' }));
          return;
        }

        const selected = analyzeRole(role, evidence);
        const analyses = Object.fromEntries(roles.map((item) => [item.id, analyzeRole(item, evidence)]));
        const next = nextAction(selected, []);
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ horizon: careerHorizon(selected, next), trajectory: careerTrajectory(selected), patterns: detectPatterns(roles, analyses, evidence), next_action: next }));
      } catch (error) {
        console.error('Career Horizon request failed.', error);
        response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: 'Career Horizon is unavailable.' }));
      }
      return;
    }

    if (url.pathname === '/growth-fixture.json') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(aiWorkflowPilotFixture));
      return;
    }

    if (url.pathname === '/growth-loop.json' && request.method === 'POST') {
      try {
        const payload = await jsonBody(request);
        const evidence = validateCollection(JSON.parse(await readFile(join(curatedDataRoot, 'evidence.json'), 'utf8')), 'evidence').accepted;
        const roles = validateCollection(JSON.parse(await readFile(join(curatedDataRoot, 'target-roles.json'), 'utf8')), 'role').accepted;
        const role = roles.find((item) => item.id === payload.role_id);
        if (!role) throw new Error('Approved target role not found.');
        const ids = (payload.entries ?? []).map((entry) => entry.entry_id);
        if (new Set(ids).size !== ids.length) {
          response.writeHead(409, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ error: 'This achievement is already in the active Career DNA session.' }));
          return;
        }
        const validations = (payload.entries ?? []).map((entry) => ({ entry_id: entry.entry_id, ...validateAchievement(entry, roles) }));
        const failed = validations.filter((result) => !result.accepted);
        if (failed.length) {
          response.writeHead(422, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ validations, error: 'One or more achievements failed validation.' }));
          return;
        }
        const output = runGrowthLoop(role, evidence, payload.entries, (entry) => transformAchievement(entry, new Date().toISOString()));
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ validations, baseline_record_count: evidence.length, active_record_count: evidence.length + output.timeline.length, ...output }));
      } catch (error) {
        response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    const filePath = safePublicPath(decodeURIComponent(url.pathname));
    if (!filePath) {
      response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    try {
      const body = await readFile(filePath);
      response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const server = createAppServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`CareerOS Build Week scaffold listening at http://127.0.0.1:${port}`);
  });
}
