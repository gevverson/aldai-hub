import AnimatedCounter from './AnimatedCounter';

const STATS = [
  {
    value: 50,
    suffix: 'B+',
    prefix: 'Ksh ',
    decimals: 0,
    label: 'FEDHA ZILIZOFUATILIWA',
    labelEn: 'Total county funds tracked',
    accent: '#D97706',
    bg: 'rgba(217,119,6,0.07)',
    border: 'rgba(217,119,6,0.2)',
    icon: '💰',
  },
  {
    value: 3.3,
    suffix: 'B',
    prefix: 'Ksh ',
    decimals: 1,
    label: 'CHINI YA UCHUNGUZI WA EACC',
    labelEn: 'Active payroll fraud investigation',
    accent: '#DC2626',
    bg: 'rgba(220,38,38,0.07)',
    border: 'rgba(220,38,38,0.2)',
    icon: '🚨',
  },
  {
    value: 491,
    suffix: '',
    prefix: '',
    decimals: 0,
    label: 'MIRADI ILIYOSIMAMA',
    labelEn: 'Stalled / abandoned projects (2018–2019)',
    accent: '#F59E0B',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    icon: '🏚️',
  },
  {
    value: 144,
    suffix: '',
    prefix: '',
    decimals: 0,
    label: 'VITUO VYA AFYA VILIVYFUNGWA',
    labelEn: 'Health facilities shut down',
    accent: '#7C3AED',
    bg: 'rgba(124,58,237,0.07)',
    border: 'rgba(124,58,237,0.2)',
    icon: '🏥',
  },
];

const QuickStats = () => {
  return (
    <section
      id="quick-stats"
      className="relative py-20"
      style={{ background: '#111827', borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937' }}
    >
      {/* Subtle amber glow top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '2px',
          background: 'linear-gradient(to right, transparent, rgba(217,119,6,0.5), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="flex items-start gap-4 mb-12">
          <div
            className="w-1 flex-shrink-0 rounded-full self-stretch"
            style={{ background: '#DC2626', minHeight: '56px' }}
          />
          <div>
            <p
              className="font-bold uppercase tracking-widest mb-1"
              style={{ color: '#DC2626', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Kwa Mujibu wa Ripoti za OAG · Source: OAG Kenya Reports FY 2019–2024
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}
            >
              Nandi County: Matokeo ya Mkaguzi Mkuu wa Hesabu za Serikali
            </h2>
            <p
              className="mt-1"
              style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Auditor-General's Findings — These are established facts, not accusations.
            </p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                cursor: 'default',
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {stat.icon}
              </div>

              {/* Counter */}
              <div>
                <p
                  className="font-display leading-none"
                  style={{ color: stat.accent, fontSize: 'clamp(30px, 5vw, 42px)' }}
                >
                  <AnimatedCounter
                    targetValue={stat.value}
                    duration={i === 0 ? 1600 : i === 1 ? 1800 : i === 2 ? 2200 : 2000}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </p>

                {/* Swahili label */}
                <p
                  className="font-bold uppercase tracking-widest mt-2 leading-tight"
                  style={{ color: '#F9FAFB', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {stat.label}
                </p>

                {/* English description */}
                <p
                  className="mt-1 leading-relaxed"
                  style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {stat.labelEn}
                </p>
              </div>

              {/* Bottom accent line */}
              <div
                className="h-0.5 w-12 rounded-full mt-auto"
                style={{ background: stat.accent, opacity: 0.5 }}
              />
            </div>
          ))}
        </div>

        {/* OAG citation */}
        <p
          className="mt-8 text-center"
          style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
        >
          Sources: OAG Kenya Annual Report FY2023/2024 · EACC Payroll Investigation Ref. Nandi/2024 ·
          Controller of Budget County Reports
        </p>
      </div>
    </section>
  );
};

export default QuickStats;
