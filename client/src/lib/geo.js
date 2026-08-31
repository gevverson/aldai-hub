/**
 * geo.js — shared helpers for the County → Constituency drill-down.
 *
 * Kept in one place so every level of the hierarchy formats money, scores
 * accountability health, and labels coverage the same way. The health score
 * is derived from audited outcomes only — never invented.
 */

export const formatKsh = (n) => {
  if (!n || n <= 0) return 'Ksh 0';
  if (n >= 1_000_000_000) return `Ksh ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `Ksh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Ksh ${(n / 1_000).toFixed(0)}K`;
  return `Ksh ${n.toLocaleString()}`;
};

export const HEALTH = {
  red:   { bar: '#DC2626', label: 'Critical Issues',   sw: 'Hali Mbaya Sana',   icon: '🔴' },
  amber: { bar: '#D97706', label: 'Moderate Concerns', sw: 'Wasiwasi wa Wastani', icon: '🟡' },
  green: { bar: '#16A34A', label: 'Mostly Verified',   sw: 'Imethibitishwa',    icon: '🟢' },
  grey:  { bar: '#374151', label: 'No Data Yet',       sw: 'Hakuna Data Bado',  icon: '⚪' },
  // Projects on record, but the auditor recorded no outcome for any of them.
  // This is not the same as "no data" and emphatically not the same as clean.
  unver: { bar: '#4B5563', label: 'Not Yet Verified',  sw: 'Bado Haijathibitishwa', icon: '⚪' },
  // Too few checked projects to characterise an area either way.
  thin:  { bar: '#6B7280', label: 'Limited Sample',    sw: 'Sampuli Ndogo',      icon: '⚪' },
};

/**
 * Minimum verified projects before an area gets a colour verdict.
 *
 * Two failure modes sit either side of this number. Below it, a county with
 * nine checked projects and nine findings scores 100% and reads as a verdict
 * on the whole county; a county with fifteen unchecked projects used to score
 * 0% and read as an all-clear. Both are claims the sample cannot support.
 *
 * It also guards a bias in the source: these registers are built from
 * Auditor-General findings, so a project is often present *because* it was
 * flagged. That makes a high flagged share partly circular, and the smaller
 * the sample the more circular it gets. Ten is a floor, not a statistical
 * threshold — it is where a share stops being one or two projects.
 */
export const MIN_VERIFIED_FOR_VERDICT = 10;

/**
 * Score an area from its audited outcomes.
 * Any ghost project is automatically critical — a project paid for but
 * physically absent is not a "moderate concern".
 */
export const healthOf = ({
  projectCount = 0, ghostCount = 0, flaggedCount = 0, verifiedCount,
}) => {
  if (!projectCount) return 'grey';
  if (ghostCount > 0) return 'red';

  // Score against projects the auditor actually reached a conclusion on.
  // Dividing by every project on record treats "never checked" as "found
  // fine", which is how a county with fifteen projects and zero verifications
  // came out green and labelled "Mostly Verified". Where nothing has been
  // verified there is no score to give — say so instead of implying an
  // all-clear. (verifiedCount is undefined on older payloads; fall back to
  // the previous behaviour rather than mislabel everything as unverified.)
  const denom = verifiedCount === undefined ? projectCount : verifiedCount;
  if (!denom) return 'unver';
  if (denom < MIN_VERIFIED_FOR_VERDICT) return 'thin';

  const ratio = flaggedCount / denom;
  if (ratio >= 0.5) return 'red';
  if (ratio >= 0.2) return 'amber';
  return 'green';
};

/**
 * Share of VERIFIED projects the auditor flagged, as a whole number percent.
 * Reads as "of the projects actually checked, this share had findings".
 */
export const flaggedPct = ({ projectCount = 0, flaggedCount = 0, verifiedCount }) => {
  const denom = verifiedCount === undefined ? projectCount : verifiedCount;
  return denom ? Math.round((flaggedCount / denom) * 100) : 0;
};

export const slug = (s) => encodeURIComponent(String(s).toLowerCase());
