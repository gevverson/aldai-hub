import { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ targetValue, duration = 2000, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const raw = easeOutQuart * targetValue;
      setCount(decimals > 0 ? parseFloat(raw.toFixed(decimals)) : Math.floor(raw));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration, isVisible, decimals]);

  // Format number — use toFixed for decimals, commas for integers
  const formattedCount = decimals > 0
    ? count.toFixed(decimals)
    : new Intl.NumberFormat('en-US').format(count);

  return (
    <span ref={counterRef}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
};

export default AnimatedCounter;
