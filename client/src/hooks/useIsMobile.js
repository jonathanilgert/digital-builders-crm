import { useState, useEffect } from 'react';

export default function useIsMobile(breakpoint = 900) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setM(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return m;
}
