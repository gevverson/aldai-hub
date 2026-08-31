import { Link } from 'react-router-dom';
import { formatKsh, HEALTH, healthOf, flaggedPct } from '../lib/geo';

/**
 * AreaCard — one tile in the drill-down, used for both counties and
 * constituencies. Areas with no ingested data render as a muted,
 * non-clickable tile that says so plainly, rather than showing a
 * misleading zero.
 */
const AreaCard = ({ area, to, kicker }) => {
  const hasProjects = area.projectCount > 0;
  const findingsOnly = !hasProjects && (area.findingCount || 0) > 0;
  const hasData = hasProjects || findingsOnly;   // clickable if either exists
  const health = HEALTH[healthOf(area)];
  const pct = flaggedPct(area);
  // How much of this area's register the auditor actually reached a
  // conclusion on. A percentage over zero checked projects is not a finding
  // about the area, and must not be drawn as one.
  const verified = area.verifiedCount ?? area.projectCount ?? 0;
  const unverified = area.unverifiedCount ?? 0;
  const unverifiedOnly = (area.projectCount ?? 0) > 0 && verified === 0;

  const body = (
    <div
      className={`rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 border ${
        hasData
          ? 'border-[#1F2937] group-hover:border-amber-500/50 group-hover:-translate-y-[3px] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.6)]'
          : 'border-[#161B22]'
      }`}
      style={{ background: hasData ? '#111827' : '#0D1117' }}
    >
      <div className="h-1.5 w-full" style={{ background: health.bar }} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {kicker && (
              <p
                className="uppercase tracking-widest mb-1"
                style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {kicker}
              </p>
            )}
            <h3
              className={`font-display leading-tight transition-colors ${
                hasData ? 'text-white group-hover:text-amber-300' : ''
              }`}
              style={{ fontSize: '20px', color: hasData ? undefined : '#6B7280' }}
            >
              {area.name}
            </h3>
          </div>
          {area.ghostCount > 0 && (
            <span
              className="flex-shrink-0 font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse"
              style={{
                background: 'rgba(220,38,38,0.15)',
                color: '#FCA5A5',
                border: '1px solid rgba(220,38,38,0.3)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '10px',
              }}
            >
              🔴 {area.ghostCount} GHOST
            </span>
          )}
        </div>

        {hasProjects ? (
          <>
            <div className="flex gap-4">
              <div>
                <p className="font-mono-jet font-bold" style={{ color: '#D97706', fontSize: '16px' }}>
                  {formatKsh(area.totalAllocated)}
                </p>
                <p
                  className="uppercase tracking-wider"
                  style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Audited (Iliyokaguliwa)
                </p>
              </div>
              <div className="w-px" style={{ background: '#1F2937', alignSelf: 'stretch' }} />
              <div>
                <p className="font-mono-jet font-bold text-white" style={{ fontSize: '16px' }}>
                  {area.projectCount}
                </p>
                <p
                  className="uppercase tracking-wider"
                  style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Projects (Miradi)
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span
                  className="font-semibold uppercase tracking-wide"
                  style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {unverifiedOnly ? 'Not yet verified' : 'Flagged, of those checked'}
                </span>
                <span className="font-mono-jet font-bold" style={{ color: health.bar, fontSize: '12px' }}>
                  {unverifiedOnly ? '—' : `${pct}%`}
                </span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ background: '#1F2937', height: '6px' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: health.bar }}
                />
              </div>
              {area.flaggedValue > 0 && (
                <p
                  className="mt-1.5"
                  style={{ color: '#6B7280', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {formatKsh(area.flaggedValue)} attached to flagged projects
                </p>
              )}
              {/* Say how much of the register the percentage rests on. Without
                  this, a share computed over three checked projects looks
                  identical to one computed over three hundred. */}
              {unverified > 0 && (
                <p
                  className="mt-1.5"
                  style={{ color: '#6B7280', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {unverifiedOnly
                    ? `${unverified} project${unverified === 1 ? '' : 's'} on record — the auditor recorded no result for any of them`
                    : `${verified} of ${area.projectCount} checked · ${unverified} not verified`}
                </p>
              )}
            </div>
          </>
        ) : findingsOnly ? (
          <div>
            <p className="font-mono-jet font-bold" style={{ color: '#D97706', fontSize: '22px' }}>
              {area.findingCount}
            </p>
            <p className="uppercase tracking-wider" style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
              Audit findings
            </p>
            <p className="mt-2" style={{ color: '#9CA3AF', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              Auditor-General findings on record. No project register published yet.
            </p>
          </div>
        ) : (
          <p
            style={{ color: '#4B5563', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
          >
            No audited project register published for this area yet. Findings may still
            exist in narrative form.
          </p>
        )}

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mt-auto"
          style={{ background: '#0A0A0A' }}
        >
          <span style={{ fontSize: '13px' }}>{findingsOnly ? '📄' : health.icon}</span>
          <div>
            <p
              className="font-bold"
              style={{ color: hasData ? '#F9FAFB' : '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
            >
              {findingsOnly ? 'Audit Findings' : health.label}
            </p>
            <p style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
              {findingsOnly ? 'Matokeo ya Ukaguzi' : health.sw}
            </p>
          </div>
          {hasData && (
            <span
              className="ml-auto text-sm transition-transform group-hover:translate-x-1"
              style={{ color: '#D97706' }}
            >
              →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasData) {
    return (
      <div className="block h-full" aria-label={`${area.name} — no data yet`}>
        {body}
      </div>
    );
  }

  return (
    <Link to={to} className="group block h-full" aria-label={`${area.name} — ${health.label}`}>
      {body}
    </Link>
  );
};

export default AreaCard;
