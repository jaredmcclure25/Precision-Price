/**
 * Mobile Detection Hook
 * Detects mobile devices and screen sizes
 */

import { useState, useEffect } from 'react';

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();

      // Check by user agent
      const isMobileUA = /iphone|ipad|ipod|android|blackberry|windows phone|webos/i.test(userAgent);

      // Check by screen width
      const isMobileWidth = width < 768;
      const isTabletWidth = width >= 768 && width < 1024;
      const isDesktopWidth = width >= 1024;

      setIsMobile(isMobileUA || isMobileWidth);
      setIsTablet(isTabletWidth && !isMobileUA);
      setIsDesktop(isDesktopWidth && !isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isTablet, isDesktop };
}
