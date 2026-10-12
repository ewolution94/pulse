// Work that settles within `timeoutMs`, one way or the other — on our clock. Clinch's
// server/src/deadline.ts, with its error given a class of its own and an optional outer signal
// (Prospekt's copy).
//
// The signal handed to `work` is the polite half: it asks `fetch` to stop. It is not the
// guarantee. On 2026-10-09 one of Clinch's polls never settled at all, although its request had
// been aborted after 12 seconds: no result, no error, no timeout, and everything that waited on it
// waited with it for two days. The race below rejects at the deadline whatever `work` does, and if
// `work` turns up afterwards its answer goes nowhere.

/** The deadline passed before the work settled. */
export class DeadlineError extends Error {
  constructor(timeoutMs: number) {
    super(`no answer within ${timeoutMs}ms`);
    this.name = "DeadlineError";
  }
}

/** @param outer  ends the work early too, with its reason. */
export function withDeadline<T>(timeoutMs: number, work: (signal: AbortSignal) => Promise<T>, outer?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  let stop: (() => void) | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    const end = (error: unknown) => {
      controller.abort(error);
      reject(error);
    };
    timer = setTimeout(() => end(new DeadlineError(timeoutMs)), timeoutMs);
    if (outer) {
      stop = () => end(outer.reason);
      if (outer.aborted) stop();
      else outer.addEventListener("abort", stop, { once: true });
    }
  });
  return Promise.race([work(controller.signal), deadline]).finally(() => {
    clearTimeout(timer);
    if (stop) outer?.removeEventListener("abort", stop);
  });
}
