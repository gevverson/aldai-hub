import { useState, useEffect } from 'react';

const STATUS_LABELS = {
  CONFIRMS_GHOST: { label: '👻 Ghost Confirmed', color: 'text-purple-400' },
  CONFIRMS_STALLED: { label: '🚧 Stalled Confirmed', color: 'text-orange-400' },
  CONFIRMS_COMPLETE: { label: '✅ Working', color: 'text-green-400' },
  DISPUTES_OFFICIAL: { label: '⚠️ Disputes Report', color: 'text-yellow-400' },
};

const AlertTicker = () => {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const fallbackItems = [
    { projectName: 'Kimaren Girls Secondary', ward: 'Kemeloi-Maraba', status: 'CONFIRMS_GHOST', verifierCodename: 'Simba' },
    { projectName: 'Kapsengere Hospital Phase II', ward: 'Terik', status: 'CONFIRMS_STALLED', verifierCodename: 'Tembo' },
    { projectName: 'Kabiyet Dairy Creamery', ward: 'Kabiyet', status: 'CONFIRMS_STALLED', verifierCodename: 'Twiga' },
  ];

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/verifications/recent');
        const data = await res.json();
        if (data && data.length > 0) setItems(data);
        else setItems(fallbackItems);
      } catch {
        setItems(fallbackItems);
      }
    };
    fetchRecent();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [items]);

  if (items.length === 0) return null;

  const current = items[index];
  const statusInfo = STATUS_LABELS[current.status] || { label: current.status, color: 'text-white' };

  return (
    <div className="bg-red-900/95 border-b border-red-700 py-2 px-4 flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <span className="text-red-200 text-xs font-black uppercase tracking-widest whitespace-nowrap">LIVE</span>
      </div>
      <div className={`flex-1 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-xs text-white truncate">
          <span className="font-bold">Citizen {current.verifierCodename}</span>
          {' · '}
          <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
          {' · '}
          <span className="text-red-200">{current.projectName}</span>
          {' — '}
          <span className="text-red-300">{current.ward} Ward</span>
        </p>
      </div>
      <div className="hidden sm:flex gap-1 shrink-0">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-red-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AlertTicker;
