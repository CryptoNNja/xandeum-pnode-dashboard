/**
 * Suppress specific Next.js 15+ warnings that don't affect functionality
 * 
 * This file suppresses console warnings about params/searchParams being Promises
 * when using react-joyride. These warnings are cosmetic and don't affect the tour
 * functionality, but clutter the console during development.
 * 
 * Related issue: Next.js 15+ automatically passes params/searchParams as Promises,
 * and react-joyride enumerates component props which triggers these warnings.
 */

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Patterns to suppress
  const suppressPatterns = [
    /params are being enumerated/i,
    /searchParams.*was accessed directly/i,
    /The keys of.*searchParams.*were accessed directly/i,
    /must be unwrapped with.*React\.use\(\)/i,
  ];

  const shouldSuppress = (message: string): boolean => {
    return suppressPatterns.some(pattern => pattern.test(message));
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };
}

export {};
