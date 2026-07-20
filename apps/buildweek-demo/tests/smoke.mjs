import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAppServer } from '../server.mjs';

const server = createAppServer();
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const { port } = server.address();
  const shell = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(shell.status, 200, 'shell should render');
  assert.match(await shell.text(), /Your career is more than a resume/, 'shell should render the Milestone 6 command center');

  const health = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(health.status, 200, 'health endpoint should pass');
  assert.deepEqual(await health.json(), { status: 'ok', mode: 'careeros-buildweek-final', data: 'local_only' });

  const careerDna = await fetch(`http://127.0.0.1:${port}/demo-data.json?dataset=career-dna`);
  const careerPayload = await careerDna.json();
  assert.equal(careerPayload.evidence.length, 18, 'only approved Career DNA should enter the app');
  assert.equal(careerPayload.roles.length, 3, 'only approved roles should enter the app');
  const analysis = await fetch(`http://127.0.0.1:${port}/analysis.json?role=ROLE-001`);
  assert.equal(analysis.status, 200, 'approved role analysis should load');
  const analysisPayload = await analysis.json();
  assert.equal(analysisPayload.role.id, 'ROLE-001');
  assert.equal(Array.isArray(analysisPayload.groups.direct), true, 'analysis should group direct evidence');
  const fixture = await (await fetch(`http://127.0.0.1:${port}/growth-fixture.json`)).json();
  const growth = await fetch(`http://127.0.0.1:${port}/growth-loop.json`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role_id: 'ROLE-003', entries: [fixture] }) });
  assert.equal(growth.status, 200, 'growth loop should accept the synthetic fixture');
  const growthPayload = await growth.json();
  assert.equal(growthPayload.active_record_count, 19, 'session evidence should expand only active Career DNA');
  const duplicate = await fetch(`http://127.0.0.1:${port}/growth-loop.json`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role_id: 'ROLE-003', entries: [fixture, fixture] }) });
  assert.equal(duplicate.status, 409, 'server must reject duplicate session entry IDs');
  assert.equal((await duplicate.json()).error, 'This achievement is already in the active Career DNA session.');
  console.log('SMOKE_TEST=PASS');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
