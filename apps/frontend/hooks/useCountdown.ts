import { useState, useEffect, useCallback } from 'react';

export function useCountdown(initial: number) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (count <= 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  const restart = useCallback(() => {
    setCount(initial);
  }, [initial]);

  return { count, expired: count <= 0, restart };
}