import { readFile, mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const library = JSON.parse(await readFile(path.join(root, 'content/library.json'), 'utf8'));
const categories = new Set(library.categories.map(c => c.id));
const routes = new Set();
for (const artifact of library.artifacts) {
  if (!categories.has(artifact.category) || !/^[a-z0-9-]+$/.test(artifact.id) || !/^[a-z0-9-]+$/.test(artifact.category)) {
    throw new Error(`Invalid artifact: ${artifact.id}`);
  }
  artifact.url = `/${artifact.category}/${artifact.id}/`;
  if (routes.has(artifact.url)) throw new Error(`Duplicate route: ${artifact.url}`);
  routes.add(artifact.url);
  if (!/^\/artifacts\/[a-z0-9-/]+\.html$/.test(artifact.file)) throw new Error('Invalid artifact file');
  const html = await readFile(path.join(root, 'public', artifact.file.slice(1)), 'utf8');
  const match = html.match(/const chapters=(\[.*?\]);\n/s);
  artifact.chapters = match ? JSON.parse(match[1]).map(c => ({
    title: c.title, text: [c.deck, ...c.body, c.lesson, c.insight].join(' ').replace(/<[^>]*>/g, '')
  })) : [];
}
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'public'), dist, { recursive: true });
await writeFile(path.join(dist, 'library.json'), JSON.stringify(library));
const shell = await readFile(path.join(root, 'public/index.html'), 'utf8');
for (const artifact of library.artifacts) {
  const folder = path.join(dist, artifact.url.slice(1));
  await mkdir(folder, { recursive: true });
  const title = artifact.title.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  await writeFile(path.join(folder, 'index.html'), shell.replace('<title>Artifact Library</title>', `<title>${title} · Artifact Library</title>`));
}
console.log(`Built ${library.artifacts.length} artifact page(s) and the library index.`);
