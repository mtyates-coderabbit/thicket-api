/**
 * Validates client operations (.graphql files) against a schema.
 *
 *   npm run operations:validate -- <schema.graphql> <client-dir> [<client-dir> ...]
 *
 * Every *.graphql file under each client directory's src/ is treated as an
 * operation document. Fragments may be defined in any file within the same
 * client. Exits 1 if any operation is invalid against the schema.
 */
import { appendFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import {
  buildSchema,
  Kind,
  NoUnusedFragmentsRule,
  parse,
  specifiedRules,
  validate,
  type DefinitionNode,
  type FragmentDefinitionNode,
} from 'graphql';

const [schemaPath, ...clientDirs] = process.argv.slice(2);
if (!schemaPath || clientDirs.length === 0) {
  console.error('usage: validate-operations <schema.graphql> <client-dir> [<client-dir> ...]');
  process.exit(2);
}

const schema = buildSchema(readFileSync(schemaPath, 'utf8'));
const rules = specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule);

function graphqlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (entry === 'node_modules') return [];
    if (statSync(path).isDirectory()) return graphqlFiles(path);
    return entry.endsWith('.graphql') ? [path] : [];
  });
}

const failures: string[] = [];
let operationCount = 0;

for (const clientDir of clientDirs) {
  const client = basename(clientDir);
  const files = graphqlFiles(join(clientDir, 'src')).map((path) => ({ path, doc: parse(readFileSync(path, 'utf8')) }));

  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const { doc } of files) {
    for (const def of doc.definitions) {
      if (def.kind === Kind.FRAGMENT_DEFINITION) fragments.set(def.name.value, def);
    }
  }

  for (const { path, doc } of files) {
    const own = new Set(
      doc.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION).map((d) => (d as FragmentDefinitionNode).name.value),
    );
    const definitions: DefinitionNode[] = [
      ...doc.definitions,
      ...[...fragments.values()].filter((f) => !own.has(f.name.value)),
    ];
    const errors = validate(schema, { kind: Kind.DOCUMENT, definitions }, rules);
    const operations = doc.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION);
    operationCount += operations.length;
    const label = doc.definitions
      .map((d) => ('name' in d && d.name ? d.name.value : '(anonymous)'))
      .join(', ');
    for (const error of errors) {
      failures.push(`- **${client}** \`${relative(clientDir, path)}\` (${label}): ${error.message}`);
    }
  }
}

const lines = ['## Client operation validation', ''];
lines.push(`Checked ${operationCount} operations across ${clientDirs.length} client(s).`, '');
if (failures.length > 0) {
  lines.push(`### Invalid against proposed schema (${failures.length})`, '', ...failures);
} else {
  lines.push('All client operations are valid against the proposed schema.');
}

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

process.exit(failures.length > 0 ? 1 : 0);
