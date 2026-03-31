import { useState, useEffect, useRef } from 'react';

const STATUS_OPTIONS = [
  { value: 'CONFIRMS_GHOST', label: '👻 I went there — nothing exists', color: 'border-purple-500 bg-purple-50 text-purple-800' },
  { value: 'CONFIRMS_STALLED', label: '🚧 Project exists but is abandoned / stalled', color: 'border-orange-500 bg-orange-50 text-orange-800' },
  { value: 'DISPUTES_OFFICIAL', label: '⚠️ Something is wrong / incomplete', color: 'border-yellow-500 bg-yellow-50 text-yellow-800' },
  { value: 'CONFIRMS_COMPLETE', label: '✅ Project is working and complete', color: 'border-green-500 bg-green-50 text-green-800' },
];

const VerifyModal = ({ project, onClose, onSuccess }) => {
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [coords, setCoords] = useState(null);
  const [coordsLoading, setCoordsLoading] = useState(false);
  const [coordsError, setCoordsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    // Auto-capture GPS when modal opens
    setCoordsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setCoordsLoading(false);
        },
        () => {
          // Fallback to project coordinates if GPS denied
          setCoords({ lat: project.lat, lng: project.lng });
          setCoordsError('GPS unavailable — using project location as fallback.');
          setCoordsLoading(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setCoords({ lat: project.lat, lng: project.lng });
      setCoordsError('GPS not supported on this device.');
      setCoordsLoading(false);
    }
  }, [project]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status || !description.trim() || !coords) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('projectId', project.id?.toString() || project._id?.toString());
      formData.append('projectName', project.name);
      formData.append('ward', project.ward);
      formData.append('lat', coords.lat.toString());
      formData.append('lng', coords.lng.toString());
      formData.append('description', description);
      formData.append('status', status);
      if (photo) formData.append('photo', photo);

      const res = await fetch('/api/verifications', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(data.verification);
        if (onSuccess) onSuccess(data.verification);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-forest-900 px-5 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Citizen Verification</p>
            <h2 className="text-white font-bold text-base leading-tight">{project.name}</h2>
            <p className="text-forest-300 text-xs">{project.ward} Ward</p>
          </div>
          <button onClick={onClose} className="text-forest-300 hover:text-white p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🦅</div>
            <h3 className="text-2xl font-bold text-forest-900 mb-2">Evidence Submitted!</h3>
            <p className="text-gray-600 mb-2">You are now <span className="font-bold text-amber-600">Citizen {submitted.verifierCodename}</span></p>
            <p className="text-sm text-gray-500 mb-6">Your GPS-tagged evidence is now permanently on the public record. The truth cannot be erased.</p>
            <div className="bg-forest-50 rounded-xl p-4 text-left border border-forest-200 mb-6">
              <p className="text-xs text-forest-700 font-bold mb-1">📡 Evidence ID</p>
              <p className="text-xs font-mono text-gray-600 break-all">{submitted._id}</p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* GPS Status */}
            <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
              coordsLoading ? 'bg-blue-50 border border-blue-200' :
              coords ? 'bg-green-50 border border-green-200' :
              'bg-red-50 border border-red-200'
            }`}>
              {coordsLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-blue-700 font-medium">Getting your GPS location...</span>
                </>
              ) : coords ? (
                <>
                  <span className="text-green-600 shrink-0">📍</span>
                  <span className="text-green-700 font-medium">
                    Location captured: {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                    {coordsError && <span className="block text-xs text-orange-600 mt-0.5">{coordsError}</span>}
                  </span>
                </>
              ) : (
                <span className="text-red-700">Could not capture location.</span>
              )}
            </div>

            {/* Status Select */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">
                What did you find? *
              </label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                      status === opt.value ? opt.color + ' border-current' : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">
                Describe what you saw *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="E.g. — I am at the location. There is no school here. I can see an empty field with some old fencing. No construction has ever started..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 text-right">{description.length}/500</p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">
                Photo Evidence (Optional but powerful)
              </label>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow"
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 text-center hover:border-amber-500 hover:bg-amber-50 transition-all group"
                >
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm font-semibold text-gray-600 group-hover:text-amber-700">Tap to take a photo or upload</p>
                  <p className="text-xs text-gray-400 mt-1">Your camera will open</p>
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
            <div className="bg-forest-50 border border-forest-200 rounded-lg p-3 text-xs text-forest-700">
              🔒 <strong>100% Anonymous.</strong> You will be assigned a random animal codename. No IP addresses are logged. No personal data is stored.
            </div>

            <button
              type="submit"
              disabled={!status || !description.trim() || !coords || coordsLoading || submitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Evidence...
                </>
              ) : (
                <>🇰🇪 Submit Public Evidence</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyModal;
