import { Link } from 'react-router-dom';
import AnimatedCounter from './AnimatedCounter';

const Hero = ({ globalStats }) => {
  const totalUnaccounted = 4100000000;

  return (
    <div className="bg-forest-950 relative overflow-hidden">

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(251,191,36,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.8) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #f59e0b 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">

        {/* Breaking badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-red-900/60 border border-red-700/60 rounded-full px-4 py-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            <span className="text-red-300 text-xs font-black uppercase tracking-widest">Nandi County — Under Investigation</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-black text-white leading-none tracking-tight mb-4">
            Your Money.{' '}
            <span className="text-amber-400">Your Projects.</span>
            <br />
            <span className="text-amber-400">Your Right</span>{' '}
            <span className="text-white">to Know.</span>
          </h1>
          <p className="text-lg md:text-xl text-forest-300 font-medium mb-2">
            Pesa Yako. Miradi Yako. Haki Yako ya Kujua.
          </p>
          <p className="max-w-2xl mx-auto text-gray-400 text-base leading-relaxed">
            Official OAG audit data, translated into plain truth for every citizen.
            Ghost projects exposed. Stolen funds tracked. Evidence mapped in real-time.
          </p>
        </div>

        {/* Accountability counter — the big weapon */}
        <div className="flex justify-center mb-10">
          <div className="bg-red-950/80 border-2 border-red-700 rounded-2xl px-8 py-5 text-center backdrop-blur-sm shadow-2xl shadow-red-900/30 max-w-sm w-full">
            <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-1">Total Public Funds Unaccounted For</p>
            <p className="text-4xl md:text-5xl font-display font-black text-white mb-1">
              Ksh{' '}
              <span className="text-red-400">
                <AnimatedCounter targetValue={4.1} duration={2000} decimals={1} />B
              </span>
            </p>
            <p className="text-red-300/70 text-xs">
              Payroll fraud · Ghost projects · Stalled infrastructure<br />Source: OAG Kenya Reports FY2019–2021
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-forest-950 font-black text-base px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-amber-500/40 hover:scale-105"
          >
            🗺️ View Evidence Map
          </Link>
          <Link
            to="/audit"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-base px-8 py-4 rounded-xl transition-all border border-white/20 backdrop-blur-sm"
          >
            🤖 Ask AI Auditor
          </Link>
          <a
            href="#wards"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-forest-300 hover:text-white font-semibold text-base px-8 py-4 rounded-xl transition-all border border-white/10"
          >
            📍 Check Your Ward
          </a>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-white/8 transition-colors">
            <p className="text-3xl md:text-4xl font-display font-black text-amber-400 mb-1">
              <AnimatedCounter targetValue={globalStats?.projectsTracked || 10} duration={1800} />
            </p>
            <p className="text-xs font-bold text-forest-400 uppercase tracking-wider">Projects Tracked</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-red-900/40 rounded-xl p-4 text-center hover:bg-white/8 transition-colors">
            <p className="text-3xl md:text-4xl font-display font-black text-red-400 mb-1">
              <AnimatedCounter targetValue={globalStats?.stalledProjects || 0} duration={1800} />
            </p>
            <p className="text-xs font-bold text-forest-400 uppercase tracking-wider">Stalled / Abandoned</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-purple-900/40 rounded-xl p-4 text-center hover:bg-white/8 transition-colors">
            <p className="text-3xl md:text-4xl font-display font-black text-purple-400 mb-1">
              <AnimatedCounter targetValue={globalStats?.ghostProjects || 0} duration={1800} />
            </p>
            <p className="text-xs font-bold text-forest-400 uppercase tracking-wider">Ghost Projects</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-green-900/40 rounded-xl p-4 text-center hover:bg-white/8 transition-colors">
            <p className="text-3xl md:text-4xl font-display font-black text-green-400 mb-1">
              <AnimatedCounter targetValue={globalStats?.citizensReporting || 42} duration={1800} />
            </p>
            <p className="text-xs font-bold text-forest-400 uppercase tracking-wider">Citizens Reporting</p>
          </div>

        </div>
      </div>

      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
    </div>
  );
};

export default Hero;
