import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import QuickStats from '../components/QuickStats';
import WardSelector from '../components/WardSelector';

const Home = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from our backend API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/projects/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      <Hero globalStats={stats} />
      <QuickStats stats={stats} />
      <WardSelector />
    </div>
  );
};

export default Home;
