import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import VerifyModal from '../components/VerifyModal';

// Fix Leaflet icon paths for Vite
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_CONFIG = {
  'GHOST PROJECT':  { color: '#7c3aed', bg: 'bg-purple-100 text-purple-800', label: '👻 Ghost', radius: 14 },
  'STALLED':        { color: '#ea580c', bg: 'bg-orange-100 text-orange-800', label: '🚧 Stalled', radius: 13 },
  'ABANDONED':      { color: '#dc2626', bg: 'bg-red-100 text-red-800', label: '⛔ Abandoned', radius: 13 },
  'DISPUTED':       { color: '#d97706', bg: 'bg-yellow-100 text-yellow-800', label: '⚠️ Disputed', radius: 12 },
  'MISALLOCATED':   { color: '#0891b2', bg: 'bg-cyan-100 text-cyan-800', label: '🔀 Misallocated', radius: 12 },
  'Complete':       { color: '#16a34a', bg: 'bg-green-100 text-green-800', label: '✅ Verified', radius: 11 },
};

const VERIFY_STATUS_CONFIG = {
  CONFIRMS_GHOST:    { color: '#7c3aed', label: '👻 Ghost confirmed' },
  CONFIRMS_STALLED:  { color: '#ea580c', label: '🚧 Stalled confirmed' },
  CONFIRMS_COMPLETE: { color: '#16a34a', label: '✅ Working' },
  DISPUTES_OFFICIAL: { color: '#d97706', label: '⚠️ Disputes report' },
};

const FlyToProject = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 14, { animate: true, duration: 1.2 });
  }, [coords, map]);
  return null;
};

const VerificationMap = () => {
  const [projects, setProjects] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, verRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/verifications/map'),
        ]);
        const projData = await projRes.json();
        const verData = await verRes.json();
        setProjects((projData.data || []).filter(p => p.lat && p.lng));
        setVerifications(verData.data || []);
      } catch (e) {
        console.error('Map data fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleVerifySuccess = (newVer) => {
    setVerifications((prev) => [newVer, ...prev]);
    setVerifyTarget(null);
  };

  const filteredProjects = filter === 'ALL'
    ? projects
    : projects.filter(p => p.communityStatus === filter);

  const totalFlagged = projects.filter(p => ['GHOST PROJECT', 'STALLED', 'ABANDONED', 'DISPUTED'].includes(p.communityStatus)).length;
  const verificationCount = verifications.length;

  // Count verifications per project
  const verCountMap = {};
  verifications.forEach(v => {
    verCountMap[v.projectId] = (verCountMap[v.projectId] || 0) + 1;
  });

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)', minHeight: 500 }}>

      {/* Page Header */}
      <div className="bg-forest-900 text-white px-4 py-4 sm:px-6 border-b-4 border-amber-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-white flex items-center gap-2">
              🗺️ Evidence Map
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse">LIVE</span>
            </h1>
            <p className="text-forest-300 text-sm mt-0.5">Click any marker to view evidence. Tap "Verify" to add your own.</p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-amber-400 text-2xl font-black">{totalFlagged}</p>
              <p className="text-forest-400 text-xs uppercase tracking-wider font-semibold">Flagged Sites</p>
            </div>
            <div className="w-px bg-forest-700" />
            <div>
              <p className="text-green-400 text-2xl font-black">{verificationCount}</p>
              <p className="text-forest-400 text-xs uppercase tracking-wider font-semibold">Citizen Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
        {['ALL', 'GHOST PROJECT', 'STALLED', 'ABANDONED', 'DISPUTED'].map((f) => {
          const conf = STATUS_CONFIG[f] || { bg: 'bg-gray-100 text-gray-800' };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${
                filter === f
                  ? f === 'ALL' ? 'bg-forest-900 text-white border-forest-900' : conf.bg + ' border-current'
                  : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL' ? '🗺️ All Projects' : conf.label || f}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/90 z-[500] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-forest-900 font-semibold">Loading evidence map...</p>
            </div>
          </div>
        )}

        {/* Empty state — shown when DB has no seeded projects yet */}
        {!loading && projects.length === 0 && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <div
              className="rounded-2xl p-8 text-center max-w-sm mx-4"
              style={{ background: '#111827', border: '1px solid #1F2937', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
            >
              <div className="text-5xl mb-4">🗺️</div>
              <h3 className="font-display text-white mb-2" style={{ fontSize: '20px' }}>Map Loading Soon</h3>
              <p className="mb-1" style={{ color: '#D97706', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' }}>Ramani Inaandaliwa</p>
              <p className="mb-5" style={{ color: '#6B7280', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                Project markers will appear here once the Aldai constituency audit database is seeded.
                The map is ready — data is being loaded.
              </p>
              <a
                href="/report"
                className="inline-block font-bold py-2.5 px-6 rounded-xl transition-all"
                style={{ background: '#DC2626', color: '#fff', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}
              >
                🚨 Report an Issue Now
              </a>
              <p className="mt-3" style={{ color: '#374151', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}>
                Your reports will appear on this map immediately.
              </p>
            </div>
          </div>
        )}
        <MapContainer
          center={[0.18, 35.25]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {flyTarget && <FlyToProject coords={flyTarget} />}

          {/* Project markers */}
          {filteredProjects.map((project) => {
            const cfg = STATUS_CONFIG[project.communityStatus] || STATUS_CONFIG['Complete'];
            const verCount = verCountMap[project.id?.toString() || project._id?.toString()] || 0;
            return (
              <CircleMarker
                key={project._id || project.id}
                center={[project.lat, project.lng]}
                radius={cfg.radius}
                pathOptions={{
                  fillColor: cfg.color,
                  color: '#fff',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedProject(project);
                    setFlyTarget([project.lat, project.lng]);
                  },
                }}
              >
                <Popup className="custom-popup" maxWidth={300}>
                  <div className="p-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-forest-900 text-sm leading-tight">{project.name}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">📍 {project.ward} Ward · {project.fund} · Ksh {project.allocated?.toLocaleString()}</p>
                    <p className="text-xs text-gray-700 italic mb-3 leading-relaxed">{project.auditNote}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-forest-700 font-semibold">
                        {verCount > 0 ? `📸 ${verCount} citizen verification${verCount > 1 ? 's' : ''}` : '📸 No verifications yet'}
                      </span>
                      <button
                        onClick={() => setVerifyTarget(project)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Verify →
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Citizen verification markers (smaller, pulsing ring) */}
          {verifications.map((v) => {
            const cfg = VERIFY_STATUS_CONFIG[v.status];
            if (!cfg) return null;
            return (
              <CircleMarker
                key={v._id}
                center={[v.lat, v.lng]}
                radius={5}
                pathOptions={{
                  fillColor: cfg.color,
                  color: cfg.color,
                  weight: 1,
                  opacity: 0.8,
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-gray-800">{cfg.label}</p>
                    <p className="text-gray-600 mt-1 font-medium">Citizen {v.verifierCodename}</p>
                    {v.photoUrl && (
                      <img src={v.photoUrl} alt="evidence" className="mt-2 w-full h-28 object-cover rounded-lg" />
                    )}
                    <p className="text-gray-500 mt-1">{new Date(v.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 text-xs space-y-1.5 border border-gray-200 max-w-[160px]">
          <p className="font-black text-forest-900 uppercase tracking-wider text-[10px] mb-2">Legend</p>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: val.color }} />
              <span className="text-gray-700 text-[11px]">{val.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-purple-400 opacity-70" />
              <span className="text-gray-500 text-[11px]">Citizen reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {verifyTarget && (
        <VerifyModal
          project={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onSuccess={handleVerifySuccess}
        />
      )}
    </div>
  );
};

export default VerificationMap;
