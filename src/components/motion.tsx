'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Motion primitives for Green Owl Labs.
 *
 * Rules enforced here:
 * - only transform / opacity (and stroke-dashoffset in SVG) are animated;
 * - every helper degrades to a plain fade (or no motion) when the user
 *   requests reduced motion;
 * - observers disconnect after the first reveal so nothing loops offscreen.
 */

const ENTRY_EASE = 'cubic-bezier(.16,1,.3,1)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Reveals every `[data-reveal]` descendant once it enters the viewport.
 * Returns the container ref; no wrapper element is added, so grid layouts
 * are preserved.
 */
export function useScrollReveal<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    // Anything already inside the viewport animates in right away; observers
    // are throttled in background tabs and would otherwise leave it hidden.
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const pending: HTMLElement[] = [];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.top < viewport - 24 && rect.bottom > 0) node.classList.add('is-visible');
      else pending.push(node);
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    pending.forEach((node) => observer.observe(node));
    // Safety net: never leave content invisible if the observer cannot run.
    const fallback = window.setTimeout(() => {
      pending.forEach((node) => node.classList.add('is-visible'));
    }, 1800);
    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/**
 * FLIP reordering: measure `[data-flip-id]` children after each commit and
 * slide them from their previous position with a transform-only animation.
 */
export function useFlip<T extends HTMLElement>(dep: unknown, selector = '[data-flip-id]') {
  const ref = useRef<T>(null);
  const previous = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const next = new Map<string, DOMRect>();
    const reduced = prefersReducedMotion();
    for (const node of nodes) {
      const id = node.dataset.flipId;
      if (!id) continue;
      const rect = node.getBoundingClientRect();
      next.set(id, rect);
      const before = previous.current.get(id);
      if (reduced || !before) continue;
      const dx = before.left - rect.left;
      const dy = before.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 220, easing: ENTRY_EASE },
      );
    }
    previous.current = next;
  }, [dep, selector]);

  return ref;
}

/**
 * Focus trap + Escape handling for drawers and modals.
 * Restores focus to the previously active element on unmount.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose: () => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => {
      if (!node) return [] as HTMLElement[];
      return Array.from(node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };
    const timer = window.setTimeout(() => {
      const first = focusables()[0];
      (first ?? node)?.focus();
    }, 30);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [active]);

  return ref;
}

/** Very subtle pointer parallax, capped in pixels and disabled for reduced motion. */
export function useParallax<T extends HTMLElement>(max = 6) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        el.style.setProperty('--px', `${(dx * max).toFixed(2)}px`);
        el.style.setProperty('--py', `${(dy * max).toFixed(2)}px`);
      });
    };
    const onLeave = () => {
      el.style.setProperty('--px', '0px');
      el.style.setProperty('--py', '0px');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);
  return ref;
}

/** Counts a number from its previous value to the next one. */
export function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const reduced = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (reduced || from === value) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return display;
}

/** Keeps the value from the previous render, used for ▲▼ deltas. */
export function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}

/**
 * Difference against the previous value, kept stable across later re-renders
 * (flash timers, loading flags) so the delta stays visible after a switch.
 */
export function useDelta(value: number) {
  const ref = useRef(value);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    if (ref.current !== value) setDelta(value - ref.current);
    ref.current = value;
  }, [value]);
  return delta;
}

/** Adds a short border flash whenever the key changes (company / period). */
export function useFlash(key: unknown, duration = 700) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion()) return;
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), duration);
    return () => window.clearTimeout(timer);
  }, [key, duration]);
  return flash;
}

/** Tracks whether a transient panel is mounted, with an exit delay. */
export function usePresence(open: boolean, exit = 120) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    const timer = window.setTimeout(() => setMounted(false), exit);
    return () => window.clearTimeout(timer);
  }, [open, exit]);
  return mounted;
}

/** Moves a highlight rectangle between targets without animating layout. */
export function useSpotlight(target: string | null) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const measure = useCallback(() => {
    if (!target) { setRect(null); return; }
    const el = document.querySelector<HTMLElement>(target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [target]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  return rect;
}
