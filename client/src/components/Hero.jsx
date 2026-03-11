import AnimatedCounter from './AnimatedCounter';

const Hero = ({ globalStats }) => {
  return (
    <div className="bg-forest-900 border-b-4 border-amber-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="kenya-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="2" fill="none" className="text-forest-300"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kenya-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col items-center text-center">
        
        {/* Main Text */}
        <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-4 tracking-tight">
          Your Money. Your Projects. <br className="hidden md:block"/> 
          <span className="text-amber-500">Your Right to Know.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-forest-200 mb-8 font-medium">
          Pesa Yako. Miradi Yako. Haki Yako ya Kujua.
        </p>
        
        <p className="max-w-3xl text-lg text-gray-300 mb-10 leading-relaxed">
          Macho ya Mwananchi is Aldai Constituency's grassroots public accountability platform. 
          We use official Auditor-General reports to expose phantom projects, track stalled infrastructure, and give power back to you.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          <a href="#wards" className="btn-primary text-lg w-full sm:w-auto min-w-[200px] flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Check Your Ward
          </a>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full border-t border-forest-700/50 pt-10">
          
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-display font-bold text-amber-400 mb-1">
              <AnimatedCounter targetValue={globalStats?.projectsTracked || 0} duration={1500} />
            </p>
            <p className="text-xs md:text-sm font-semibold text-forest-200 uppercase tracking-wider">
              Projects Tracked
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-display font-bold text-alert-red mb-1">
              <AnimatedCounter targetValue={globalStats?.stalledProjects || 0} duration={1500} />
            </p>
            <p className="text-xs md:text-sm font-semibold text-forest-200 uppercase tracking-wider">
              Stalled Projects
            </p>
          </div>

          <div className="text-center">
            <p className="text-3xl md:text-4xl font-display font-bold text-alert-purple mb-1">
              <AnimatedCounter targetValue={globalStats?.ghostProjects || 0} duration={1500} />
            </p>
            <p className="text-xs md:text-sm font-semibold text-forest-200 uppercase tracking-wider">
              Ghost Projects
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-display font-bold text-alert-green mb-1">
              <AnimatedCounter targetValue={globalStats?.citizensReporting || 0} duration={1500} />
            </p>
            <p className="text-xs md:text-sm font-semibold text-forest-200 uppercase tracking-wider">
              Citizens Reporting
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
