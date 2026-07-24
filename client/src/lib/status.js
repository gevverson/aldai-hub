/**
 * status.js — one canonical taxonomy for a project's community status.
 *
 * Cards, filters, and the audit-note tone all read from here so they can
 * never disagree (the bug where "Verified Complete" filtered for a status
 * string the data never used). Tone also stops completed projects from being
 * dressed in the same alarming red as a ghost project.
 */

// Which statuses belong to which severity bucket.
export const STATUS_GROUPS = {
  critical: ['GHOST PROJECT', 'ABANDONED', 'IRREGULAR', 'MISALLOCATED'],
  stalled:  ['STALLED'],
  concern:  ['DISPUTED', 'INCOMPLETE'],
  complete: ['COMPLETE', 'VERIFIED COMPLETE'],
  // Anything else (e.g. "REPORTED — SEE NOTE") is neutral/unknown.
};

export function statusTone(status) {
  for (const [tone, list] of Object.entries(STATUS_GROUPS)) {
    if (list.includes(status)) return tone;
  }
  return 'neutral';
}

/**
 * Visual treatment for the audit-note block, keyed by tone. A completed
 * project reads as a calm green "Auditor's Note"; a ghost project reads as a
 * red "Audit Finding". The alarm is earned, not universal.
 */
export const TONE = {
  critical: { accent: '#DC2626', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.15)', icon: '#DC2626', label: '#F87171', title: 'Audit Finding' },
  stalled:  { accent: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)',  icon: '#D97706', label: '#FBBF24', title: 'Audit Finding' },
  concern:  { accent: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', icon: '#F59E0B', label: '#FCD34D', title: 'Audit Note' },
  complete: { accent: '#16A34A', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)',  icon: '#16A34A', label: '#4ADE80', title: "Auditor's Note" },
  neutral:  { accent: '#374151', bg: '#0A0A0A',              border: '#1F2937',              icon: '#6B7280', label: '#9CA3AF', title: "Auditor's Note" },
};

export const toneOf = (status) => TONE[statusTone(status)];

/** Does a status count as a critical/stalled red-flag (for "Critical" filters)? */
export const isCritical = (status) =>
  STATUS_GROUPS.critical.includes(status) || STATUS_GROUPS.stalled.includes(status);

export const isComplete = (status) => STATUS_GROUPS.complete.includes(status);
export const isConcern = (status) => STATUS_GROUPS.concern.includes(status);
