/**
 * Every finding must be reachable.
 *
 * A finding is only ever shown to a reader by drilling down county →
 * constituency, so a `constituency` that is not in the IEBC list is not a
 * cosmetic flaw: those findings are in the database and invisible. Thirteen
 * Aldai FY2019/20 findings sat under "Aldai Ngcdg" for months — a filename
 * regex had turned the OAG's own typo (`Aldai-NGCDG-2019-2020.pdf`) into a
 * place name, and nothing checked that the place was real.
 *
 * This guards the seeded file, not the pipeline, because that is what ships.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { counties } from '../data/geography.js';

const findings = JSON.parse(
  readFileSync(new URL('../data/findings.json', import.meta.url)),
);

const norm = (s) => String(s).trim().toLowerCase();

const countyNames = new Set(counties.map((c) => norm(c.name)));
const constituencyNames = new Set(
  counties.flatMap((c) => c.constituencies.map((k) => norm(k.name))),
);
// A constituency name is only valid inside its own county.
const pairs = new Set(
  counties.flatMap((c) => c.constituencies.map((k) => `${norm(c.name)}|${norm(k.name)}`)),
);

test('every finding names a real county', () => {
  const bad = findings.filter((f) => !countyNames.has(norm(f.county)));
  assert.deepEqual(
    [...new Set(bad.map((f) => f.county))],
    [],
    `${bad.length} findings filed under a county that does not exist`,
  );
});

test('every finding names a real constituency', () => {
  const bad = findings.filter(
    (f) => f.constituency && !constituencyNames.has(norm(f.constituency)),
  );
  assert.deepEqual(
    [...new Set(bad.map((f) => f.constituency))],
    [],
    `${bad.length} findings are unreachable from the drill-down`,
  );
});

test('every constituency sits in the county it is filed under', () => {
  const bad = findings.filter(
    (f) => f.constituency && !pairs.has(`${norm(f.county)}|${norm(f.constituency)}`),
  );
  assert.deepEqual(
    [...new Set(bad.map((f) => `${f.county}/${f.constituency}`))],
    [],
    `${bad.length} findings name a constituency of another county`,
  );
});

test('a citation never points at a place that does not exist', () => {
  // The `source` string is what a reader follows to check the claim. It
  // embeds the constituency name, so a stale one sends them to a report
  // they cannot find.
  const bad = findings.filter(
    (f) => f.constituency && typeof f.source === 'string' && !f.source.includes(f.constituency),
  );
  assert.equal(bad.length, 0, `${bad.length} citations disagree with the constituency`);
});
