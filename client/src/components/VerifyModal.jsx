import { useState, useEffect, useRef } from 'react';

/* ─── Haversine distance between two GPS points (returns metres) ───────── */
const haversineMetres = (lat1, lng1, lat2, lng2) => {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (m) =>
  m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

/* ─── Status options (dark-mode styled via inline logic below) ───────────── */
const STATUS_OPTIONS = [
  { value: 'CONFIRMS_GHOST',    label: '👻 I went there — nothing exists',            accent: '#DC2626' },
  { value: 'CONFIRMS_STALLED',  label: '🚧 Project exists but is abandoned / stalled', accent: '#D97706' },
  { value: 'DISPUTES_OFFICIAL', label: '⚠️ Something is wrong / incomplete',           accent: '#F59E0B' },
  { value: 'CONFIRMS_COMPLETE', label: '✅ Project is working and complete',            accent: '#16A34A' },
];

/* ─── GPS distance badge ─────────────────────────────────────────────────── */
const ProximityBadge = ({ distM }) => {
  if (distM === null) return null;

  const close  = distM < 500;
  const nearby = distM < 2000;
  const color  = close ? '#16A34A' : '#D97706';
  const bg     = close ? 'rgba(22,163,74,0.12)'  : 'rgba(217,119,6,0.12)';
  const border = close ? 'rgba(22,163,74,0.3)'   : 'rgba(217,119,6,0.3)';
  const icon   = close ? '📍' : nearby ? '⚠️' : '📡';
  const label  = close
    ? `Imethibitishwa — ${formatDistance(distM)} kutoka eneo la mradi`
    : nearby
    ? `${formatDistance(distM)} kutoka eneo la mradi`
    : `Ripoti ya Mbali — ${formatDistance(distM)} kutoka eneo`;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span style={{ fontSize: '12px' }}>{icon}</span>
      <span
        className="font-semibold"
        style={{ color, fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
      {close && (
        <span
          className="font-bold uppercase tracking-widest"
          style={{ color: '#16A34A', fontSize: '9px', fontFamily: "'DM Sans', sans-serif" }}
        >
          · LOCATION VERIFIED
        </span>
      )}
    </div>
  );
};

/* ─── VerifyModal ────────────────────────────────────────────────────────── */
const VerifyModal = ({ project, onClose, onSuccess }) => {
  const [status,        setStatus]        = useState('');
  const [description,   setDescription]   = useState('');
  const [photo,         setPhoto]         = useState(null);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [coords,        setCoords]        = useState(null);
  const [coordsLoading, setCoordsLoading] = useState(true);
  const [coordsError,   setCoordsError]   = useState('');
  const [gpsSource,     setGpsSource]     = useState(''); // 'live' | 'fallback' | 'unavailable'
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(null);
  const fileRef = useRef();

  /* Distance from user to project site (null = unknown) */
  const distanceM =
    coords && project.lat && project.lng
      ? haversineMetres(coords.lat, coords.lng, project.lat, project.lng)
      : null;

  const locationVerified = distanceM !== null && distanceM < 2000;

  /* ── Request live GPS on modal open ─────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords(project.lat && project.lng ? { lat: project.lat, lng: project.lng } : null);
      setGpsSource('unavailable');
      setCoordsError('GPS not supported on this device.');
      setCoordsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Privacy: round to 3 decimal places (~111m grid)
        setCoords({
          lat: parseFloat(pos.coords.latitude.toFixed(3)),
          lng: parseFloat(pos.coords.longitude.toFixed(3)),
        });
        setGpsSource('live');
        setCoordsLoading(false);
      },
      () => {
        if (project.lat && project.lng) {
          setCoords({ lat: project.lat, lng: project.lng });
          setGpsSource('fallback');
          setCoordsError('GPS unavailable — using project location as fallback.');
        } else {
          setGpsSource('unavailable');
          setCoordsError('Could not capture location.');
        }
        setCoordsLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [project]);

  /* ── Photo handler ───────────────────────────────────────────────────── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status || !description.trim() || !coords) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectId',        String(project.id ?? project._id ?? ''));
      formData.append('projectName',      project.name);
      formData.append('ward',             project.ward);
      formData.append('lat',              String(coords.lat));
      formData.append('lng',              String(coords.lng));
      formData.append('locationVerified', String(locationVerified));
      formData.append('distanceFromSite', distanceM !== null ? String(Math.round(distanceM)) : '');
      formData.append('gpsSource',        gpsSource);
      formData.append('description',      description);
      formData.append('status',           status);
      if (photo) formData.append('photo', photo);

      const res  = await fetch('/api/verifications', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setSubmitted(data.data);
        if (onSuccess) onSuccess(data.data);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
        style={{ background: '#111827', border: '1px solid #1F2937' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="px-5 py-4 flex justify-between items-center sticky top-0 z-10"
          style={{ background: '#0A0A0A', borderBottom: '1px solid #1F2937' }}
        >
          <div>
            <p
              className="font-bold uppercase tracking-widest mb-0.5"
              style={{ color: '#D97706', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
            >
              Uthibitisho wa Raia · Citizen Verification
            </p>
            <h2
              className="font-display text-white leading-tight"
              style={{ fontSize: '17px' }}
            >
              {project.name}
            </h2>
            <p
              style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
            >
              {project.ward} Ward
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/10"
            style={{ color: '#6B7280' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Success State ───────────────────────────────────────────── */}
        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="text-5xl">🦅</div>
            <div>
              <h3 className="font-display text-white text-2xl mb-1">Ushahidi Umewasilishwa!</h3>
              <p style={{ color: '#6B7280', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
                Evidence submitted to the public record.
              </p>
            </div>

            <div
              className="rounded-2xl px-5 py-3 text-center"
              style={{
                background: 'rgba(217,119,6,0.1)',
                border: '1px solid rgba(217,119,6,0.25)',
              }}
            >
              <p
                className="font-bold mb-1"
                style={{ color: '#D97706', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Wewe ni Raia{' '}
                <span className="text-white">{submitted.verifierCodename}</span>
              </p>
              <p
                style={{ color: '#6B7280', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Ukweli wako hauwezi kufutwa. Your truth is permanent.
              </p>
            </div>

            {locationVerified && (
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2"
                style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)' }}
              >
                <span style={{ fontSize: '12px' }}>📍</span>
                <span
                  className="font-bold"
                  style={{ color: '#16A34A', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
                >
                  GPS VERIFIED — Submitted from project location
                </span>
              </div>
            )}

            <div
              className="w-full rounded-xl p-3 text-left"
              style={{ background: '#0A0A0A', border: '1px solid #1F2937' }}
            >
              <p
                className="font-bold mb-1"
                style={{ color: '#4B5563', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                EVIDENCE ID
              </p>
              <p
                className="font-mono break-all"
                style={{ color: '#9CA3AF', fontSize: '11px' }}
              >
                {submitted._id}
              </p>
            </div>

            <button
              onClick={onClose}
              className="btn-primary w-full"
            >
              Funga · Close
            </button>
          </div>
        ) : (
          /* ── Form ───────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} className="p-5 space-y-5">

            {/* GPS Status block */}
            <div
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{
                background: coordsLoading
                  ? 'rgba(14,165,233,0.08)'
                  : gpsSource === 'live'
                  ? 'rgba(22,163,74,0.08)'
                  : 'rgba(217,119,6,0.08)',
                border: `1px solid ${
                  coordsLoading
                    ? 'rgba(14,165,233,0.25)'
                    : gpsSource === 'live'
                    ? 'rgba(22,163,74,0.25)'
                    : 'rgba(217,119,6,0.25)'
                }`,
              }}
            >
              <div className="flex items-center gap-2.5">
                {coordsLoading ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                      style={{ borderColor: '#0EA5E9', borderTopColor: 'transparent' }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: '#7DD3FC', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Inapata mahali pako... Getting your location
                    </span>
                  </>
                ) : gpsSource === 'live' ? (
                  <>
                    <span className="flex-shrink-0">📍</span>
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: '#4ADE80', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Mahali pamepatikana · Location captured
                      </p>
                      <p
                        className="font-mono"
                        style={{ color: '#6B7280', fontSize: '11px' }}
                      >
                        {coords.lat.toFixed(3)}°N, {coords.lng.toFixed(3)}°E
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex-shrink-0">⚠️</span>
                    <span
                      className="font-semibold"
                      style={{ color: '#FCD34D', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {coordsError || 'GPS unavailable'}
                    </span>
                  </>
                )}
              </div>

              {/* Distance proximity indicator */}
              {!coordsLoading && distanceM !== null && (
                <ProximityBadge distM={distanceM} />
              )}
            </div>

            {/* What did you find? */}
            <div>
              <label
                className="block font-bold uppercase tracking-widest mb-2.5"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Uligundua nini? · What did you find? *
              </label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={{
                        background: active ? `${opt.accent}18` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${active ? opt.accent : '#1F2937'}`,
                        color: active ? opt.accent : '#9CA3AF',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                className="block font-bold uppercase tracking-widest mb-2"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Elezea ulichoona · Describe what you saw *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Mfano — Niko mahali hapo. Hakuna shule. Ninaona uwanja tupu na ua la zamani. Hakuna ujenzi uliowahi kuanza..."
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl resize-none text-sm transition-colors focus:outline-none"
                style={{
                  background: '#0A0A0A',
                  border: '1px solid #1F2937',
                  color: '#F9FAFB',
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.6,
                }}
                onFocus={(e)  => { e.target.style.borderColor = '#D97706'; }}
                onBlur={(e)   => { e.target.style.borderColor = '#1F2937'; }}
              />
              <p
                className="text-right mt-1"
                style={{ color: '#4B5563', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
              >
                {description.length}/500
              </p>
            </div>

            {/* Photo upload */}
            <div>
              <label
                className="block font-bold uppercase tracking-widest mb-2"
                style={{ color: '#6B7280', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}
              >
                Ushahidi wa Picha · Photo Evidence (Optional but powerful)
              </label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={photoPreview}
                    alt="Evidence preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                    style={{ background: '#DC2626', color: '#fff' }}
                  >
                    ✕
                  </button>
                  {locationVerified && (
                    <div
                      className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    >
                      <span style={{ fontSize: '10px' }}>📍</span>
                      <span
                        className="font-bold uppercase tracking-wide"
                        style={{ color: '#4ADE80', fontSize: '9px', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        GPS Verified
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl py-8 text-center transition-all duration-200 group"
                  style={{
                    border: '2px dashed #1F2937',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D97706'; e.currentTarget.style.background = 'rgba(217,119,6,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="text-3xl mb-2">📸</div>
                  <p
                    className="font-semibold"
                    style={{ color: '#9CA3AF', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Bonyeza kupiga picha au kupakia
                  </p>
                  <p
                    style={{ color: '#4B5563', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", marginTop: '4px' }}
                  >
                    EXIF metadata stripped before storage — your location stays private
                  </p>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Anonymity notice */}
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{
                background: 'rgba(27,67,50,0.3)',
                border: '1px solid rgba(27,67,50,0.6)',
              }}
            >
              <span className="flex-shrink-0 text-base">🔒</span>
              <p
                style={{ color: '#9CA3AF', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
              >
                <strong style={{ color: '#D1D5DB' }}>100% Anonymous.</strong>{' '}
                You will be assigned a random animal codename. No IP addresses are logged.
                No personal data stored. GPS coordinates rounded to 100m grid for privacy.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!status || !description.trim() || coordsLoading || submitting}
              className="w-full font-bold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#D97706',
                color: '#0A0A0A',
                fontSize: '15px',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 20px rgba(217,119,6,0.3)',
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#F59E0B'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#D97706'; }}
            >
              {submitting ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#0A0A0A', borderTopColor: 'transparent' }}
                  />
                  Inawasilisha...
                </>
              ) : (
                <>🇰🇪 Wasilisha Ushahidi wa Umma</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyModal;
