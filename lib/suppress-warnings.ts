/**
 * Suppress specific Next.js 15+ warnings that don't affect functionality
 * 
 * @description
 * This utility suppresses console warnings about params/searchParams being Promises
 * when using react-joyride. These warnings are cosmetic and don't affect the tour
 * functionality, but clutter the console during development.
 * 
 * @problem
 * Next.js 15+ automatically passes params/searchParams as Promises to all client
 * components in the tree. The react-joyride library enumerates component props
 * internally, which triggers Next.js warnings about accessing these Promises directly.
 * 
 * @solution
 * Since the tour functionality works perfectly and these are only warnings, we
 * suppress them at the console level to maintain a clean development experience.
 * 
 * @see https://nextjs.org/docs/messages/sync-dynamic-apis
 * @see https://github.com/gilbarbara/react-joyride/issues
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
