import { renderHook } from '@testing-library/react';
import { useSimulationLoop } from './useSimulationLoop';

describe('useSimulationLoop', () => {
  let cancelSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    cancelSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not re-run the rAF loop when genPerSecRef.current changes mid-run', () => {
    const genPerSecRef = { current: 10 } as React.MutableRefObject<number>;
    const onTick = jest.fn();

    const { rerender } = renderHook(
      ({ isRunning }: { isRunning: boolean }) =>
        useSimulationLoop(isRunning, genPerSecRef, onTick),
      { initialProps: { isRunning: true } },
    );

    // Loop is running — effect cleanup has not been called
    expect(cancelSpy).not.toHaveBeenCalled();

    // Simulate slider change: only .current changes, the ref object is the same
    genPerSecRef.current = 30;

    // Re-render as React would after the genPerSec state update in Page
    rerender({ isRunning: true });

    // cancelAnimationFrame must NOT have been called — the effect did not re-run
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
