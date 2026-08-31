/**
 * Methodology & Sources — the platform's evidence standard.
 * Every figure on Macho ya Mwananchi is traceable to a published,
 * legally authoritative Office of the Auditor-General (OAG) report.
 */

// ─── Status taxonomy shown on project cards ───────────────────
const STATUS_GLOSSARY = [
  { key: 'GHOST PROJECT', emoji: '🚨', color: '#DC2626',
    text: 'Funds were disbursed for infrastructure that physical verification found does not exist. Direct, prosecutable embezzlement.' },
  { key: 'STALLED', emoji: '🔴', color: '#D97706',
    text: 'Money was paid but the project was never completed — abandoned mid-way, often years past its contractual deadline.' },
  { key: 'ABANDONED', emoji: '💀', color: '#9CA3AF',
    text: 'Certified and paid as complete, yet the site was found abandoned or structurally defective and unusable.' },
  { key: 'DISPUTED', emoji: '⚠️', color: '#F59E0B',
    text: 'Declared complete on paper, but the OAG documented substandard work, missing items, or quality below government standards.' },
  { key: 'MISALLOCATED', emoji: '⛔', color: '#F97316',
    text: 'Funds were spent on the wrong thing — capacity a school or facility did not need — suggesting a fund-inflation scheme.' },
  { key: 'IRREGULAR', emoji: '🚩', color: '#EF4444',
    text: 'A systemic financial irregularity: pending bills, off-system payroll, hidden income, backdated or unsupported expenditure flagged by the Auditor-General.' },
];

// ─── Official OAG / government source documents ────────────────
const SOURCES = [
  {
    group: 'Nandi County Executive',
    docs: [
      { title: "Auditor-General's Report on County Executive of Nandi — FY 2023/2024",
        url: 'https://nandi.go.ke/wp-content/uploads/Report%20of%20the%20Auditor-General%20on%20County%20Executive%20of%20Nandi%20for%20the%20Year%20Ended%2030%20June,%202024_compressed.pdf' },
      { title: "Auditor-General's Report on County Governments (Executives) — FY 2023/2024",
        url: 'https://www.oagkenya.go.ke/wp-content/uploads/2025/02/County-Executives-2023-2024.pdf' },
      { title: "Auditor-General's Summary Report on County Governments — FY 2024/2025",
        url: 'https://www.oagkenya.go.ke/wp-content/uploads/2026/05/AUDITOR-GENERALS-SUMMARY-REPORT-ON-COUNTY-GOVERNMENTS-2024-2025.pdf' },
    ],
  },
  {
    group: 'Nandi County Assembly',
    docs: [
      { title: "Auditor-General's Report on County Governments — County Assemblies — FY 2024/2025",
        url: 'https://www.oagkenya.go.ke/wp-content/uploads/2026/05/AUDITOR-GENERALS-REPORT-ON-COUNTY-GOVERNMENTS-COUNTY-ASSEMBLIES-2024-2025-1.pdf' },
      { title: "Auditor-General's Report on County Assemblies — FY 2023/2024",
        url: 'https://www.oagkenya.go.ke/wp-content/uploads/2025/02/County-Assembly-2023-2024.pdf' },
    ],
  },
  {
    group: 'Nandi County Treasury (Budget Implementation)',
    docs: [
      { title: 'Nandi County Budget Implementation Review Report — Q1 FY 2025/2026',
        url: 'https://nandi.go.ke/wp-content/uploads/Nandi_Q1_COUNTY%20BUDGET%20IMPLEMENTATION%20REVIEW%20REPORT%202025-2026.pdf' },
    ],
  },
  {
    group: 'Office of the Auditor-General (Kenya)',
    docs: [
      { title: 'OAG Kenya — official audit reports portal',
        url: 'https://www.oagkenya.go.ke' },
      { title: 'Parliament of Kenya — Auditor-General reports tabled in the House',
        url: 'https://www.parliament.go.ke/the-national-assembly/house-business/auditors-general-reports' },
    ],
  },
];

const Card = ({ children }) => (
  <div className="rounded-2xl p-6 sm:p-8" style={{ background: '#111827', border: '1px solid #1F2937' }}>
    {children}
  </div>
);

const Methodology = () => {
  return (
    <div className="min-h-screen py-16 pb-24 px-4 sm:px-6 lg:px-8" style={{ background: '#0A0A0A' }}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-bold uppercase tracking-widest mb-4"
             style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
            Vyanzo na Mbinu · Methodology &amp; Sources
          </p>
          <h1 className="font-display text-white mb-6" style={{ fontSize: 'clamp(30px, 6vw, 48px)' }}>
            Where this data comes from
          </h1>
          <p className="max-w-2xl mx-auto font-medium leading-relaxed"
             style={{ color: '#9CA3AF', fontSize: '17px', fontFamily: "'DM Sans', sans-serif" }}>
            Every figure here is a documented finding from an official Office of the Auditor-General
            report — not rumour, not political rhetoric. These are established facts, not accusations.
          </p>
          <div className="w-24 h-1 mx-auto mt-8" style={{ background: '#D97706' }} />
        </div>

        <div className="space-y-8">

          {/* Evidence standard */}
          <Card>
            <h2 className="font-display text-white mb-4" style={{ fontSize: '22px' }}>Our evidence standard</h2>
            <ul className="space-y-3" style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}>
              <li className="flex gap-3"><span aria-hidden>📄</span><span>
                <strong className="text-white">Only official audits.</strong> The highest standard of truth on public
                expenditure in Kenya is the independent audit of the Auditor-General (Article 229 of the Constitution).
                We publish only what those reports establish.</span></li>
              <li className="flex gap-3"><span aria-hidden>🔎</span><span>
                <strong className="text-white">Physical verification counts.</strong> Where the OAG conducted
                unannounced site visits, we show the "official status" against the verified reality on the ground.</span></li>
              <li className="flex gap-3"><span aria-hidden>🧾</span><span>
                <strong className="text-white">Every entry is traceable.</strong> Each project and finding cites the exact
                OAG report it comes from. The source documents are all linked below — read them yourself.</span></li>
              <li className="flex gap-3"><span aria-hidden>⚖️</span><span>
                <strong className="text-white">Facts, not allegations.</strong> We describe what the Auditor-General
                formally reported. A "Qualified", "Adverse", or "Disclaimer" opinion is a legal audit conclusion,
                not our opinion.</span></li>
            </ul>
          </Card>

          {/* Status taxonomy */}
          <Card>
            <h2 className="font-display text-white mb-2" style={{ fontSize: '22px' }}>How to read a project's status</h2>
            <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              The badge on each project card summarises the Auditor-General's finding.
            </p>
            <div className="space-y-3">
              {STATUS_GLOSSARY.map(({ key, emoji, color, text }) => (
                <div key={key} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 rounded-xl"
                     style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
                  <span className="font-bold uppercase tracking-wider flex-shrink-0 sm:w-44"
                        style={{ color, fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                    {emoji} {key}
                  </span>
                  <span style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>{text}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Two kinds of evidence */}
          <Card>
            <h2 className="font-display text-white mb-2" style={{ fontSize: '22px' }}>Two kinds of evidence</h2>
            <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              We keep these strictly separate, because they mean different things.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
                <p className="font-bold uppercase tracking-wider mb-2" style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                  📍 Projects
                </p>
                <p style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  Physical projects the Auditor-General verified on the ground — a school, a road, a hospital.
                  We show the official status versus what auditors actually found. A project can be complete,
                  incomplete, stalled, or — where the report says so — a ghost project that does not exist.
                </p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
                <p className="font-bold uppercase tracking-wider mb-2" style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                  📄 Audit findings
                </p>
                <p style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  Financial and compliance issues the auditor raised — unsupported payments, pending bills,
                  missing records — with the audit opinion for each year. A finding is <em>not</em> a physical
                  project and is never shown as a ghost project. The figure on a finding is labelled
                  "figure cited", because the amount quoted may be context, not the sum in dispute.
                </p>
              </div>
            </div>
          </Card>

          {/* Source documents */}
          <Card>
            <h2 className="font-display text-white mb-2" style={{ fontSize: '22px' }}>Official source documents</h2>
            <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              All published by the Office of the Auditor-General, the County Treasury, or Parliament of Kenya.
            </p>
            <div className="space-y-6">
              {SOURCES.map(({ group, docs }) => (
                <div key={group}>
                  <h3 className="font-bold uppercase tracking-widest mb-3"
                      style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
                    {group}
                  </h3>
                  <ul className="space-y-2">
                    {docs.map(({ title, url }) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer"
                           className="flex items-start gap-2 rounded-lg p-2 -mx-2 transition-colors hover:bg-white/5"
                           style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                          <span aria-hidden style={{ color: '#D97706' }}>↗</span>
                          <span className="underline underline-offset-2 decoration-gray-600 hover:decoration-amber-500">{title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* Corrections & right of reply */}
          <Card>
            <h2 className="font-display text-white mb-4" style={{ fontSize: '22px' }}>Corrections &amp; right of reply · Marekebisho</h2>
            <p className="mb-4 leading-relaxed" style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}>
              We report what the Auditor-General documented — and we take accuracy seriously. If you believe an
              entry misreads the source, cites the wrong page, or a project has since changed on the ground, tell
              us and we will check it against the primary document.
            </p>
            <ul className="space-y-2 mb-4" style={{ color: '#D1D5DB', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
              <li className="flex gap-3"><span aria-hidden style={{ color: '#D97706' }}>•</span><span>
                <strong className="text-white">Named in a finding?</strong> Any person or entity has a right of reply.
                Send your response and we will publish it alongside the entry.</span></li>
              <li className="flex gap-3"><span aria-hidden style={{ color: '#D97706' }}>•</span><span>
                <strong className="text-white">Think a figure is wrong?</strong> Point us to the exact report and page.
                If the source says something different, we correct it and note the change.</span></li>
              <li className="flex gap-3"><span aria-hidden style={{ color: '#D97706' }}>•</span><span>
                <strong className="text-white">Project completed since the audit?</strong> Reality changes; the archived
                audit does not. We add the update without deleting the record.</span></li>
            </ul>
            <p style={{ color: '#9CA3AF', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
              Contact: <a href="mailto:gevversonkipkoech83@gmail.com" className="underline underline-offset-2 hover:text-amber-400" style={{ color: '#D97706' }}>gevversonkipkoech83@gmail.com</a>
            </p>
          </Card>

          {/* Legal basis */}
          <Card>
            <h2 className="font-display text-white mb-4" style={{ fontSize: '22px' }}>Why this is lawful to publish</h2>
            <p className="mb-3 leading-relaxed" style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}>
              This platform does one thing: it makes the Auditor-General's own findings — already public and tabled
              before Parliament and the County Assemblies under Article 229 of the Constitution — easier for citizens
              to read. We publish fair and accurate summaries of those official documents, each cited to its report
              and page. We do not invent allegations, infer intent, or publish unverified rumour.
            </p>
            <p style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              This is general context, not legal advice. Nothing here names an individual unless the underlying
              audit report does.
            </p>
          </Card>

          {/* Verify it yourself */}
          <Card>
            <h2 className="font-display text-white mb-4" style={{ fontSize: '22px' }}>Verify it yourself · Thibitisha mwenyewe</h2>
            <p className="mb-4 leading-relaxed" style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}>
              You do not have to take our word for it. Read the primary reports above, and report what you see on the
              ground. To report corruption directly to the authorities:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
                <p className="font-bold text-white" style={{ fontSize: '14px' }}>EACC (Anti-Corruption)</p>
                <p className="font-mono-jet" style={{ color: '#D97706', fontSize: '18px' }}>0800 720 629</p>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>Toll-free · report is anonymous</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}>
                <p className="font-bold text-white" style={{ fontSize: '14px' }}>DCI (Criminal Investigations)</p>
                <p className="font-mono-jet" style={{ color: '#D97706', fontSize: '18px' }}>0800 722 203</p>
                <p style={{ color: '#6B7280', fontSize: '12px' }}>Toll-free hotline</p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Methodology;
