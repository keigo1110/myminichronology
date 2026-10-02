import { waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { parseExcel } from '../lib/parseExcel';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { TestWorker.instances.push(this); }
}
describe('Excel worker lifecycle', () => {
  beforeEach(() => { TestWorker.instances = []; vi.stubGlobal('Worker', TestWorker); });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
  it('transfers the buffer, propagates typed failures and terminates the worker', async () => {
    const promise = parseExcel(new File(['x'], 'file.xlsx'));
    const rejected = expect(promise).rejects.toMatchObject({ code: 'parse.tooManyEvents', params: { max: 5000 } });
    await waitFor(() => expect(TestWorker.instances).toHaveLength(1));
    const worker = TestWorker.instances[0];
    const [buffer, transfers] = worker.postMessage.mock.calls[0];
    expect(transfers).toEqual([buffer]);
    worker.onmessage?.({ data: { error: { code: 'parse.tooManyEvents', params: { max: 5000 } } } } as MessageEvent);
    await rejected; expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('terminates CPU work on cancellation', async () => {
    const controller = new AbortController();
    const promise = parseExcel(new File(['x'], 'file.xlsx'), controller.signal);
    const rejected = expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await waitFor(() => expect(TestWorker.instances).toHaveLength(1));
    controller.abort(); await rejected; expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
  it('stops a worker that exceeds the parsing deadline', async () => {
    const file = new File(['x'], 'file.xlsx');
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new ArrayBuffer(1) });
    vi.useFakeTimers();
    const rejected = expect(parseExcel(file)).rejects.toMatchObject({ code: 'parse.timedOut' });
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected; expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
});
