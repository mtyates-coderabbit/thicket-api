/**
 * Compares two SDL files and reports breaking and dangerous changes.
 *
 *   npm run schema:diff -- <base.graphql> <proposed.graphql>
 *
 * Exits 1 when any breaking change is found. Dangerous changes (for example a
 * new enum value or a new optional argument) are reported but do not fail.
 */
import { appendFileSync, readFileSync } from 'node:fs';
import { buildSchema, findBreakingChanges, findDangerousChanges } from 'graphql';

const [basePath, proposedPath] = process.argv.slice(2);
if (!basePath || !proposedPath) {
  console.error('usage: schema-diff <base.graphql> <proposed.graphql>');
  process.exit(2);
}

const base = buildSchema(readFileSync(basePath, 'utf8'));
const proposed = buildSchema(readFileSync(proposedPath, 'utf8'));

const breaking = findBreakingChanges(base, proposed);
const dangerous = findDangerousChanges(base, proposed);

const lines: string[] = ['## Schema diff', ''];
if (breaking.length === 0 && dangerous.length === 0) {
  lines.push('No breaking or dangerous changes.');
}
if (breaking.length > 0) {
  lines.push(`### Breaking (${breaking.length})`, '');
  breaking.forEach((c) => lines.push(`- \`${c.type}\`: ${c.description}`));
  lines.push('');
}
if (dangerous.length > 0) {
  lines.push(`### Dangerous (${dangerous.length})`, '');
  dangerous.forEach((c) => lines.push(`- \`${c.type}\`: ${c.description}`));
  lines.push('');
}

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

process.exit(breaking.length > 0 ? 1 : 0);
