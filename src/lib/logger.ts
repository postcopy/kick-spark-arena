/**
 * Debug logger that only outputs in development or when VITE_DEBUG is set.
 * In production builds, all log calls are no-ops for performance.
 */
const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === '1';

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  error: console.error.bind(console), // errors always log
  debug: isDev ? console.debug.bind(console) : () => {},
};
