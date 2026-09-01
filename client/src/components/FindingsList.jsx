import { useMemo } from 'react';
import { formatKsh } from '../lib/geo';

/* Opinion → tone. An adverse/disclaimer opinion is the loudest accountability
   signal an auditor can give; a qualified opinion is a serious concern. */
const OPINION_TONE = (op = '') => {
  const o = op.toLowerCase();
  if (o.includes('adverse') || o.includes('disclaimer'))
    return { bg: 'rgba(220,38,38,0.12)', color: '#FCA5A5', border: 'rgba(220,38,38,0.3)' };
  if (o.includes('qualified'))
    return { bg: 'rgba(217,119,6,0.12)', color: '#FCD34D', border: 'rgba(217,119,6,0.3)' };
  return { bg: 'rgba(22,163,74,0.12)', color: '#86EFAC', border: 'rgba(22,163,74,0.3)' };
};

/* An OCR-corrected figure needs an explanation, because the summary below it
   quotes the source text verbatim — including the damaged number. Showing the
   corrected total beside the corrupt quote with no note reads as the platform
   contradicting itself, which costs more trust than the error it fixed. */
const isCorrection = (note = '') => /corrected/i.test(note);

const FindingCard = ({ f }) => (
  <div className="rounded-2xl overflow-hidden border" style={{ background: '#111827', borderColor: '#1F2937' }}>
    <div className="h-1 w-full" style={{ background: '#D97706' }} />
    <div className="p-5">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-3 mb-3">
        <div className="flex-1">
          <p className="uppercase tracking-widest font-semibold mb-1" style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
            {f.category}
          </p>
          <h3 className="font-bold text-white" style={{ fontSize: '17px', lineHeight: 1.25 }}>{f.heading}</h3>
        </div>
        {f.amountKsh > 0 && (
          <div className="text-left md:text-right shrink-0">
            <p className="font-bold font-mono-jet" style={{ color: '#D97706', fontSize: '17px' }}>{formatKsh(f.amountKsh)}</p>
            <p className="uppercase tracking-widest font-semibold" style={{ color: '#4B5563', fontSize: '10px' }}>Figure cited</p>
          </div>
        )}
      </div>
      {f.amountNote && isCorrection(f.amountNote) && (
        <div
          className="rounded-lg px-3 py-2 mb-3 flex gap-2"
          style={{ background: 'rgba(217,119,6,0.10)', border: '1px solid rgba(217,119,6,0.25)' }}
        >
          <span aria-hidden style={{ fontSize: '12px', lineHeight: 1.5 }}>&#9888;</span>
          <p style={{ color: '#FCD34D', fontSize: '12px', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
            <strong>Figure corrected.</strong> The Auditor-General&rsquo;s PDF has a damaged text
            layer here, so the amount quoted in the extract below is wrong in the source. The
            figure shown above is the corrected one.{' '}
            <span style={{ color: '#9CA3AF' }}>{f.amountNote}</span>
          </p>
        </div>
      )}

      <p className="text-sm leading-relaxed mb-3" style={{ color: '#D1D5DB' }}>{f.summary}</p>

      {f.amountNote && !isCorrection(f.amountNote) && (
        <p className="text-xs mb-2" style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}>
          <span aria-hidden>&#8505;</span> {f.amountNote}
        </p>
      )}
      <p className="text-xs" style={{ color: '#6B7280', fontFamily: "'DM Sans', sans-serif" }}>
        <span aria-hidden>📄</span> {f.source}
      </p>
    </div>
  </div>
);

/**
 * FindingsList — constituency audit findings, grouped by financial year with the
 * Auditor-General's opinion for each year. Distinct from project cards: these are
 * financial/compliance issues raised in the audit, not physical projects.
 */
const FindingsList = ({ findings }) => {
  const byYear = useMemo(() => {
    const m = {};
    for (const f of findings) (m[f.year] ||= []).push(f);
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [findings]);

  if (!findings || findings.length === 0) return null;

  return (
    <div className="space-y-10">
      {byYear.map(([year, items]) => {
        const opinion = items.find((i) => i.opinion)?.opinion;
        const tone = OPINION_TONE(opinion);
        return (
          <div key={year}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="font-display text-white" style={{ fontSize: '20px' }}>FY {year}</h3>
              {opinion && (
                <span
                  className="font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                  style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: '11px' }}
                >
                  {opinion}
                </span>
              )}
              <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                {items.length} finding{items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((f, i) => <FindingCard key={i} f={f} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FindingsList;
