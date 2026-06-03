const About = () => {
  return (
    <div
      className="min-h-screen py-16 pb-24 px-4 sm:px-6 lg:px-8"
      style={{ background: '#0A0A0A' }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p
            className="font-bold uppercase tracking-widest mb-4"
            style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Macho ya Mwananchi · Citizen's Eye
          </p>
          <h1
            className="font-display text-white mb-6"
            style={{ fontSize: 'clamp(32px, 6vw, 52px)' }}
          >
            About Macho ya Mwananchi
          </h1>
          <p
            className="max-w-2xl mx-auto font-medium leading-relaxed"
            style={{ color: '#9CA3AF', fontSize: '18px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Pesa Yako. Miradi Yako. Haki Yako ya Kujua.
          </p>
          <div className="w-24 h-1 mx-auto mt-8" style={{ background: '#D97706' }} />
        </div>

        <div className="space-y-10">

          {/* The Mission */}
          <div
            className="rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center"
            style={{ background: '#111827', border: '1px solid #1F2937' }}
          >
            <div className="md:w-1/3 flex justify-center flex-shrink-0">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(217,119,6,0.12)', border: '2px solid rgba(217,119,6,0.3)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#D97706" className="w-14 h-14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
            </div>
            <div className="md:w-2/3">
              <h2
                className="font-display text-white mb-4"
                style={{ fontSize: '24px' }}
              >
                The Mission
              </h2>
              <p
                className="leading-relaxed"
                style={{ color: '#D1D5DB', fontSize: '15px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Macho ya Mwananchi (Citizen's Eye) exists to protect the ordinary citizen from the
                misappropriation of public funds. We bridge the gap between dense government reports
                and grassroots reality. By utilizing official Auditor-General reports combined with
                Community Verification, we expose phantom projects, track stalled infrastructure,
                and give power back to you.
              </p>
            </div>
          </div>

          {/* Why We Built This */}
          <div>
            <h2
              className="font-display text-white text-center mb-8"
              style={{ fontSize: '28px' }}
            >
              Why We Built This
            </h2>
            <div
              className="grid md:grid-cols-2 gap-5 p-8 rounded-2xl"
              style={{ background: '#111827', border: '1px solid #1F2937' }}
            >
              <div>
                <p
                  className="font-bold text-lg mb-3 flex items-center gap-2"
                  style={{ color: '#F87171' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  Information Asymmetry
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Rural villagers are often told via radio broadcasts that projects like the{' '}
                  <em style={{ color: '#FCD34D' }}>Kimaren Girls Secondary School</em> are complete,
                  while the sites are abandoned. They cannot easily verify these claims or read
                  400-page OAG financial audits. We translate the audits using AI.
                </p>
              </div>
              <div>
                <p
                  className="font-bold text-lg mb-3 flex items-center gap-2"
                  style={{ color: '#F87171' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                  Whistleblower Fear
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}
                >
                  The Ksh 3.3B payroll fraud is known to workers inside the county systems, but they
                  fear violent retaliation and job loss. We built a 100% anonymous, scrubbed upload
                  system so insiders can leak evidence safely without any IP logging.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#111827', border: '1px solid #1F2937' }}
          >
            <h3
              className="font-bold uppercase tracking-widest mb-5"
              style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Official Data Sources
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                'Office of the Auditor-General (OAG) Kenya',
                'Controller of Budget (CoB) Reports',
                'Public Procurement Information Portal (PPIP)',
                'NG-CDF Board Project Allocations',
              ].map((src) => (
                <li
                  key={src}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: '#D1D5DB', fontFamily: "'DM Sans', sans-serif" }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: '#D97706' }}
                  />
                  {src}
                </li>
              ))}
            </ul>
          </div>

          {/* Anonymous note */}
          <div
            className="rounded-2xl p-6 flex items-start gap-4"
            style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div>
              <p
                className="font-bold mb-1"
                style={{ color: '#4ADE80', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Your Safety is Non-Negotiable
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#9CA3AF', fontFamily: "'DM Sans', sans-serif" }}
              >
                No login. No email. No IP addresses logged. No location stored. EXIF metadata
                stripped from all photo uploads. You receive only a random tracking code.
                Citizens are fully anonymous — always.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
