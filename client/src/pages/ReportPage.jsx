import { useState } from 'react';

const WARDS = [
  'Kabwareng', 'Terik', 'Kemeloi-Maraba', 'Kobujoi', 'Kaptumo-Kaboi', 'Koyo-Ndurio',
];

const ISSUE_TYPES = [
  { label: '👻 Ghost Project (Does not exist)',  value: 'ghost'    },
  { label: '🚧 Stalled Project',                  value: 'stalled'  },
  { label: '💰 Payroll Fraud / Ghost Workers',     value: 'other'    },
  { label: '📚 Missing Bursary Funds',             value: 'bursary'  },
  { label: '🏗️ Defective Construction',            value: 'other'    },
  { label: '🏥 Health / Medicine Issues',          value: 'health'   },
  { label: '🛣️ Road / Infrastructure',             value: 'road'     },
  { label: '🔍 Other Corruption',                  value: 'other'    },
];

const inputStyle = {
  background: '#0A0A0A',
  border: '1px solid #1F2937',
  color: '#F9FAFB',
  fontFamily: "'DM Sans', sans-serif",
};

const labelStyle = {
  color: '#6B7280',
  fontSize: '11px',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const ReportPage = () => {
  const [formData, setFormData] = useState({ ward: '', category: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState(null);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res  = await fetch('/api/reports', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setTrackingCode(data.data?.trackingCode);
        setFormData({ ward: '', category: '', description: '' });
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Success State ─────────────────────────────────────── */
  if (trackingCode) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-20"
        style={{ background: '#0A0A0A' }}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-8 text-center"
          style={{ background: '#111827', border: '1px solid #1F2937' }}
        >
          <div className="text-6xl mb-4">🦅</div>
          <h2
            className="font-display text-white mb-2"
            style={{ fontSize: '28px' }}
          >
            Report Submitted
          </h2>
          <p style={{ color: '#D97706', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', marginBottom: '4px' }}>Ripoti Imetumwa</p>
          <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", marginBottom: '24px' }}>
            Evidence secured. Your report is anonymous — no personal data was stored.
          </p>

          <div
            className="rounded-xl p-6 mb-6"
            style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}
          >
            <p
              className="uppercase tracking-widest mb-3"
              style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Tracking Code · Nambari ya Kufuatilia
            </p>
            <p
              className="font-mono font-black tracking-widest"
              style={{ color: '#D97706', fontSize: '20px', wordBreak: 'break-all' }}
            >
              {trackingCode}
            </p>
            <p style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif", marginTop: '10px' }}>
              Save this code — it is the only way to track your report.
            </p>
          </div>

          <div
            className="flex items-start gap-3 rounded-xl p-4 mb-6 text-left"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <span>🔒</span>
            <p style={{ color: '#9CA3AF', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              <strong style={{ color: '#D1D5DB' }}>Zero log policy.</strong>{' '}
              No IP address was recorded. No personal identifiers were stored.
              Your report is in the public record under this code only.
            </p>
          </div>

          <button
            onClick={() => setTrackingCode(null)}
            className="w-full py-3 rounded-xl font-bold transition-colors"
            style={{
              background: '#1F2937',
              color: '#F9FAFB',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            }}
          >
            Submit Another Report (Tuma Ripoti Nyingine)
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────── */
  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-24">

        {/* Header */}
        <div className="text-center mb-10">
          <p
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: '#D97706', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Submit Evidence (Toa Ushahidi)
          </p>
          <h1
            className="font-display text-white mb-3"
            style={{ fontSize: 'clamp(28px, 6vw, 44px)', lineHeight: 1.1 }}
          >
            REPORT CORRUPTION
          </h1>
          <p style={{ color: '#D97706', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic', marginBottom: '4px' }}>
            Ripoti Ufisadi
          </p>
          <p style={{ color: '#6B7280', fontSize: '16px', fontFamily: "'DM Sans', sans-serif", maxWidth: '420px', margin: '0 auto' }}>
            100% anonymous. No login. No email. No IP address stored.
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #1F2937' }}
        >
          {/* Red top bar */}
          <div className="h-1" style={{ background: '#DC2626' }} />

          <div className="p-6 md:p-8" style={{ background: '#111827' }}>

            {error && (
              <div
                className="rounded-xl p-4 mb-6 flex gap-3"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}
              >
                <span>⚠️</span>
                <p style={{ color: '#FCA5A5', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Ward */}
                <div>
                  <label style={labelStyle} className="block mb-2">
                    Ilitokea wapi? · Where? <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.ward}
                    onChange={set('ward')}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                    style={{ ...inputStyle }}
                    onFocus={(e) => { e.target.style.borderColor = '#D97706'; }}
                    onBlur={(e)  => { e.target.style.borderColor = '#1F2937'; }}
                  >
                    <option value="" disabled>Select a Ward</option>
                    {WARDS.map((w) => <option key={w} value={w}>{w} Ward</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={labelStyle} className="block mb-2">
                    Aina ya tatizo · Issue Type <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={set('category')}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                    style={{ ...inputStyle }}
                    onFocus={(e) => { e.target.style.borderColor = '#D97706'; }}
                    onBlur={(e)  => { e.target.style.borderColor = '#1F2937'; }}
                  >
                    <option value="" disabled>Categorize the issue</option>
                    {ISSUE_TYPES.map(({ label, value }, i) => (
                      <option key={i} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle} className="block mb-2">
                  Maelezo · Description <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <p
                  className="rounded-lg p-3 mb-2"
                  style={{
                    color: '#D97706',
                    fontSize: '12px',
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'rgba(217,119,6,0.08)',
                    border: '1px solid rgba(217,119,6,0.2)',
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ Usijumuishe jina lako au maelezo yanayoweza kukutambulisha. Do not include your name or identifying details.
                </p>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={set('description')}
                  minLength={20}
                  maxLength={1000}
                  placeholder="What exactly happened? Which project, location, or official? Provide as much specific detail as possible..."
                  className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none transition-colors"
                  style={{ ...inputStyle, lineHeight: 1.6 }}
                  onFocus={(e) => { e.target.style.borderColor = '#D97706'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#1F2937'; }}
                />
                <p
                  className="text-right mt-1"
                  style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {formData.description.length}/1000
                </p>
              </div>

              {/* Anonymity notice */}
              <div
                className="rounded-xl p-4 flex gap-3"
                style={{ background: 'rgba(27,67,50,0.3)', border: '1px solid rgba(27,67,50,0.6)' }}
              >
                <span className="flex-shrink-0">🔒</span>
                <p style={{ color: '#9CA3AF', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                  <strong style={{ color: '#D1D5DB' }}>Usalama wa Kukaa Asiye na Jina.</strong>{' '}
                  This connection is encrypted. We do not require email, phone, or login.
                  No IP addresses are logged. You will receive a tracking code only.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
                }}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#B91C1C'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#DC2626'; }}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
                    />
                    Submitting...
                  </>
                ) : (
                  <>🇰🇪 Submit Anonymous Report (Wasilisha Ripoti ya Siri)</>
                )}
              </button>

              <p
                className="text-center"
                style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
              >
                🔐 Muunganiko salama · Sera ya kutologa · Zero log policy
              </p>
            </form>
          </div>
        </div>

        {/* Helpline */}
        <div
          className="mt-8 rounded-xl p-5"
          style={{ background: '#111827', border: '1px solid #1F2937' }}
        >
          <p
            className="font-bold uppercase tracking-widest mb-3"
            style={{ color: '#D97706', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
          >
            Nambari za Dharura · Emergency Hotlines (Free / Bure)
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'EACC (Anti-Corruption)', number: '0800 720 629' },
              { name: 'DCI (Criminal Investigation)', number: '0800 722 203' },
              { name: 'Controller of Budget', number: 'cob@cob.go.ke' },
              { name: 'PPOA (Procurement)', number: 'ppoa@ppoa.go.ke' },
            ].map(({ name, number }) => (
              <div
                key={name}
                className="flex justify-between items-center px-3 py-2 rounded-lg"
                style={{ background: '#0A0A0A' }}
              >
                <span style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>
                  {name}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: '#F9FAFB', fontSize: '12px' }}
                >
                  {number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
