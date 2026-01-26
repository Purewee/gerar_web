'use client';

import { useEffect } from 'react';

export function FontLoader() {
  useEffect(() => {
    // Load fonts asynchronously to avoid render-blocking
    const robotoLink = document.createElement('link');
    robotoLink.rel = 'stylesheet';
    robotoLink.href =
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
    robotoLink.media = 'print';
    robotoLink.onload = () => {
      robotoLink.media = 'all';
    };
    document.head.appendChild(robotoLink);
  }, []);

  return null;
}
