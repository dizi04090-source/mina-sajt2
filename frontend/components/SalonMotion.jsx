'use client';
import { useEffect } from 'react';

// One passive listener and one frame update for all decorative scroll motion.
export function useSalonScroll(root) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const artwork = [...element.querySelectorAll('[data-scroll-art]')];
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const range = document.documentElement.scrollHeight - height;
      element.style.setProperty('--scroll-progress', String(range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0));
      artwork.forEach(node => {
        const rect = node.parentElement.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / height));
        node.style.setProperty('--art-drift', preference.matches ? '0px' : `${progress * 24}px`);
        node.style.setProperty('--art-turn', preference.matches ? '0deg' : `${progress * 16}deg`);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    preference.addEventListener('change', schedule);
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resize?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      preference.removeEventListener('change', schedule);
    };
  }, [root]);
}

export function MotionBloom({ className = '' }) {
  return <div className={`motion-bloom ${className}`} data-scroll-art aria-hidden="true">
    <svg viewBox="0 0 240 240" fill="none" focusable="false">
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <ellipse key={angle} cx="120" cy="81" rx="25" ry="64" transform={`rotate(${angle} 120 120)`} />)}
      <circle cx="120" cy="120" r="19" />
      <circle className="bloom-orbit" cx="120" cy="120" r="109" />
    </svg>
  </div>;
}
