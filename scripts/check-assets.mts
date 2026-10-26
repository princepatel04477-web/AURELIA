/**
 * DEV-ONLY ASSET CHECK.
 *
 * Diffs three things and prints them: the paths the code can request, the files
 * actually in `/public`, and the rows in `/public/IMAGES.md`. Exits non-zero
 * only when a requested path has no declared fallback (`uncovered`) or is not in
 * the manifest at all (`undeclared`) — i.e. only when the delivery is dishonest.
 *
 *   npm run check:assets
 *
 * Run with Node's type stripping (Node ≥ 22.6); `lib/assets.ts` has no imports,
 * which is what makes this cheap.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { auditAssets, formatAudit } from '../lib/assets.ts';

const root = process.cwd();
const publicDir = path.join(root, 'public');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return [full];
    })
  );
  return found.flat();
}

const files = await walk(publicDir);
const present = files
  .map((file) => `/${path.relative(publicDir, file).split(path.sep).join('/')}`)
  .filter((file) => !file.endsWith('.md'));

const manifestText = await readFile(path.join(publicDir, 'IMAGES.md'), 'utf8');

/**
 * Rows are written as bare filenames under a `## /public/<folder>/` heading, so
 * the folder comes from the last heading, not from the filename.
 */
const manifestPaths = (() => {
  const paths = new Set<string>();
  let folder = '';

  for (const line of manifestText.split('\n')) {
    const heading = line.match(/^##\s+\/public\/([a-z-]+)\//);
    if (heading) {
      folder = heading[1] ?? '';
      continue;
    }

    // Any other level-2 heading ends the folder: the tables below the art brief
    // talk about files, but they are prose, not manifest rows.
    if (/^##\s/.test(line)) {
      folder = '';
      continue;
    }

    const firstCell = line.match(/^\|\s*`([^`]+)`/);
    const name = firstCell?.[1];
    if (!name || name.includes('<') || name.includes('*') || name.includes('..')) continue;
    if (!/\.(?:jpg|jpeg|png|webp|glb|hdr|avif)$/i.test(name)) continue;

    paths.add(name.includes('/') ? `/${name}` : `/${folder}/${name}`);
  }

  return Array.from(paths);
})();

const audit = auditAssets({ present, manifest: manifestPaths });

console.log(formatAudit(audit));

if (!audit.ok) {
  console.error('\nasset check failed');
  process.exit(1);
}
