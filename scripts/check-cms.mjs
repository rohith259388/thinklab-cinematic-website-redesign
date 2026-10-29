import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(
  new URL('../src/lib/cms/schema.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { validateContent, emptyContent, safeUrl, validateSlug } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);
const original = JSON.parse(
  await readFile(
    new URL('../src/lib/live-content.json', import.meta.url),
    'utf8',
  ),
);
for (const collection of ['projects', 'articles', 'careers'])
  for (const entry of original[collection])
    assert.equal(
      validateContent({ ...emptyContent(), ...entry }).title,
      entry.title,
    );
for (const url of [
  'javascript:alert(1)',
  '//evil.test',
  'data:text/html,<script>',
  '/\\evil.test',
])
  assert.equal(safeUrl(url), false);
assert.throws(() =>
  validateContent({
    ...emptyContent('Test'),
    fields: { 'cta.href': 'javascript:alert(1)' },
  }),
);
assert.throws(() =>
  validateContent({ ...emptyContent('Test'), sections: [{ type: 'script' }] }),
);
assert.throws(() =>
  validateContent({
    ...emptyContent('Test'),
    styles: { title: { color: 'url(https://evil.test)' } },
  }),
);
assert.throws(() => validateSlug('../admin', 'page'));
assert.equal(
  validateContent({
    ...emptyContent('Test'),
    blocks: [{ type: 'p', text: '<script>alert(1)</script>' }],
  }).blocks[0].text,
  '<script>alert(1)</script>',
);
console.log(
  'CMS schemas: existing content imports, URL protection, safe styles, block registry and slug validation passed.',
);
