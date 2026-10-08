'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function usePageMotion(sceneKey) {
  const root = useRef(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const sections = element.querySelectorAll('[data-reveal], main > section, main > div');
        sections.forEach((section, index) => {
          gsap.fromTo(section, { autoAlpha: 0, y: 18 }, {
            autoAlpha: 1, y: 0, duration: 0.55, delay: Math.min(index * 0.055, 0.2),
            ease: 'power3.out', clearProps: 'opacity,visibility,transform',
            scrollTrigger: { trigger: section, start: 'top 96%', once: true },
          });
        });
        element.querySelectorAll('[data-parallax]').forEach(image => {
          gsap.fromTo(image, { yPercent: -3 }, {
            yPercent: 3, ease: 'none',
            scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
      });
    }, element);
    return () => { media.revert(); context.revert(); };
  }, [sceneKey]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = null;
    let moveX, moveY, rotateX, rotateY;
    const context = gsap.context(() => {}, element);
    const reset = () => {
      if (!active) return;
      const target = active;
      context.add(() => gsap.to(target, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.65, ease: 'elastic.out(1,0.45)', overwrite: 'auto' }));
      active = null;
    };
    const move = event => {
      if (!fine.matches || reduced.matches || event.pointerType === 'touch') return;
      const target = event.target.closest('[data-magnetic], [data-tilt]');
      if (!target || target.disabled) return reset();
      if (active !== target) {
        reset(); active = target;
        context.add(() => {
          if (target.hasAttribute('data-tilt')) gsap.set(target, { transformPerspective: 800 });
          moveX = gsap.quickTo(target, 'x', { duration: 0.35, ease: 'power3.out' });
          moveY = gsap.quickTo(target, 'y', { duration: 0.35, ease: 'power3.out' });
          rotateX = gsap.quickTo(target, 'rotateX', { duration: 0.4, ease: 'power3.out' });
          rotateY = gsap.quickTo(target, 'rotateY', { duration: 0.4, ease: 'power3.out' });
        });
      }
      const box = target.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      if (target.hasAttribute('data-tilt')) { rotateX(-y * 6); rotateY(x * 6); }
      else { moveX(x * 10); moveY(y * 8); }
    };
    let pressed = null;
    const press = event => {
      const button = event.target.closest('button');
      if (reduced.matches || !button || button.disabled) return;
      pressed = button;
      context.add(() => gsap.to(button, { scale: 0.97, duration: 0.1, overwrite: 'auto' }));
    };
    const release = () => {
      if (!pressed) return;
      const target = pressed; pressed = null;
      context.add(() => gsap.to(target, { scale: 1, duration: 0.4, ease: 'back.out(2)', overwrite: 'auto' }));
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', reset);
    element.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', reset);
      element.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      context.revert();
    };
  }, [sceneKey]);
  return root;
}

export function HeroImage() {
  return <img data-parallax className="hero-image" src="/images/hero-wellness-v2.webp" alt="Opuštajući tretman lica u wellness salonu" fetchPriority="high" />;
}

export function Modal({ open, onClose, title, children }) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const focusable = dialog.current?.querySelectorAll('button:not(:disabled), input, textarea, select, a[href], [tabindex="0"]');
      if (!focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open]);
  if (typeof document === 'undefined') return null;
  return createPortal(<AnimatePresence>
    {open && <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15 }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="modal-dialog" initial={{ opacity: 0, scale: reduced ? 1 : 0.94, y: reduced ? 0 : 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : 0.98, y: reduced ? 0 : 8 }} transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1.2, 0.3, 1] }}>
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl text-mina">{title}</h2><button type="button" onClick={onClose} aria-label="Zatvori" title="Zatvori" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lav text-mina"><X size={18} /></button></div>
        {children}
      </motion.section>
    </motion.div>}
  </AnimatePresence>, document.body);
}
