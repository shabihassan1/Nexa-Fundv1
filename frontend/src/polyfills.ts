// Polyfills for browser compatibility with ethers.js and other Node.js modules
import { Buffer } from 'buffer';

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
}

export { Buffer };
