import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildLibrary } from '../scripts/build.mjs';

async function fixture(t, mutate = () => {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'artifact-library-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content'));
  await mkdir(path.join(root, 'public/artifacts'), { recursive: true });
  await writeFile(path.join(root, 'public/index.html'), '<title>Artifact Library</title>');
  await writeFile(path.join(root, 'public/artifacts/example.html'), '<h1>Independent HTML</h1>');
  const library = {
    categories: [{ id: 'podcasts', title: 'Podcasts' }, { id: 'books', title: 'Books' }],
    artifacts: ['podcasts', 'books'].map(category => ({
      id: 'example', title: 'Example & companion', category, addedOn: '2026-10-06', file: '/artifacts/example.html'
    }))
  };
  mutate(library);
  await writeFile(path.join(root, 'content/library.json'), JSON.stringify(library));
  return root;
}

test('builds independent podcast and book routes, preserves dates and HTML, and clears stale output', async t => {
  const root = await fixture(t);
  const library = await buildLibrary(root);
  assert.deepEqual(library.artifacts.map(a => a.url), ['/podcasts/example/', '/books/example/']);
  const saved = JSON.parse(await readFile(path.join(root, 'dist/library.json'), 'utf8'));
  assert.equal(saved.artifacts[0].addedOn, '2026-10-06');
  assert.equal(await readFile(path.join(root, 'dist/artifacts/example.html'), 'utf8'), '<h1>Independent HTML</h1>');
  for (const category of ['podcasts', 'books']) {
    assert.equal(await readFile(path.join(root, `dist/${category}/example/index.html`), 'utf8'), '<h1>Independent HTML</h1>');
  }
  await writeFile(path.join(root, 'dist/stale.html'), 'stale');
  await buildLibrary(root);
  await assert.rejects(readFile(path.join(root, 'dist/stale.html')), { code: 'ENOENT' });
});

for (const [name, mutate, error] of [
  ['duplicate routes', l => l.artifacts.push(l.artifacts[0]), /Duplicate route/],
  ['unknown collections', l => l.artifacts[0].category = 'unknown', /Invalid artifact/],
  ['impossible dates', l => l.artifacts[0].addedOn = '2026-02-30', /Invalid addedOn/],
  ['missing dates', l => delete l.artifacts[0].addedOn, /Invalid addedOn/],
  ['path traversal', l => l.artifacts[0].file = '/artifacts/../index.html', /Invalid artifact file/],
  ['missing HTML', l => l.artifacts[0].file = '/artifacts/missing.html', /ENOENT/],
]) {
  test(`rejects ${name}`, async t => {
    const root = await fixture(t, mutate);
    await assert.rejects(buildLibrary(root), error);
  });
}
