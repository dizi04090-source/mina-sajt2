'use client';
import { useEffect } from 'react';

// One passive listener and one frame update for all decorative scroll motion.
export function useSalonScroll(root, enabled = true) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
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
        node.style.setProperty('--art-drift', enabled ? `${progress * 24}px` : '0px');
        node.style.setProperty('--art-turn', enabled ? `${progress * 16}deg` : '0deg');
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    resize?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [root, enabled]);
}

// Delegation includes dialog buttons rendered through a portal.
export function useButtonMotion(enabled) {
  useEffect(() => {
    if (!enabled) return;
    let active = null, bounds = null;
    const timers = new Set();
    const find = target => target instanceof Element ? target.closest('.mina-site button:not(:disabled), .mina-site a, .modal-overlay button:not(:disabled)') : null;
    const reset = () => {
      active?.style.removeProperty('--magnet-x');
      active?.style.removeProperty('--magnet-y');
      active = null; bounds = null;
    };
    const move = event => {
      if (event.pointerType !== 'mouse') return;
      const button = find(event.target);
      if (button !== active) { reset(); active = button; bounds = button?.getBoundingClientRect(); }
      if (!bounds) return;
      active.style.setProperty('--magnet-x', `${Math.max(-9, Math.min(9, (event.clientX - bounds.left - bounds.width / 2) * .12))}px`);
      active.style.setProperty('--magnet-y', `${Math.max(-6, Math.min(6, (event.clientY - bounds.top - bounds.height / 2) * .2))}px`);
    };
    const leave = event => { if (active && !active.contains(event.relatedTarget)) reset(); };
    const click = event => {
      const button = find(event.target);
      if (!button) return;
      button.classList.remove('click-pop');
      void button.offsetWidth;
      button.classList.add('click-pop');
      const timer = setTimeout(() => { button.classList.remove('click-pop'); timers.delete(timer); }, 480);
      timers.add(timer);
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('click', click);
    return () => {
      reset(); timers.forEach(clearTimeout);
      document.querySelectorAll('.click-pop').forEach(node => node.classList.remove('click-pop'));
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('click', click);
    };
  }, [enabled]);
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
