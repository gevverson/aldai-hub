/**
 * build_production_seed.mjs — merge verified pipeline data into the live seed.
 *
 * Principle: ADD, don't overwrite. The existing curated entries are sourced to
 * OAG FY2023/24–FY2024/25 reports, the Senate PIC and EACC — documents not in
 * the FY2016/17–2021/22 pipeline corpus — so they are preserved as-is. We only:
 *   1. keep the 12 county-wide / systemic mega-stories (they carry the big
 *      findings and the map coordinates), re-tagged with county/constituency;
 *   2. drop the 9 Aldai NG-CDF curated entries that the pipeline now covers with
 *      exact page citations (avoids double-counting the same projects);
 *   3. append the 368 pipeline projects;
 *   4. preserve `wards` and `globalStats` exactly.
 *
 * Run: node build_production_seed.mjs   (writes seed.js in place)
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { projects as curated, wards, globalStats } from './seed.js';
import { projects as verified } from './seed_national.js';

const HERE = dirname(fileURLToPath(import.meta.url));

// The 12 county-wide / systemic entries worth keeping (unique stories + coords).
const KEEP = [
  'Kapsabet Mother & Baby Unit',
  'Kabiyet Dairy Creamery',
  'Kobujoi Sub-County Hospital',
  'Kapsengere Hospital Phase II',
  'Chepterwai Sub-County Hospital',
  'Nandi County Pending Bills Crisis',
  'Manual Payroll & Ghost Workers',
  'Kapsabet County Referral Hospital (KCRH)',
  'KDSP II Donor Fund Under-Absorption',
  'County Assembly — Hidden Deferred Income',
  'County Assembly — Backdated Expenditure',
  'County Assembly — Unsupported Travel Allowances',
];

const kept = curated
  .filter((p) => KEEP.includes(p.name))
  .map((p) => {
    const out = {
      ...p,
      county: 'Nandi',
      // These are County Executive / Assembly projects — county-wide, not tied
      // to one constituency. The original `ward` string is kept as location context.
      constituency: null,
    };
    // Corroborate Kabiyet with the independently-confirmed public source,
    // without discarding its existing OAG attribution.
    if (p.name === 'Kabiyet Dairy Creamery' && !/Cherargei/i.test(p.source || '')) {
      out.source = `${p.source} · Senator S. Cherargei / Sacco Review (Jan 2026)`;
    }
    return out;
  });

const merged = [...kept, ...verified];

// ── Serialise the projects array as readable JS ──────────────
const KEY_ORDER = [
  'name', 'county', 'constituency', 'ward', 'fund', 'category',
  'allocated', 'contractValue', 'year', 'officialStatus', 'communityStatus',
  'auditNote', 'source', 'lat', 'lng',
];
const fmt = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return v.toLocaleString('en-US').replace(/,/g, '_');
  return JSON.stringify(v);
};
const objToJs = (o) => {
  const keys = KEY_ORDER.filter((k) => k in o);
  const extra = Object.keys(o).filter((k) => !KEY_ORDER.includes(k) && k !== '_id');
  const body = [...keys, ...extra]
    .map((k) => `    ${k + ':'} ${fmt(o[k])},`)
    .join('\n');
  return `  {\n${body}\n  },`;
};

// Preserve the exact wards + globalStats source text so nothing drifts.
const original = readFileSync(join(HERE, 'seed.js'), 'utf8');
const wardsBlock = original.slice(
  original.indexOf('export const wards'),
  original.indexOf('export const globalStats')
).trimEnd();
const statsBlock = original.slice(original.indexOf('export const globalStats')).trimEnd();

const header = `/**
 * seed.js — Macho ya Mwananchi production seed.
 *
 * ${merged.length} projects: ${kept.length} county-wide / systemic findings (sourced to OAG
 * FY23/24–FY24/25, Senate PIC, EACC) + ${verified.length} constituency projects auto-generated
 * from OAG NG-CDF audit PDFs (each cited to report + page).
 *
 * Regenerate the pipeline half with ai-service/pipeline/build_national.py, then
 * re-merge with build_production_seed.mjs. Do not hand-edit the generated block.
 */
export const projects = [
${merged.map(objToJs).join('\n')}
];

${wardsBlock}

${statsBlock}
`;

writeFileSync(join(HERE, 'seed.js'), header);
console.log(`seed.js rebuilt: ${merged.length} projects (${kept.length} curated + ${verified.length} pipeline)`);
console.log(`wards preserved: ${wards.length} · globalStats keys: ${Object.keys(globalStats).length}`);
