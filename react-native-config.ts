declare global {
  var RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS: boolean;
  var __DEV__: boolean;
}

if (global.__DEV__) {
  global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

  // 콘솔 경고 원본 참조 저장
  const originalWarn = console.warn;

  console.warn = (...args: any[]) => {
    const suppressPatterns = [
      'This v8 method is deprecated',
      'Please use `getApp()`',
      'Please use `doc()`',
      'Please use `getDoc()`',
      'Please use `updateDoc()`',
      'match Firebase Web modular v9 SDK API',
    ];

    const shouldSuppressWarning = suppressPatterns.some(
      pattern =>
        args.length > 0 &&
        typeof args[0] === 'string' &&
        args[0].includes(pattern),
    );

    if (!shouldSuppressWarning) {
      originalWarn(...args);
    }
  };
}

export {};
