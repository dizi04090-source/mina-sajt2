'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, reduced = false }) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => dialog.current?.querySelector('button')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, title]);
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
    {open && <motion.div data-motion={reduced ? 'quiet' : 'full'} className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="modal-dialog" initial={{ opacity: 0, scale: reduced ? 1 : .92, y: reduced ? 0 : 28 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: reduced ? 1 : .97, y: reduced ? 0 : 8 }} transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-3xl text-mina">{title}</h2><button type="button" onClick={onClose} aria-label="Zatvori" title="Zatvori" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lav text-mina"><X size={18} /></button></div>
        {children}
      </motion.section>
    </motion.div>}
  </AnimatePresence>, document.body);
}

