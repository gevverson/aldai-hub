import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedCounter — counts up from 0 to targetValue when scrolled into view.
 * Uses IntersectionObserver + rAF with easeOutExpo easing.
 *
 * Props:
 *   targetValue  — number to count to
 *   duration     — ms (default 2000)
 *   decimals     — decimal places (default 0)
 *   prefix       — string before number
 *   suffix       — string after number
 *   className    — extra classes on the <span>
 */
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const AnimatedCounter = ({
  targetValue,
  duration = 2000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const [count, setCount]       = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Trigger once on intersection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [triggered]);

  // Animate when triggered
  useEffect(() => {
    if (!triggered) return;

    startRef.current = null;
    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutExpo(progress);
      const value    = eased * targetValue;

      setCount(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [triggered, targetValue, duration, decimals]);

  const display =
    decimals > 0
      ? count.toFixed(decimals)
      : new Intl.NumberFormat('en-KE').format(count);

  return (
    <span ref={ref} className={`font-mono-jet tabular-nums ${className}`}>
      {prefix}{display}{suffix}
    </span>
  );
};

export default AnimatedCounter;
