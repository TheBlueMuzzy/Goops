
export const isMobile = typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// iOS WebKit detection - Chrome/Safari on iOS use WebKit which has incomplete Pointer Events support
export const isIOSWebKit = typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod/i.test(navigator.userAgent);
