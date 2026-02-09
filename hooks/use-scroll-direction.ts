'use client';

import { useState, useEffect } from 'react';

interface ScrollDirectionState {
  scrollDirection: 'up' | 'down' | null;
  scrollY: number;
  isHidden: boolean;
}

export function useScrollDirection(threshold: number = 100): ScrollDirectionState {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide after scrolling past threshold
      if (currentScrollY > threshold) {
        if (currentScrollY > lastScrollY) {
          // Scrolling down - hide
          setScrollDirection('down');
          setIsHidden(true);
        } else {
          // Scrolling up - show
          setScrollDirection('up');
          setIsHidden(false);
        }
      } else {
        // At top - always show
        setScrollDirection(null);
        setIsHidden(false);
      }

      setScrollY(currentScrollY);
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { scrollDirection, scrollY, isHidden };
}
