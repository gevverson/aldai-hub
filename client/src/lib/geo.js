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
};

/**
 * Score an area from its audited outcomes.
 * Any ghost project is automatically critical — a project paid for but
 * physically absent is not a "moderate concern".
 */
export const healthOf = ({ projectCount = 0, ghostCount = 0, flaggedCount = 0 }) => {
  if (!projectCount) return 'grey';
  if (ghostCount > 0) return 'red';
  const ratio = flaggedCount / projectCount;
  if (ratio >= 0.5) return 'red';
  if (ratio >= 0.2) return 'amber';
  return 'green';
};

/** Share of projects the auditor flagged, as a whole number percent. */
export const flaggedPct = ({ projectCount = 0, flaggedCount = 0 }) =>
  projectCount ? Math.round((flaggedCount / projectCount) * 100) : 0;

export const slug = (s) => encodeURIComponent(String(s).toLowerCase());
