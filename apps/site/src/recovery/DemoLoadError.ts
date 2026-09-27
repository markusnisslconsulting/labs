/** Distinguishes module loading from errors thrown while rendering a loaded demo. */
export class DemoLoadError extends Error {
  constructor(cause: unknown) {
    super("Unable to load the demo module", { cause });
  }
}
