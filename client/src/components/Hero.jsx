import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ── Animation variants ─────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.5 } },
};

/* ── Stat Pill ──────────────────────────────────────── */
const StatPill = ({ value, label, isAlert = false }) => (
  <motion.div
    variants={fadeUp}
    className="flex items-center gap-3 rounded-2xl px-5 py-3"
    style={{
      background: isAlert ? 'rgba(220,38,38,0.12)' : 'rgba(217,119,6,0.1)',
      border: `1px solid ${isAlert ? 'rgba(220,38,38,0.25)' : 'rgba(217,119,6,0.25)'}`,
    }}
  >
    <span
      className="relative flex h-2.5 w-2.5 flex-shrink-0"
    >
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: isAlert ? '#DC2626' : '#D97706' }}
      />
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ background: isAlert ? '#DC2626' : '#D97706' }}
      />
    </span>
    <div>
      <p
        className="font-mono-jet font-bold leading-none"
        style={{ color: isAlert ? '#FCA5A5' : '#FCD34D', fontSize: '15px' }}
      >
        {value}
      </p>
      <p
        className="uppercase tracking-wider leading-none mt-0.5"
        style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </p>
    </div>
  </motion.div>
);

/* ── Hero ────────────────────────────────────────────── */
const Hero = () => {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden noise-overlay"
      style={{ background: '#0A0A0A' }}
    >
      {/* ── Ambient glow ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '800px',
          height: '500px',
          background: 'radial-gradient(ellipse, rgba(217,119,6,0.12) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: '500px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(220,38,38,0.07) 0%, transparent 70%)',
        }}
      />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(217,119,6,1) 1px, transparent 1px), linear-gradient(90deg, rgba(217,119,6,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Eyebrow badge */}
          <motion.div variants={fadeUp} className="mb-8">
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2"
              style={{
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span
                className="text-red-300 font-bold uppercase tracking-widest"
                style={{ fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Nandi County · Under Active EACC Investigation
              </span>
            </div>
          </motion.div>

          {/* ── Main headline ── */}
          <motion.h1
            variants={fadeUp}
            className="font-display leading-none tracking-tight mb-3"
            style={{ fontSize: 'clamp(64px, 13vw, 130px)' }}
          >
            <span style={{ color: '#D97706', display: 'block' }}>YOUR MONEY.</span>
            <span style={{ color: '#F9FAFB', display: 'block' }}>Where Did It Go?</span>
          </motion.h1>

          {/* Subtitle translation */}
          <motion.p
            variants={fadeUp}
            className="mb-10"
            style={{
              color: '#6B7280',
              fontSize: '15px',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.05em',
              fontStyle: 'italic',
            }}
          >
            "Pesa Yako. Wapi Ilikwenda?" — Your Money. Where Did It Go?
          </motion.p>

          {/* ── Stat pills ── */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3 mb-12"
          >
            {/* "STOLEN" stated as settled fact what the badge above this
                calls an active EACC investigation. Theft is a conclusion a
                court reaches; the platform's own Methodology page rests its
                legal position on reporting what the Auditor-General found,
                which is that the money is unaccounted for. That is the claim
                the evidence carries, and it is not a softer one. */}
            <StatPill value="Ksh 3.3B" label="UNACCOUNTED FOR" isAlert />
            <StatPill value="144" label="FACILITIES CLOSED" isAlert />
            <StatPill value="1,885" label="GHOST WORKERS" isAlert />
          </motion.div>

          {/* ── CTA Buttons ── */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          >
            <Link
              to="/"
              onClick={() => {
                document.getElementById('wards')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary text-base group"
              style={{ minWidth: '220px' }}
            >
              View Your Ward
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              to="/audit"
              className="btn-outline text-base"
              style={{ minWidth: '220px' }}
            >
              🤖 Ask the AI Auditor
            </Link>
          </motion.div>

          {/* ── Source line ── */}
          <motion.div variants={fadeIn} className="flex flex-col items-center gap-2">
            {/* Amber rule */}
            <div
              className="w-24 h-px mb-3"
              style={{ background: 'linear-gradient(to right, transparent, #D97706, transparent)' }}
            />
            <p
              style={{
                color: '#4B5563',
                fontSize: '12px',
                fontFamily: "'DM Sans', sans-serif",
                maxWidth: '520px',
                lineHeight: 1.6,
              }}
            >
              Data sourced from the{' '}
              <span style={{ color: '#9CA3AF', fontWeight: 600 }}>
                Office of the Auditor-General of Kenya (OAG)
              </span>
              , verified against official parliamentary committee records and active EACC files.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Bottom accent line ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(217,119,6,0.4), transparent)',
        }}
      />
    </section>
  );
};

export default Hero;
