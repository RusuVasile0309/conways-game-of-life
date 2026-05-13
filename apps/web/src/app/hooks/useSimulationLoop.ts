import { useEffect, useRef } from 'react';

export function useSimulationLoop(
  isRunning: boolean,
  genPerSecRef: React.MutableRefObject<number>,
  onTick: () => void,
) {
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!isRunning) return;
    let lastTime = performance.now();
    let handle: number;
    const tick = (now: number) => {
      const elapsed = now - lastTime;
      const interval = 1000 / genPerSecRef.current;
      if (elapsed >= interval) {
        lastTime = now - (elapsed % interval);
        onTickRef.current();
      }
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [isRunning, genPerSecRef]);
}
