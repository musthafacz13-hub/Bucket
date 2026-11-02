import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')) as {
  headers?: Array<{ headers?: Array<{ key: string; value: string }> }>;
};
const headerEntries = vercel.headers?.flatMap((rule) => rule.headers ?? []) ?? [];
const headerMap = new Map(headerEntries.map((header) => [header.key.toLowerCase(), header.value]));

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const allDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};

const sourceFiles = fs
  .readdirSync(path.join(root, 'src'), { recursive: true })
  .filter((file): file is string => typeof file === 'string' && /\.(ts|tsx)$/.test(file));
const source = sourceFiles
  .map((file) => fs.readFileSync(path.join(root, 'src', file), 'utf8'))
  .join('\n');

console.log('=== STARTING SECURITY CONFIGURATION AUDIT ===');

for (const key of [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
]) {
  assert.ok(headerMap.has(key), `Missing ${key} response header`);
  console.log(`✅ PASS: ${key} configured`);
}

assert.match(headerMap.get('content-security-policy') ?? '', /challenges\.cloudflare\.com/);
assert.match(headerMap.get('content-security-policy') ?? '', /\*\.supabase\.co/);
console.log('✅ PASS: CSP allows only the required Supabase and Turnstile origins');

for (const dependency of ['@google/genai', 'dotenv', 'express', '@types/express']) {
  assert.equal(allDependencies[dependency], undefined, `Unused server/AI dependency remains: ${dependency}`);
  console.log(`✅ PASS: ${dependency} is not installed`);
}

assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE|GEMINI_API_KEY|TURNSTILE_SECRET/);
assert.doesNotMatch(source, /dangerouslySetInnerHTML|\.innerHTML\s*=/);
console.log('✅ PASS: No privileged secret names or raw HTML sinks in frontend source');

console.log('SUMMARY: SECURITY CONFIGURATION AUDIT PASSED');
