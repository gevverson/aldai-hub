const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
      
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-forest-900 mb-6">About Macho ya Mwananchi</h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
          Pesa Yako. Miradi Yako. Haki Yako ya Kujua.
        </p>
        <div className="w-24 h-1 bg-amber-500 mx-auto mt-8"></div>
      </div>

      <div className="space-y-16">
        
        {/* The Mission */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-forest-100 flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/3 flex justify-center">
            <div className="w-32 h-32 bg-forest-100 rounded-full flex items-center justify-center border-4 border-forest-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-forest-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
          </div>
          <div className="md:w-2/3">
            <h2 className="text-2xl font-bold font-display text-forest-900 mb-4">The Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              Macho ya Mwananchi (Citizen's Eye) exists to protect the ordinary citizen from the misappropriation of public funds. 
              We bridge the gap between dense government reports and grassroots reality. 
              By utilizing official Auditor-General reports combined with Community Verification, we expose phantom projects, track stalled infrastructure, and give power back to you.
            </p>
          </div>
        </div>

        {/* The Problem */}
        <div>
          <h2 className="text-2xl font-bold font-display text-forest-900 mb-6 text-center border-b-2 border-forest-100 pb-2 inline-block mx-auto flex justify-center">Why We Built This</h2>
          <div className="grid md:grid-cols-2 gap-6 bg-forest-50 p-8 rounded-2xl border border-forest-100">
            <div>
              <p className="text-alert-red font-bold text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                Information Asymmetry
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Rural villagers are often told via radio broadcasts that projects like the <i>Kimaren Girls Secondary School</i> are complete, while the sites are abandoned. They cannot easily verify these claims or read 400-page OAG financial audits. We translate the audits using AI.
              </p>
            </div>
            <div>
              <p className="text-alert-red font-bold text-lg mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
                Whistleblower Fear
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                The Ksh 3.3B payroll fraud is known to workers inside the county systems, but they fear violent retaliation and job loss. We built a 100% anonymous, scrubbed upload system so insiders can leak evidence safely without any IP logging.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl">
          <h3 className="font-bold text-forest-900 uppercase tracking-widest text-sm mb-4">Official Data Sources</h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Office of the Auditor-General (OAG) Kenya
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Controller of Budget (CoB) Reports
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Public Procurement Information Portal (PPIP)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              NG-CDF Board Project Allocations
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default About;
