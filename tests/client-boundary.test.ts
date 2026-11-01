import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Static check: model and speech-to-text calls go through the server routes, and no
// provider secret or provider host is referenced from code that ships in the app.
const ROOT = join(__dirname, '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const rel = (p: string) => relative(ROOT, p).split(sep).join('/');

// Server-only code: Expo Router API routes (+api.ts) and the modules only they import.
const isServerOnly = (p: string) =>
  /\+api\.ts$/.test(p) || p.startsWith('app/api/') || p.startsWith('app/services/llm/');

const clientFiles = ['app', 'lib', 'hooks']
  .flatMap((d) => walk(join(ROOT, d)))
  .map(rel)
  .filter((p) => /\.(ts|tsx|js|jsx)$/.test(p) && !isServerOnly(p));

const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

const SECRET_ENV = ['GROQ_API_KEY', 'AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT', 'ASSEMBLYAI_API_KEY'];
const PROVIDER_HOSTS = ['api.groq.com', 'openai.azure.com', 'api.assemblyai.com'];
const PROVIDER_SDKS = ['groq-sdk', 'assemblyai', 'openai'];

describe('client code never talks to model providers directly', () => {
  it('finds the client screens to check', () => {
    expect(clientFiles).toContain('app/(tabs)/index.tsx');
    expect(clientFiles).toContain('app/(tabs)/paths.tsx');
  });

  it.each(SECRET_ENV)('no client file references %s', (name) => {
    expect(clientFiles.filter((f) => read(f).includes(name))).toEqual([]);
  });

  it.each(PROVIDER_HOSTS)('no client file calls %s', (host) => {
    expect(clientFiles.filter((f) => read(f).includes(host))).toEqual([]);
  });

  it('no client file imports a provider SDK or the server-side LLM modules', () => {
    const importRe = /(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g;
    const offenders = clientFiles.flatMap((f) =>
      [...read(f).matchAll(importRe)]
        .map((m) => m[1])
        .filter((spec) => PROVIDER_SDKS.includes(spec) || /services\/llm|\/api\/check-affirmation-match/.test(spec))
        .map((spec) => `${f} -> ${spec}`),
    );
    expect(offenders).toEqual([]);
  });

  it('every client fetch goes through apiUrl() to the app server', () => {
    const fetchRe = /\bfetch\(\s*([^,)]+)/g;
    const calls = clientFiles.flatMap((f) => [...read(f).matchAll(fetchRe)].map((m) => ({ f, arg: m[1].trim() })));
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.filter((c) => !c.arg.startsWith('apiUrl(')).map((c) => `${c.f}: fetch(${c.arg}`)).toEqual([]);
  });

  it('the voice-match screen posts to the /check-affirmation-match route', () => {
    expect(read('app/(tabs)/index.tsx')).toMatch(/fetch\(apiUrl\('\/check-affirmation-match'\)/);
  });

  it('app.config.js extra (bundled into the app) holds no provider secrets', () => {
    const config = read('app.config.js');
    const extra = config.slice(config.indexOf('extra:'));
    const withoutComments = extra.replace(/\/\/.*$/gm, '');
    for (const name of SECRET_ENV) expect(withoutComments).not.toContain(name);
  });

  it('server routes read provider keys from the server environment', () => {
    expect(read('app/api/check-affirmation-match.ts')).toContain('process.env.GROQ_API_KEY');
    expect(read('app/assemblyai/[...path]+api.ts')).toContain('process.env.ASSEMBLYAI_API_KEY');
  });
});
