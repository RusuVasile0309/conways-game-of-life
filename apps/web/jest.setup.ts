class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// JSDOM does not support Web Workers. Provide a no-op stub so component tests
// that mount Page (which creates a Worker via useSimWorker) don't crash.
const MockWorker = jest.fn().mockImplementation(() => ({
  onmessage: null,
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

global.Worker = MockWorker as unknown as typeof Worker;
